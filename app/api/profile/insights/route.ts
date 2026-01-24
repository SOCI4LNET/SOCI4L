import { NextRequest, NextResponse } from 'next/server'
import { isValidAddress } from '@/lib/utils'
import { getProfileByAddress, getProfileBySlug } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import {
  getDefaultProfileLayout,
  normalizeLayoutConfig,
  type ProfileLayoutConfig,
} from '@/lib/profile-layout'

/**
 * Public Insights API endpoint
 * Returns read-only analytics data for a profile
 * 
 * Note: Currently analytics are stored client-side in localStorage,
 * so this endpoint returns empty data. In a production system,
 * analytics should be stored server-side in the database.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')
  const slug = searchParams.get('slug')

  let resolvedAddress: string | null = null
  let profile = null

  // If slug is provided, resolve it to address
  if (slug) {
    profile = await getProfileBySlug(slug)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    resolvedAddress = profile.address
  } else if (address) {
    if (!isValidAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }
    const normalizedAddress = address.toLowerCase()
    resolvedAddress = normalizedAddress
    profile = await getProfileByAddress(normalizedAddress)
  } else {
    return NextResponse.json({ error: 'Address or slug is required' }, { status: 400 })
  }

  if (!resolvedAddress) {
    return NextResponse.json({ error: 'Could not resolve address' }, { status: 400 })
  }

  try {
    // Load profile links
    const links = await prisma.profileLink.findMany({
      where: {
        profile: {
          address: resolvedAddress,
        },
        enabled: true,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    // Load layout config
    let layoutConfig: ProfileLayoutConfig = getDefaultProfileLayout()
    if (profile?.layoutConfig) {
      try {
        const parsed = JSON.parse(profile.layoutConfig) as ProfileLayoutConfig
        layoutConfig = normalizeLayoutConfig(parsed)
      } catch (error) {
        console.error('[Public Insights API] Failed to parse layout config', error)
      }
    }

    // TODO: Load analytics from database when analytics are moved server-side
    // For now, return empty analytics data
    // Analytics are currently stored client-side in localStorage

    return NextResponse.json({
      profile: profile
        ? {
            address: profile.address,
            slug: profile.slug,
            displayName: profile.displayName,
            bio: profile.bio,
          }
        : null,
      links: links.map((link) => ({
        id: link.id,
        title: link.title || '',
        url: link.url,
        enabled: link.enabled,
        order: link.order,
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString(),
      })),
      layout: layoutConfig,
      // Empty analytics data (client-side only for now)
      analytics: {
        totalProfileViews: 0,
        totalLinkClicks: 0,
        ctr: null,
        topLinks: [],
        topCategories: [],
      },
    })
  } catch (error) {
    console.error('[Public Insights API] Error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
