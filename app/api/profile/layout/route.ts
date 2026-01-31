import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import {
  getDefaultProfileLayout,
  normalizeLayoutConfig,
  type ProfileLayoutConfig,
} from '@/lib/profile-layout'
import { cookies } from 'next/headers'
import { verifyMessage, recoverMessageAddress } from 'viem'

// GET: Fetch layout config for a profile by address
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

    if (!profile || !profile.layoutConfig) {
      // Return default layout if profile doesn't exist or has no config
      return NextResponse.json({
        layout: getDefaultProfileLayout(),
      })
    }

    // Parse layout config
    let layout: ProfileLayoutConfig
    try {
      const parsed = JSON.parse(profile.layoutConfig) as ProfileLayoutConfig
      // Validate and normalize
      if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
        layout = getDefaultProfileLayout()
      } else {
        layout = normalizeLayoutConfig(parsed)
      }
    } catch {
      layout = getDefaultProfileLayout()
    }

    return NextResponse.json({
      layout,
    })
  } catch (error) {
    console.error('Error fetching profile layout:', error)
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    return NextResponse.json(
      { error: `An error occurred while fetching layout: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// POST: Save layout config for a profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, layout } = body

    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    if (!layout || !Array.isArray(layout.blocks)) {
      return NextResponse.json({ error: 'Invalid layout config' }, { status: 400 })
    }

    const normalizedAddress = address.toLowerCase()

    // Normalize layout config before saving
    const normalizedLayout = normalizeLayoutConfig(layout)

    const { signature } = body

    if (!signature) {
      return NextResponse.json({ error: 'Signature required' }, { status: 400 })
    }

    // Read nonce from cookie
    const cookieStore = await cookies()
    const nonce = cookieStore.get('aph_nonce')?.value

    if (!nonce) {
      return NextResponse.json(
        { error: 'Nonce not found. Please call /api/auth/nonce first.' },
        { status: 400 }
      )
    }

    // Build message
    const message = `Update profile layout for ${address}. Nonce: ${nonce}`

    // Verify signature and recover signer
    let signer: string
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

    const normalizedSigner = signer.toLowerCase()

    // Find or create profile
    let profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    if (profile) {
      // Check ownership if profile exists
      // If claimed, check ownerAddress. If unclaimed, check address itself.
      const ownerAddress = (profile.ownerAddress || profile.address).toLowerCase()

      // Allow if signer is the owner OR if signer is the profile address (self-update)
      // Note: For unclaimed profiles, ownerAddress might be null, so check address too.
      // But purely based on business logic: only the 'owner' should update.
      // If strict ownership is required:
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
      // For new profiles, the signer MUST be the address itself
      if (normalizedSigner !== normalizedAddress) {
        return NextResponse.json(
          { error: 'You can only create a layout for your own address' },
          { status: 403 }
        )
      }

      try {
        profile = await prisma.profile.create({
          data: {
            address: normalizedAddress,
            status: 'UNCLAIMED',
            visibility: 'PUBLIC',
            layoutConfig: JSON.stringify(normalizedLayout),
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
          layoutConfig: JSON.stringify(normalizedLayout),
        },
      })
    }

    // Parse and normalize saved config for response
    const savedConfig = normalizeLayoutConfig(
      JSON.parse(profile.layoutConfig || '{}') as ProfileLayoutConfig
    )

    // Clear nonce cookie after successful update
    cookieStore.delete('aph_nonce')

    return NextResponse.json({
      success: true,
      layout: savedConfig,
    })
  } catch (error) {
    console.error('Error saving profile layout:', error)
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    return NextResponse.json(
      { error: `An error occurred while saving layout: ${errorMessage}` },
      { status: 500 }
    )
  }
}
