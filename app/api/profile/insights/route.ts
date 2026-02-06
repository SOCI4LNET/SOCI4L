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

    // Load appearance config
    let hideSelfActivity = false
    if (profile?.appearanceConfig) {
      try {
        const parsed = JSON.parse(profile.appearanceConfig)
        hideSelfActivity = parsed.hideSelfActivity === true
      } catch (error) {
        console.error('[Public Insights API] Failed to parse appearance config', error)
      }
    }

    // Common filter for self-activity
    const selfActivityFilter = hideSelfActivity ? {
      visitorWallet: { not: resolvedAddress }
    } : {}

    // Load analytics from database
    const totalProfileViews = await prisma.analyticsEvent.count({
      where: {
        profileId: resolvedAddress,
        type: 'profile_view',
        ...selfActivityFilter,
      },
    })

    const totalLinkClicks = await prisma.analyticsEvent.count({
      where: {
        profileId: resolvedAddress,
        type: 'link_click',
        ...selfActivityFilter,
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
        ...selfActivityFilter,
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

    // Resolve link titles (including social links and deleted ones)
    // We treat Prisma ProfileLink objects and Social Link objects similarly for the map
    const linksMap = new Map<string, { title: string, url: string }>()

    // 1. Add Custom Links (DB)
    links.forEach(l => {
      linksMap.set(l.id, { title: l.title, url: l.url })
    })

    // 2. Add Social Links (profile.socialLinks JSON)
    if (profile?.socialLinks) {
      try {
        const socialLinks = JSON.parse(profile.socialLinks)
        if (Array.isArray(socialLinks)) {
          socialLinks.forEach((link: any) => {
            // Match ID generation logic from frontend (app/p/[id]/page.tsx)
            const id = link.id || `social-${link.url}`

            // Determine best label
            let title = link.label
            if (!title) {
              const platform = link.platform || link.type || 'website'
              // Simple capitalization or fallback
              title = platform.charAt(0).toUpperCase() + platform.slice(1)
            }

            linksMap.set(id, {
              title: title || 'Social Link',
              url: link.url
            })
          })
        }
      } catch (e) {
        console.error('[Public Insights API] Failed to parse social links', e)
      }
    }

    // Find IDs that are NOT in current links map (deleted links)
    const deletedLinkIds = linkStats
      .map(s => s.linkId)
      .filter((id): id is string => id !== null && !linksMap.has(id))

    // Fetch details for deleted links from latest events
    const deletedLinkDetails = new Map<string, { title: string, url: string }>()

    if (deletedLinkIds.length > 0) {
      // For each deleted link, find the most recent event to get its title/url
      // We can't easily do a "distinct on" with prisma findMany for this specific case efficiently across many IDs without raw query,
      // but since we only have max 5 top links, we can just query safely.
      // Actually, we can just findFirst for each or findMany and process.
      // Given max 5 items in total list, this loop is negligible.

      await Promise.all(deletedLinkIds.map(async (id) => {
        const lastEvent = await prisma.analyticsEvent.findFirst({
          where: {
            profileId: resolvedAddress,
            linkId: id,
            linkTitle: { not: null }
          },
          orderBy: { createdAt: 'desc' },
          select: { linkTitle: true, linkUrl: true }
        })

        if (lastEvent) {
          deletedLinkDetails.set(id, {
            title: lastEvent.linkTitle || 'Unknown Link',
            url: lastEvent.linkUrl || ''
          })
        }
      }))
    }

    const topLinks = linkStats.map(stat => {
      const link = stat.linkId ? linksMap.get(stat.linkId) : null
      const deletedDetails = stat.linkId ? deletedLinkDetails.get(stat.linkId) : null

      const title = link?.title || deletedDetails?.title || 'Unknown Link'
      const url = link?.url || deletedDetails?.url || ''
      const isDeleted = !link && !!stat.linkId // If ID exists but no link record, it's deleted

      return {
        id: stat.linkId || 'unknown',
        title,
        url,
        clicks: stat._count._all,
        isDeleted,
      }
    }).filter(l => l.id !== 'unknown')

    // Top categories
    const categoryStats = await prisma.analyticsEvent.groupBy({
      by: ['categoryId'],
      where: {
        profileId: resolvedAddress,
        type: 'link_click',
        categoryId: { not: null },
        ...selfActivityFilter,
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

    // Source breakdown
    const sourceStats = await prisma.analyticsEvent.groupBy({
      by: ['source'],
      where: {
        profileId: resolvedAddress,
        type: 'profile_view', // Focus on profile view sources for now, or remove for all traffic
        ...selfActivityFilter,
      },
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          source: 'desc'
        }
      }
    })

    const sourceBreakdown: Record<string, number> = {}
    sourceStats.forEach(stat => {
      sourceBreakdown[stat.source] = stat._count._all
    })

    const recentEvents = await prisma.analyticsEvent.findMany({
      where: {
        profileId: resolvedAddress,
        ...selfActivityFilter,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    const recentActivity = recentEvents.map((event: any) => ({
      type: event.type as 'profile_view' | 'link_click',
      timestamp: event.createdAt.getTime(),
      linkTitle: event.linkTitle || undefined,
      linkId: event.linkId || undefined,
      visitorWallet: event.visitorWallet || undefined,
      referrer: event.referrer || undefined,
      source:
        event.source === 'profile' ||
          event.source === 'qr' ||
          event.source === 'copy' ||
          event.source === 'extension'
          ? (event.source as 'profile' | 'qr' | 'copy' | 'extension')
          : ('unknown' as const),
    }))

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
        recentActivity,
        sourceBreakdown,
      },
    })
  } catch (error) {
    console.error('[Public Insights API] Error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
