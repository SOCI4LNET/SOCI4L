import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import {
  getDefaultProfileLayout,
  normalizeLayoutConfig,
  type ProfileLayoutConfig,
} from '@/lib/profile-layout'

// GET: Fetch layout config for a profile by address
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
      { error: `Layout alınırken bir hata oluştu: ${errorMessage}` },
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
      return NextResponse.json({ error: 'Geçersiz cüzdan adresi' }, { status: 400 })
    }

    if (!layout || !Array.isArray(layout.blocks)) {
      return NextResponse.json({ error: 'Geçersiz layout config' }, { status: 400 })
    }

    const normalizedAddress = address.toLowerCase()

    // Normalize layout config before saving
    const normalizedLayout = normalizeLayoutConfig(layout)

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
          layoutConfig: JSON.stringify(normalizedLayout),
        },
      })
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

    return NextResponse.json({
      success: true,
      layout: savedConfig,
    })
  } catch (error) {
    console.error('Error saving profile layout:', error)
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    return NextResponse.json(
      { error: `Layout kaydedilirken bir hata oluştu: ${errorMessage}` },
      { status: 500 }
    )
  }
}
