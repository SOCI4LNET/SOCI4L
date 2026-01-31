import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import {
  getDefaultAppearanceConfig,
  normalizeAppearanceConfig,
  type ProfileAppearanceConfig,
} from '@/lib/profile-appearance'
import { cookies } from 'next/headers'
import { verifyMessage, recoverMessageAddress } from 'viem'
import { getSessionAddress } from '@/lib/auth'
import { getNonce, markNonceAsUsed, isValidNonce } from '@/lib/nonce-store'

// GET: Fetch appearance config for a profile by address
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')

  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
  }

  try {
    const normalizedAddress = address.toLowerCase()

    // Find profile by address
    const profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    if (!profile || !profile.appearanceConfig) {
      // Return default appearance if profile doesn't exist or has no config
      return NextResponse.json({
        appearance: getDefaultAppearanceConfig(),
      })
    }

    // Parse appearance config
    let appearance: ProfileAppearanceConfig
    try {
      const parsed = JSON.parse(profile.appearanceConfig) as ProfileAppearanceConfig
      appearance = normalizeAppearanceConfig(parsed)
    } catch {
      appearance = getDefaultAppearanceConfig()
    }

    return NextResponse.json({
      appearance,
    })
  } catch (error) {
    console.error('Error fetching profile appearance:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `An error occurred while fetching appearance: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// POST: Save appearance config for a profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, appearance } = body

    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    if (!appearance || typeof appearance.theme !== 'string') {
      return NextResponse.json({ error: 'Invalid appearance config' }, { status: 400 })
    }

    const normalizedAddress = address.toLowerCase()

    // Normalize appearance config before saving
    const normalizedAppearance = normalizeAppearanceConfig(appearance)

    const { signature } = body

    // Authenticate: Check Session first, then Signature
    const sessionAddress = await getSessionAddress()
    let signer: string
    const cookieStore = await cookies()
    let nonce: string | null = null

    if (sessionAddress && sessionAddress === normalizedAddress) {
      signer = sessionAddress
    } else {
      // Fallback to signature auth
      if (!signature) {
        return NextResponse.json({ error: 'Signature required (or valid session)' }, { status: 400 })
      }

      // Read nonce from cookie
      nonce = cookieStore.get('aph_nonce')?.value || null

      if (!nonce) {
        return NextResponse.json(
          { error: 'Nonce not found. Please call /api/auth/nonce first.' },
          { status: 400 }
        )
      }

      // Check validation
      if (!isValidNonce(nonce)) {
        return NextResponse.json({ error: 'Nonce has already been used' }, { status: 400 })
      }

      // Build message
      const message = `Update profile appearance for ${address}. Nonce: ${nonce}`

      // Verify signature and recover signer
      try {
        signer = await recoverMessageAddress({
          message,
          signature: signature as `0x${string}`,
        })

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
    }

    const normalizedSigner = signer.toLowerCase()

    // Find or create profile
    let profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    if (profile) {
      // Check ownership if profile exists
      const effectiveOwner = profile.ownerAddress ? profile.ownerAddress.toLowerCase() : profile.address.toLowerCase()

      if (normalizedSigner !== effectiveOwner) {
        return NextResponse.json(
          { error: 'You do not have permission to update this profile' },
          { status: 403 }
        )
      }
    }

    if (!profile) {
      // Create profile if it doesn't exist (idempotent - handle race conditions)
      if (normalizedSigner !== normalizedAddress) {
        return NextResponse.json(
          { error: 'You can only configure appearance for your own address' },
          { status: 403 }
        )
      }

      try {
        profile = await prisma.profile.create({
          data: {
            address: normalizedAddress,
            status: 'UNCLAIMED',
            visibility: 'PUBLIC',
            appearanceConfig: JSON.stringify(normalizedAppearance),
          },
        })
      } catch (error: any) {
        // Handle unique constraint violation (race condition)
        if (error.code === 'P2002') {
          // Another request created it concurrently, fetch it
          profile = await prisma.profile.findUnique({
            where: { address: normalizedAddress },
          })
          if (!profile) {
            throw error // Still doesn't exist, rethrow
          }
        } else {
          throw error
        }
      }
    } else {
      // Update existing profile
      profile = await prisma.profile.update({
        where: { address: normalizedAddress },
        data: {
          appearanceConfig: JSON.stringify(normalizedAppearance),
        },
      })
    }

    // Clear nonce cookie after successful update
    // Clear nonce cookie after successful update if nonce was used
    if (nonce) {
      markNonceAsUsed(nonce)
      cookieStore.delete('aph_nonce')
    }

    // Parse and normalize saved config for response
    const savedConfig = normalizeAppearanceConfig(
      profile.appearanceConfig ? (JSON.parse(profile.appearanceConfig) as ProfileAppearanceConfig) : null
    )

    return NextResponse.json({
      success: true,
      appearance: savedConfig,
    })
  } catch (error) {
    console.error('Error saving profile appearance:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `An error occurred while saving appearance: ${errorMessage}` },
      { status: 500 }
    )
  }
}
