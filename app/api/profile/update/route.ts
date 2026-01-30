import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyMessage, recoverMessageAddress } from 'viem'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import { getNonce, markNonceAsUsed, isValidNonce } from '@/lib/nonce-store'

// Test mode: allow "signed-{nonce}" format for MCP tests
const TEST_MODE = process.env.NODE_ENV === 'test' || process.env.MCP_TEST_MODE === '1'

export async function POST(request: NextRequest) {
  try {
    const { address, slug, isPublic, showcase, displayName, bio, signature } = await request.json()

    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Signature is required' },
        { status: 400 }
      )
    }

    // Validate displayName length
    if (displayName !== null && displayName !== undefined && displayName !== '') {
      const displayNameStr = String(displayName).trim()
      if (displayNameStr.length > 32) {
        return NextResponse.json(
          { error: 'Display name must be 32 characters or less' },
          { status: 400 }
        )
      }
    }

    // Validate bio length
    if (bio !== null && bio !== undefined && bio !== '') {
      const bioStr = String(bio).trim()
      if (bioStr.length > 160) {
        return NextResponse.json(
          { error: 'Bio must be 160 characters or less' },
          { status: 400 }
        )
      }
    }

    const normalizedAddress = address.toLowerCase()

    // Get nonce from cookie or store
    const cookieStore = await cookies()
    let nonce: string | null = null

    // Test mode: check if signature is "signed-{nonce}" format
    if (TEST_MODE && signature.startsWith('signed-')) {
      const extractedNonce = signature.replace('signed-', '')
      const nonceRecord = getNonce(extractedNonce)
      if (nonceRecord && !nonceRecord.used) {
        nonce = extractedNonce
      }
    }

    // Check cookie for nonce
    if (!nonce) {
      const cookieNonce = cookieStore.get('aph_nonce')?.value
      if (cookieNonce) {
        const nonceRecord = getNonce(cookieNonce)
        if (nonceRecord && !nonceRecord.used) {
          nonce = cookieNonce
        }
      }
    }

    if (!nonce) {
      return NextResponse.json(
        { error: 'Nonce not found. Please call /api/auth/nonce endpoint first.' },
        { status: 400 }
      )
    }

    // Replay protection: check if nonce is already used
    if (!isValidNonce(nonce)) {
      return NextResponse.json(
        { error: 'Nonce has already been used' },
        { status: 400 }
      )
    }

    // Verify signature and recover signer
    let signer: string
    try {
      // Test mode: if signature === "signed-{nonce}" or signature === nonce, accept it
      // In test mode, signer must match the address in the request
      if (TEST_MODE && (signature === `signed-${nonce}` || signature === nonce)) {
        signer = normalizedAddress // In test mode, signer is the address from request
      } else if (TEST_MODE && signature.startsWith('signed-')) {
        // Test mode with address: "signed-{address}-{nonce}" format
        const parts = signature.replace('signed-', '').split('-')
        if (parts.length >= 2) {
          const sigAddress = parts[0].toLowerCase()
          const sigNonce = parts.slice(1).join('-')
          if (sigNonce === nonce && sigAddress === normalizedAddress) {
            signer = normalizedAddress
          } else {
            return NextResponse.json(
              { error: 'Invalid signature' },
              { status: 400 }
            )
          }
        } else {
          return NextResponse.json(
            { error: 'Invalid signature format' },
            { status: 400 }
          )
        }
      } else {
        // Production mode: real ECDSA signature verification
        // Build message
        const message = `Update profile for ${normalizedAddress}. Nonce: ${nonce}`

        // Recover signer from signature
        signer = await recoverMessageAddress({
          message,
          signature: signature as `0x${string}`,
        })

        // Additional verification - verify that signer signed the message
        const isValid = await verifyMessage({
          address: signer as `0x${string}`,
          message,
          signature: signature as `0x${string}`,
        })

        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
          )
        }
      }
    } catch (error) {
      console.error('Signature verification error:', error)
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 400 }
      )
    }

    const normalizedSigner = signer.toLowerCase()

    // Check if profile exists
    const profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check if profile is CLAIMED
    const isClaimed = profile.status === 'CLAIMED' || profile.ownerAddress || profile.owner
    if (!isClaimed) {
      return NextResponse.json(
        { error: 'Profile not claimed yet' },
        { status: 400 }
      )
    }

    // Check ownership - signer must be the owner
    const ownerAddress = (profile.ownerAddress || profile.owner)?.toLowerCase()
    if (ownerAddress !== normalizedSigner) {
      return NextResponse.json(
        { error: 'You do not have permission to update this profile' },
        { status: 403 }
      )
    }

    // Update profile with transaction to ensure slug uniqueness
    const slugLower = slug ? slug.toLowerCase().trim() : null

    // Validate slug if provided
    if (slugLower) {
      if (slugLower.length < 3 || slugLower.length > 20) {
        return NextResponse.json(
          { error: 'Slug must be between 3 and 20 characters' },
          { status: 400 }
        )
      }

      if (!/^[a-z0-9-]+$/.test(slugLower)) {
        return NextResponse.json(
          { error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Check slug uniqueness if provided (within transaction)
      if (slugLower) {
        const existing = await tx.profile.findFirst({
          where: {
            slug: slugLower,
            NOT: { address: normalizedAddress },
          },
        })

        if (existing) {
          throw new Error('This slug is already in use')
        }
      }

      // Prepare update data
      const updateData: {
        slug?: string | null
        isPublic?: boolean
        displayName?: string | null
        bio?: string | null
      } = {}

      if (slug !== undefined) {
        updateData.slug = slugLower
      }

      if (isPublic !== undefined) {
        updateData.isPublic = isPublic
      }

      if (displayName !== undefined) {
        updateData.displayName = displayName && displayName.trim() !== '' ? displayName.trim() : null
      }

      if (bio !== undefined) {
        updateData.bio = bio && bio.trim() !== '' ? bio.trim() : null
      }

      // Update profile with unique constraint error handling
      let updatedProfile;
      try {
        updatedProfile = await tx.profile.update({
          where: { address: normalizedAddress },
          data: updateData,
        })

        // Log activity
        await tx.userActivityLog.create({
          data: {
            profileId: updatedProfile.id,
            action: 'update_profile',
            metadata: JSON.stringify({
              fields: Object.keys(updateData),
              hasShowcase: Array.isArray(showcase)
            }),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          },
        })

        return updatedProfile;
      } catch (error: any) {
        // Handle unique constraint violation
        if (error.code === 'P2002' || error.message?.includes('UNIQUE constraint') || error.message?.includes('unique')) {
          throw new Error('This slug is already in use')
        }
        throw error
      }
    })

    // Update showcase items
    if (Array.isArray(showcase)) {
      // Delete existing showcase items
      await prisma.showcaseItem.deleteMany({
        where: { profileId: updated.id },
      })

      // Create new showcase items
      if (showcase.length > 0) {
        await prisma.showcaseItem.createMany({
          data: showcase.map((item: { contractAddress: string; tokenId: string }) => ({
            profileId: updated.id,
            contractAddress: item.contractAddress.toLowerCase(),
            tokenId: item.tokenId,
          })),
        })
      }
    }

    // Mark nonce as used (replay protection)
    markNonceAsUsed(nonce)

    // Clear nonce cookie after successful update
    cookieStore.delete('aph_nonce')

    const profileWithShowcase = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
      include: { showcase: true },
    })

    return NextResponse.json({ success: true, profile: profileWithShowcase })
  } catch (error: any) {
    console.error('Error updating profile:', error)

    // Handle specific error cases
    if (error.message === 'This slug is already in use') {
      return NextResponse.json(
        { error: 'This slug is already in use' },
        { status: 400 }
      )
    }

    // Handle Prisma unique constraint violation
    if (error.code === 'P2002' || error.message?.includes('UNIQUE constraint') || error.message?.includes('unique')) {
      return NextResponse.json(
        { error: 'This slug is already in use' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while updating profile' },
      { status: 500 }
    )
  }
}
