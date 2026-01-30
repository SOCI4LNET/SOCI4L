import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyMessage, recoverMessageAddress } from 'viem'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { address, slug, signature } = await request.json()

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Signature is required' },
        { status: 400 }
      )
    }

    // Validate slug
    if (slug !== null && slug !== undefined && slug !== '') {
      const slugStr = String(slug).trim().toLowerCase()

      // Slug validation: 3-20 chars, only [a-z0-9-]
      if (slugStr.length < 3 || slugStr.length > 20) {
        return NextResponse.json(
          { error: 'Slug must be between 3 and 20 characters' },
          { status: 400 }
        )
      }

      if (!/^[a-z0-9-]+$/.test(slugStr)) {
        return NextResponse.json(
          { error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
          { status: 400 }
        )
      }

      // Check if slug is already taken by another profile
      const existingProfile = await prisma.profile.findUnique({
        where: { slug: slugStr },
      })

      if (existingProfile && existingProfile.address.toLowerCase() !== address.toLowerCase()) {
        return NextResponse.json(
          { error: 'This slug is already taken' },
          { status: 400 }
        )
      }
    }

    // Read nonce from cookie
    const cookieStore = await cookies()
    const nonce = cookieStore.get('aph_nonce')?.value

    if (!nonce) {
      return NextResponse.json(
        { error: 'Nonce not found. Please call /api/auth/nonce endpoint first.' },
        { status: 400 }
      )
    }

    // Build message
    const normalizedSlug = slug ? String(slug).trim().toLowerCase() : ''
    const message = `Set slug for ${address} to ${normalizedSlug || '(empty)'}. Nonce: ${nonce}`

    // Verify signature and recover signer
    let signer: string
    try {
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
    } catch (error) {
      console.error('Signature verification error:', error)
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()
    const normalizedSigner = signer.toLowerCase()

    // Fetch Profile by address
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

    // Check ownership
    const ownerAddress = (profile.ownerAddress || profile.owner)?.toLowerCase()
    if (ownerAddress !== normalizedSigner) {
      return NextResponse.json(
        { error: 'You do not have permission to update this profile' },
        { status: 403 }
      )
    }

    // Update profile slug with transaction to ensure atomicity and uniqueness
    const finalSlug = slug && slug.trim() !== '' ? String(slug).trim().toLowerCase() : null

    // Use transaction to ensure atomicity and prevent race conditions
    const updatedProfile = await prisma.$transaction(async (tx) => {
      // Double-check slug uniqueness right before update (within transaction)
      if (finalSlug) {
        const existingProfileWithSlug = await tx.profile.findUnique({
          where: { slug: finalSlug },
        })

        // If slug is taken by another profile, reject
        if (existingProfileWithSlug && existingProfileWithSlug.address.toLowerCase() !== normalizedAddress) {
          throw new Error('This slug is already taken')
        }
      }

      // Get current profile to check if we need to clear old slug
      const currentProfile = await tx.profile.findUnique({
        where: { address: normalizedAddress },
      })

      if (!currentProfile) {
        throw new Error('Profile not found')
      }

      // Update profile slug
      // If setting a new slug, ensure old slug is cleared first
      try {
        return await tx.profile.update({
          where: { address: normalizedAddress },
          data: {
            slug: finalSlug,
          },
        })
      } catch (error: any) {
        // Handle unique constraint violation (SQLite error code 2067 or Prisma error)
        if (error.code === 'P2002' || error.message?.includes('UNIQUE constraint') || error.message?.includes('unique')) {
          throw new Error('This slug is already taken')
        }
        throw error
      }
    })

    // Clear nonce cookie after successful update
    cookieStore.delete('aph_nonce')

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedProfile.id,
        address: updatedProfile.address,
        slug: updatedProfile.slug,
        status: updatedProfile.status,
        visibility: updatedProfile.visibility,
        ownerAddress: updatedProfile.ownerAddress,
        claimedAt: updatedProfile.claimedAt,
      },
    })
  } catch (error: any) {
    console.error('Error updating slug:', error)

    // Handle specific error cases
    if (error.message === 'This slug is already taken') {
      return NextResponse.json(
        { error: 'This slug is already taken' },
        { status: 400 }
      )
    }

    // Handle Prisma unique constraint violation
    if (error.code === 'P2002' || error.message?.includes('UNIQUE constraint') || error.message?.includes('unique')) {
      return NextResponse.json(
        { error: 'This slug is already taken' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while updating slug' },
      { status: 500 }
    )
  }
}
