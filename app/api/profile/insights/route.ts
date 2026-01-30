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

  // Resolve address/slug
  try {
    if (slug) {
      profile = await prisma.profile.findUnique({
        where: { slug },
      })
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
      profile = await prisma.profile.findUnique({
        where: { address: normalizedAddress },
      })
    } else {
      return NextResponse.json({ error: 'Address or slug is required' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Public Insights API] Database error', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
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

    // Load analytics from database
    const totalProfileViews = await prisma.analyticsEvent.count({
      where: {
        profileId: resolvedAddress,
        type: 'profile_view',
      },
    })

    const totalLinkClicks = await prisma.analyticsEvent.count({
      where: {
        profileId: resolvedAddress,
        type: 'link_click',
      },
    })

    const ctr = totalProfileViews > 0 ? totalLinkClicks / totalProfileViews : null

    // Top links
    const linkStats = await prisma.analyticsEvent.groupBy({
      by: ['linkId'],
      where: {
        profileId: resolvedAddress,
        type: 'link_click',
        linkId: { not: null },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          linkId: 'desc',
        },
      },
      take: 5,
    })

    // Resolve link titles
    const linksMap = new Map(links.map(l => [l.id, l]))
    const topLinks = linkStats.map(stat => {
      const link = stat.linkId ? linksMap.get(stat.linkId) : null
      return {
        id: stat.linkId || 'unknown',
        title: link?.title || 'Unknown Link',
        url: link?.url || '',
        clicks: stat._count._all,
      }
    }).filter(l => l.id !== 'unknown')

    // Top categories
    const categoryStats = await prisma.analyticsEvent.groupBy({
      by: ['categoryId'],
      where: {
        profileId: resolvedAddress,
        type: 'link_click',
        categoryId: { not: null },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          categoryId: 'desc',
        },
      },
      take: 5,
    })

    // Resolve category names
    // We need to fetch categories for this profile first
    const categories = await prisma.linkCategory.findMany({
      where: { profileId: profile?.id },
    })
    const categoryMap = new Map(categories.map(c => [c.id, c]))
    const topCategories = categoryStats.map(stat => {
      const cat = stat.categoryId ? categoryMap.get(stat.categoryId) : null
      return {
        id: stat.categoryId || 'unknown',
        name: cat?.name || (stat.categoryId === 'general' ? 'General' : 'Unknown'),
        clicks: stat._count._all,
        share: totalLinkClicks > 0 ? stat._count._all / totalLinkClicks : 0,
      }
    })

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
      analytics: {
        totalProfileViews,
        totalLinkClicks,
        ctr,
        topLinks,
        topCategories,
      },
    })
  } catch (error) {
    console.error('[Public Insights API] Error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
