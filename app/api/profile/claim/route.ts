import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyMessage } from 'viem'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import { getNonce, markNonceAsUsed, isValidNonce } from '@/lib/nonce-store'


export async function POST(request: NextRequest) {
  try {
    const { address, signature } = await request.json()

    // Address validation
    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { 
          error: 'Invalid wallet address',
          code: 'INVALID_ADDRESS'
        },
        { status: 400 }
      )
    }

    // Signature validation
    if (!signature || typeof signature !== 'string') {
      return NextResponse.json(
        { 
          error: 'Signature is required',
          code: 'MISSING_SIGNATURE'
        },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Get nonce from cookie
    let nonce: string | null = null

    const cookieStore = await cookies()
    const cookieNonce = cookieStore.get('aph_nonce')?.value
    if (cookieNonce) {
      const nonceRecord = getNonce(cookieNonce)
      if (nonceRecord && !nonceRecord.used) {
        nonce = cookieNonce
      }
    }

    // Nonce validation
    if (!nonce) {
      return NextResponse.json(
        { 
          error: 'Nonce not found or expired. Please call /api/auth/nonce first.',
          code: 'NONCE_NOT_FOUND'
        },
        { status: 400 }
      )
    }

    // Replay protection: check if nonce is already used
    if (!isValidNonce(nonce)) {
      return NextResponse.json(
        { 
          error: 'Nonce has already been used',
          code: 'NONCE_ALREADY_USED'
        },
        { status: 400 }
      )
    }

    // ECDSA signature verification
    let signatureValid = false
    let signerAddress: string | null = null

    try {
      const message = `Claim SOCI4L profile for ${normalizedAddress}. Nonce: ${nonce}`

      const isValid = await verifyMessage({
        address: normalizedAddress as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      })

      if (isValid) {
        signatureValid = true
        signerAddress = normalizedAddress
      } else {
        return NextResponse.json(
          {
            error: 'Invalid signature',
            code: 'INVALID_SIGNATURE'
          },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Signature verification error:', error)
      return NextResponse.json(
        {
          error: 'Signature verification failed',
          code: 'SIGNATURE_VERIFICATION_FAILED'
        },
        { status: 400 }
      )
    }

    if (!signatureValid || !signerAddress) {
      return NextResponse.json(
        { 
          error: 'Signature verification failed',
          code: 'SIGNATURE_VERIFICATION_FAILED'
        },
        { status: 400 }
      )
    }

    // IMPORTANT: All validations must pass before any DB write
    // Check ownership BEFORE creating/updating profile
    const existing = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
      select: {
        id: true,
        address: true,
        slug: true,
        ownerAddress: true,
        owner: true,
        status: true,
        visibility: true,
        claimedAt: true,
      },
    })

    // Ownership check: if profile exists and is CLAIMED by different address → 403
    if (existing) {
      const existingOwner = (existing.ownerAddress || existing.owner)?.toLowerCase()
      const isClaimed = existing.status === 'CLAIMED' || existingOwner

      if (isClaimed && existingOwner && existingOwner !== signerAddress) {
        // Claimed by someone else
        return NextResponse.json(
          { 
            error: 'This profile has already been claimed by another wallet',
            code: 'ALREADY_CLAIMED_BY_OTHER'
          },
          { status: 403 }
        )
      }

      // Idempotency: same address claiming again
      if (isClaimed && existingOwner === signerAddress) {
        // Mark nonce as used even for idempotent requests
        markNonceAsUsed(nonce)
        
        // Clear nonce cookie
        cookieStore.delete('aph_nonce')

        return NextResponse.json({
          address: existing.address,
          claimed: true,
          profileId: existing.id,
          updatedAt: existing.claimedAt?.toISOString() || new Date().toISOString(),
          alreadyClaimed: true,
        })
      }
    }

    // All validations passed - now mark nonce as used (before DB write)
    const nonceMarked = markNonceAsUsed(nonce)
    if (!nonceMarked) {
      // This should not happen if we checked isValidNonce, but safety check
      return NextResponse.json(
        { 
          error: 'Nonce validation failed',
          code: 'NONCE_VALIDATION_FAILED'
        },
        { status: 400 }
      )
    }

    // Now safe to write to DB
    const profile = await prisma.profile.upsert({
      where: { address: normalizedAddress },
      update: {
        ownerAddress: signerAddress.toLowerCase(),
        owner: signerAddress.toLowerCase(), // backward compatibility
        status: 'CLAIMED',
        visibility: 'PUBLIC',
        isPublic: true,
        claimedAt: new Date(),
      },
      create: {
        address: normalizedAddress,
        ownerAddress: signerAddress.toLowerCase(),
        owner: signerAddress.toLowerCase(), // backward compatibility
        status: 'CLAIMED',
        visibility: 'PUBLIC',
        isPublic: true,
        claimedAt: new Date(),
      },
    })

    // Clear nonce cookie after successful claim
    cookieStore.delete('aph_nonce')

    return NextResponse.json({
      address: profile.address,
      claimed: true,
      profileId: profile.id,
      updatedAt: profile.claimedAt?.toISOString() || new Date().toISOString(),
      alreadyClaimed: false,
    })
  } catch (error) {
    console.error('Error claiming profile:', error)
    return NextResponse.json(
      { 
        error: 'An error occurred while claiming profile',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}
