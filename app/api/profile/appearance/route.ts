import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import {
  getDefaultAppearanceConfig,
  normalizeAppearanceConfig,
  type ProfileAppearanceConfig,
} from '@/lib/profile-appearance'

// GET: Fetch appearance config for a profile by address
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')

  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Geçersiz cüzdan adresi' }, { status: 400 })
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
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    return NextResponse.json(
      { error: `Appearance alınırken bir hata oluştu: ${errorMessage}` },
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
      return NextResponse.json({ error: 'Geçersiz cüzdan adresi' }, { status: 400 })
    }

    if (!appearance || typeof appearance.theme !== 'string') {
      return NextResponse.json({ error: 'Geçersiz appearance config' }, { status: 400 })
    }

    const normalizedAddress = address.toLowerCase()

    // Normalize appearance config before saving
    const normalizedAppearance = normalizeAppearanceConfig(appearance)

    // Find or create profile
    let profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    if (!profile) {
      // Create profile if it doesn't exist
      profile = await prisma.profile.create({
        data: {
          address: normalizedAddress,
          status: 'UNCLAIMED',
          visibility: 'PUBLIC',
          appearanceConfig: JSON.stringify(normalizedAppearance),
        },
      })
    } else {
      // Update existing profile
      profile = await prisma.profile.update({
        where: { address: normalizedAddress },
        data: {
          appearanceConfig: JSON.stringify(normalizedAppearance),
        },
      })
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
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    return NextResponse.json(
      { error: `Appearance kaydedilirken bir hata oluştu: ${errorMessage}` },
      { status: 500 }
    )
  }
}
