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

    // Resolve link titles (including deleted ones)
    const linksMap = new Map(links.map(l => [l.id, l]))

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

    // Load categories for this profile
    const categories = await prisma.linkCategory.findMany({
      where: { profileId: profile?.id },
    })
    const categoryMap = new Map(categories.map(c => [c.id, c]))

    const topLinks = linkStats.map(stat => {
      const link = stat.linkId ? linksMap.get(stat.linkId) : null
      const deletedDetails = stat.linkId ? deletedLinkDetails.get(stat.linkId) : null

      const title = link?.title || deletedDetails?.title || 'Unknown Link'
      const url = link?.url || deletedDetails?.url || ''
      const isDeleted = !link && !!stat.linkId // If ID exists but no link record, it's deleted

      const linkCategoryId = link?.categoryId
      const category = linkCategoryId ? categoryMap.get(linkCategoryId) : null

      return {
        id: stat.linkId || 'unknown',
        title,
        url,
        categoryName: category?.name || null,
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

    const topCategories = await Promise.all(categoryStats.map(async stat => {
      const cat = stat.categoryId ? categoryMap.get(stat.categoryId) : null

      // Find top link for this category
      let topLinkLabel: string | null = null
      if (stat.categoryId) {
        const topLinkEvent = await prisma.analyticsEvent.groupBy({
          by: ['linkId'],
          where: {
            profileId: resolvedAddress,
            categoryId: stat.categoryId,
            type: 'link_click'
          },
          _count: { _all: true },
          orderBy: { _count: { linkId: 'desc' } },
          take: 1
        })

        if (topLinkEvent.length > 0 && topLinkEvent[0].linkId) {
          const linkId = topLinkEvent[0].linkId
          const link = linksMap.get(linkId)
          // If link deleted, try to find title from event
          if (link) {
            topLinkLabel = link.title
          } else {
            const evt = await prisma.analyticsEvent.findFirst({
              where: { linkId, linkTitle: { not: null } },
              select: { linkTitle: true }
            })
            topLinkLabel = evt?.linkTitle || 'Unknown Link'
          }
        }
      }

      return {
        id: stat.categoryId || 'unknown',
        name: cat?.name || (stat.categoryId === 'general' ? 'General' : 'Unknown'),
        clicks: stat._count._all,
        share: totalLinkClicks > 0 ? stat._count._all / totalLinkClicks : 0,
        topLinkLabel
      }
    }))

    const recentEvents = await prisma.analyticsEvent.findMany({
      where: {
        profileId: resolvedAddress,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    const recentActivity = recentEvents.map(event => ({
      type: event.type as 'profile_view' | 'link_click',
      timestamp: event.createdAt.getTime(),
      linkTitle: event.linkTitle || undefined,
      linkId: event.linkId || undefined,
    }))

    // Source Breakdown
    const sourceStats = await prisma.analyticsEvent.groupBy({
      by: ['source'],
      where: {
        profileId: resolvedAddress,
        type: 'profile_view',
      },
      _count: { _all: true },
    })

    const sourceBreakdown = sourceStats.reduce((acc, stat) => {
      acc[stat.source] = stat._count._all
      return acc
    }, {} as Record<string, number>)

    // All link click counts for lookup
    const allLinkStats = await prisma.analyticsEvent.groupBy({
      by: ['linkId'],
      where: {
        profileId: resolvedAddress,
        type: 'link_click',
        linkId: { not: null },
      },
      _count: { _all: true },
    })
    const linkClickCounts = allLinkStats.reduce((acc, stat) => {
      if (stat.linkId) acc[stat.linkId] = stat._count._all
      return acc
    }, {} as Record<string, number>)

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
        linkClickCounts,
      },
    })
  } catch (error) {
    console.error('[Public Insights API] Error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
