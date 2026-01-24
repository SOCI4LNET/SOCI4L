'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, BarChart2, Clock, Lightbulb, ArrowRight, Share2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

import { PageShell } from '@/components/app-shell/page-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { getEventsForProfile, type AnalyticsEvent } from '@/lib/analytics'
import {
  LINK_CATEGORIES_STORAGE_KEY,
  type LinkCategory,
  type StoredLinkCategoriesState,
} from '@/lib/link-categories'
import {
  getDefaultProfileLayout,
  normalizeLayoutConfig,
  type ProfileLayoutConfig,
  type ProfilePreset,
} from '@/lib/profile-layout'
import { getPublicProfileHref } from '@/lib/routing'

type TimeRange = '24h' | '7d' | '30d' | 'all'

type LinkItem = {
  id: string
  title: string
  url: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  // Optional category reference (added in links category system)
  categoryId?: string | null
}

type StoredLinksState = {
  version: number
  updatedAt: string
  links: LinkItem[]
}

type CategoryRow = {
  id: string
  name: string
  totalClicks: number
  percentageShare: number
  topLinkLabel: string | null
}

type TopLinkRow = {
  id: string
  title: string
  url: string
  categoryName: string | null
  clicks: number
}

type RecentActivity = {
  type: 'profile_view' | 'link_click'
  timestamp: number
  linkTitle?: string
  linkId?: string
}

type Suggestion = {
  id: string
  message: string
  action?: {
    label: string
    href: string
    preset?: ProfilePreset
  }
}

type GlobalAnalytics = {
  totalProfileViews: number
  totalLinkClicks: number
  ctr: number | null // clicks / views
  hasAnyLinkClicksEver: boolean
  topLinks: TopLinkRow[]
  categoryRows: CategoryRow[]
  maxCategoryClicks: number
  recentActivity: RecentActivity[]
}

type InsightsPanelProps = {
  address: string
}

const LINKS_PRIMARY_STORAGE_KEY = 'soci4l.links.v1'
const LINKS_LEGACY_STORAGE_KEY = 'soci4l.profileLinks.v1'
const GENERAL_CATEGORY_ID = '__general'

function loadLinksFromStorage(): LinkItem[] {
  if (typeof window === 'undefined') return []

  try {
    let raw = window.localStorage.getItem(LINKS_PRIMARY_STORAGE_KEY)

    if (!raw) {
      raw = window.localStorage.getItem(LINKS_LEGACY_STORAGE_KEY)
    }

    if (!raw) return []

    const parsed = JSON.parse(raw) as Partial<StoredLinksState> | null
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.links)) {
      return []
    }

    return parsed.links
      .filter(
        (link): link is LinkItem =>
          !!link &&
          typeof link.id === 'string' &&
          typeof link.url === 'string' &&
          typeof link.enabled === 'boolean'
      )
      .map((link) => ({
        ...link,
        title: link.title || '',
        createdAt: link.createdAt || new Date().toISOString(),
        updatedAt: link.updatedAt || new Date().toISOString(),
      }))
  } catch (error) {
    console.error('[InsightsPanel] Failed to load links from localStorage', error)
    return []
  }
}

function loadCategoriesFromStorage(): LinkCategory[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(LINK_CATEGORIES_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as Partial<StoredLinkCategoriesState> | null
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.categories)) {
      return []
    }

    return parsed.categories
      .filter(
        (cat): cat is LinkCategory =>
          !!cat && typeof cat.id === 'string' && typeof cat.name === 'string'
      )
      .sort((a, b) => a.order - b.order)
  } catch (error) {
    console.error('[InsightsPanel] Failed to load link categories from localStorage', error)
    return []
  }
}

export function InsightsPanel({ address }: InsightsPanelProps) {
  const router = useRouter()
  const [range, setRange] = useState<TimeRange>('7d')
  const [links, setLinks] = useState<LinkItem[]>([])
  const [categories, setCategories] = useState<LinkCategory[]>([])
  const [layoutConfig, setLayoutConfig] = useState<ProfileLayoutConfig | null>(null)
  const [profile, setProfile] = useState<{ slug?: string | null } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setCategories(loadCategoriesFromStorage())
    
    // Load links from API
    const loadLinks = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/profile/links?address=${encodeURIComponent(address)}`)
        if (!response.ok) {
          throw new Error('Failed to load links')
        }
        const data = await response.json()
        setLinks(
          (data.links || []).map((link: any) => ({
            id: link.id,
            title: link.title || '',
            url: link.url,
            enabled: link.enabled,
            categoryId: null, // Categories not yet in DB schema
            createdAt: link.createdAt || new Date().toISOString(),
            updatedAt: link.updatedAt || new Date().toISOString(),
          }))
        )
      } catch (error) {
        console.error('[InsightsPanel] Failed to load links from API', error)
        // Fallback to localStorage
        setLinks(loadLinksFromStorage())
      } finally {
        setLoading(false)
      }
    }

    if (address) {
      loadLinks()
      
      // Load layout config for suggestions
      const loadLayout = async () => {
        try {
          const response = await fetch(`/api/profile/layout?address=${encodeURIComponent(address)}`)
          if (response.ok) {
            const data = await response.json()
            setLayoutConfig(data.layout || getDefaultProfileLayout())
          }
        } catch (error) {
          console.error('[InsightsPanel] Failed to load layout config', error)
        }
      }
      loadLayout()

      // Load profile for share URL
      const loadProfile = async () => {
        try {
          const response = await fetch(`/api/wallet?address=${encodeURIComponent(address)}`)
          if (response.ok) {
            const data = await response.json()
            if (data.profile) {
              setProfile({ slug: data.profile.slug })
            }
          }
        } catch (error) {
          console.error('[InsightsPanel] Failed to load profile', error)
        }
      }
      loadProfile()
    } else {
      setLoading(false)
    }
  }, [address])

  const analytics: GlobalAnalytics = useMemo(() => {
    if (!address) {
      return {
        totalProfileViews: 0,
        totalLinkClicks: 0,
        ctr: null,
        hasAnyLinkClicksEver: false,
        topLinks: [],
        categoryRows: [],
        maxCategoryClicks: 0,
        recentActivity: [],
      }
    }

    const allEvents = getEventsForProfile(address)
    const now = Date.now()

    const fromTs =
      range === 'all'
        ? 0
        : range === '24h'
        ? now - 24 * 60 * 60 * 1000
        : range === '7d'
        ? now - 7 * 24 * 60 * 60 * 1000
        : now - 30 * 24 * 60 * 60 * 1000

    const allLinkClickEvents = allEvents.filter(
      (e): e is Extract<AnalyticsEvent, { type: 'link_click' }> => e.type === 'link_click'
    )
    const allProfileViewEvents = allEvents.filter(
      (e): e is Extract<AnalyticsEvent, { type: 'profile_view' }> => e.type === 'profile_view'
    )

    const hasAnyLinkClicksEver = allLinkClickEvents.length > 0

    const linkClickEventsInRange =
      range === 'all'
        ? allLinkClickEvents
        : allLinkClickEvents.filter((e) => e.ts >= fromTs)

    const profileViewEventsInRange =
      range === 'all'
        ? allProfileViewEvents
        : allProfileViewEvents.filter((e) => e.ts >= fromTs)

    const totalProfileViews = profileViewEventsInRange.length
    const totalLinkClicks = linkClickEventsInRange.length
    const ctr = totalProfileViews > 0 ? totalLinkClicks / totalProfileViews : null

    const linkById = new Map<string, LinkItem>()
    links.forEach((link) => {
      linkById.set(link.id, link)
    })

    const categoryById = new Map<string, LinkCategory>()
    categories.forEach((cat) => {
      categoryById.set(cat.id, cat)
    })

    // Calculate top links by clicks
    const linkClickCounts = new Map<string, number>()
    for (const event of linkClickEventsInRange) {
      const count = linkClickCounts.get(event.linkId) || 0
      linkClickCounts.set(event.linkId, count + 1)
    }

    const topLinks: TopLinkRow[] = Array.from(linkClickCounts.entries())
      .map(([linkId, clicks]) => {
        const link = linkById.get(linkId)
        if (!link) return null

        const categoryId = link.categoryId
        const category = categoryId ? categoryById.get(categoryId) : null

        return {
          id: linkId,
          title: link.title || link.url || 'Untitled link',
          url: link.url,
          categoryName: category?.name || null,
          clicks,
        }
      })
      .filter((row): row is TopLinkRow => row !== null)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10) // Top 10

    // Recent activity (last 10 events, all types)
    const allEventsInRange = [
      ...profileViewEventsInRange.map((e) => ({ ...e, type: 'profile_view' as const })),
      ...linkClickEventsInRange.map((e) => ({ ...e, type: 'link_click' as const })),
    ]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 10)

    const recentActivity: RecentActivity[] = allEventsInRange.map((event) => {
      if (event.type === 'link_click') {
        const link = linkById.get(event.linkId)
        return {
          type: 'link_click' as const,
          timestamp: event.ts,
          linkTitle: link?.title || link?.url || 'Untitled link',
          linkId: event.linkId,
        }
      } else {
        return {
          type: 'profile_view' as const,
          timestamp: event.ts,
        }
      }
    })

    type CategoryBucket = {
      id: string
      name: string
      isGeneral: boolean
      totalClicks: number
      linkClickCounts: Map<string, number>
    }

    const categoryMap = new Map<string, CategoryBucket>()

    for (const cat of categories) {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        isGeneral: false,
        totalClicks: 0,
        linkClickCounts: new Map(),
      })
    }

    // General fallback bucket
    categoryMap.set(GENERAL_CATEGORY_ID, {
      id: GENERAL_CATEGORY_ID,
      name: 'General',
      isGeneral: true,
      totalClicks: 0,
      linkClickCounts: new Map(),
    })

    for (const event of linkClickEventsInRange) {
      const link = linkById.get(event.linkId)
      const rawCategoryId = (link as LinkItem | undefined)?.categoryId

      const effectiveCategoryId =
        typeof rawCategoryId === 'string' && rawCategoryId && categoryMap.has(rawCategoryId)
          ? rawCategoryId
          : GENERAL_CATEGORY_ID

      const bucket = categoryMap.get(effectiveCategoryId)
      if (!bucket) continue

      bucket.totalClicks += 1
      const prev = bucket.linkClickCounts.get(event.linkId) ?? 0
      bucket.linkClickCounts.set(event.linkId, prev + 1)
    }

    const allClicksInRange = linkClickEventsInRange.length

    const categoryRows: CategoryRow[] = []
    let maxCategoryClicks = 0

    for (const bucket of categoryMap.values()) {
      const totalClicks = bucket.totalClicks
      maxCategoryClicks = Math.max(maxCategoryClicks, totalClicks)

      const percentageShare =
        allClicksInRange > 0 && totalClicks > 0 ? totalClicks / allClicksInRange : 0

      let topLinkLabel: string | null = null
      if (bucket.linkClickCounts.size > 0) {
        let topLinkId: string | null = null
        let topClickCount = -1

        for (const [linkId, count] of bucket.linkClickCounts.entries()) {
          if (count > topClickCount) {
            topClickCount = count
            topLinkId = linkId
          }
        }

        if (topLinkId) {
          const link = linkById.get(topLinkId)
          topLinkLabel = link?.title || link?.url || 'Untitled link'
        }
      }

      categoryRows.push({
        id: bucket.id,
        name: bucket.name,
        totalClicks,
        percentageShare,
        topLinkLabel,
      })
    }

    // Sort categories by total clicks (desc)
    categoryRows.sort((a, b) => b.totalClicks - a.totalClicks)

    return {
      totalProfileViews,
      totalLinkClicks,
      ctr,
      hasAnyLinkClicksEver,
      topLinks,
      categoryRows,
      maxCategoryClicks,
      recentActivity,
    }
  }, [address, range, links, categories])

  // Generate suggestions based on analytics and layout config
  const suggestions: Suggestion[] = useMemo(() => {
    const result: Suggestion[] = []

    // Rule 1: CTR < 5% and views > 50 → Suggest Links Only/Minimal preset
    if (
      analytics.ctr !== null &&
      analytics.ctr < 0.05 &&
      analytics.totalProfileViews > 50
    ) {
      result.push({
        id: 'low-ctr',
        message: `CTR is ${(analytics.ctr * 100).toFixed(1)}% with ${analytics.totalProfileViews} views. Try 'Links Only' or 'Minimal' preset to increase click focus.`,
        action: {
          label: 'Open Builder',
          href: `/dashboard/${address}?tab=builder`,
          preset: 'links_only',
        },
      })
    }

    // Rule 2: Category > 60% clicks → Suggest moving to top
    const topCategory = analytics.categoryRows.find((row) => row.totalClicks > 0)
    if (
      topCategory &&
      topCategory.percentageShare > 0.6 &&
      topCategory.id !== GENERAL_CATEGORY_ID
    ) {
      result.push({
        id: 'dominant-category',
        message: `'${topCategory.name}' category has ${Math.round(topCategory.percentageShare * 100)}% of clicks. Consider moving it to the top of your links.`,
        action: {
          label: 'Optimize',
          href: `/dashboard/${address}?tab=links&category=${topCategory.id}`,
        },
      })
    }

    // Rule 3: Links with 0 clicks and totalClicks > 20 → Suggest cleanup
    if (analytics.totalLinkClicks > 20) {
      const linksWithClicks = new Set(analytics.topLinks.map((l) => l.id))
      const zeroClickLinks = links.filter(
        (link) => !linksWithClicks.has(link.id) && link.enabled
      )
      if (zeroClickLinks.length > 0) {
        result.push({
          id: 'zero-click-links',
          message: `${zeroClickLinks.length} link${zeroClickLinks.length > 1 ? 's' : ''} have 0 clicks. Consider hiding or moving low-performing links.`,
          action: {
            label: 'Manage Links',
            href: `/dashboard/${address}?tab=links`,
          },
        })
      }
    }

    // Rule 4: Links block disabled but clicks exist → Suggest enabling
    if (layoutConfig) {
      const linksBlock = layoutConfig.blocks.find((b) => b.key === 'links')
      if (
        linksBlock &&
        !linksBlock.enabled &&
        analytics.hasAnyLinkClicksEver
      ) {
        result.push({
          id: 'links-block-disabled',
          message: 'Links block is disabled but you have click history. Enable it to show links on your profile.',
          action: {
            label: 'Open Builder',
            href: `/dashboard/${address}?tab=builder&focus=links`,
          },
        })
      }
    }

    // Rule 5: No events → Suggest sharing
    if (
      !analytics.hasAnyLinkClicksEver &&
      analytics.totalProfileViews === 0
    ) {
      result.push({
        id: 'no-events',
        message: 'Share your profile to start collecting insights.',
        action: {
          label: 'View Profile',
          href: `/p/${address}`,
        },
      })
    }

    return result
  }, [analytics, layoutConfig, links, address])

  const handleOpenInBuilder = (categoryId: string) => {
    const params = new URLSearchParams()
    params.set('tab', 'builder')
    params.set('focus', 'links')
    if (categoryId !== GENERAL_CATEGORY_ID) {
      params.set('category', categoryId)
    }

    router.push(`/dashboard/${address}?${params.toString()}`)
  }

  const totalClicksLabel = analytics.totalLinkClicks.toLocaleString('en-US')
  const totalViewsLabel = analytics.totalProfileViews.toLocaleString('en-US')
  const ctrLabel = analytics.ctr != null ? `${(analytics.ctr * 100).toFixed(1)}%` : '—'

  // Get public insights URL
  const publicInsightsUrl = useMemo(() => {
    if (!address) return null
    const profileHref = getPublicProfileHref(address, profile?.slug || null)
    return `${profileHref}/insights`
  }, [address, profile?.slug])

  const handleShareInsights = async () => {
    if (!publicInsightsUrl) {
      toast.error('Unable to generate share link')
      return
    }

    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${publicInsightsUrl}` : publicInsightsUrl

    try {
      await navigator.clipboard.writeText(fullUrl)
      toast.success('Insights link copied')
    } catch (error) {
      toast.error('Failed to copy link')
      console.error('[InsightsPanel] Failed to copy link', error)
    }
  }

  return (
    <PageShell
      title="Insights"
      subtitle="Profil performansı ve etkileşim metrikleri."
    >
      <div className="space-y-6">
        {/* Time range selector */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Zaman aralığı</span>
          </div>
          <div className="flex items-center gap-3">
            <Tabs value={range} onValueChange={(value) => setRange(value as TimeRange)}>
              <TabsList className="h-8">
                <TabsTrigger value="24h" className="px-2 text-xs">
                  24h
                </TabsTrigger>
                <TabsTrigger value="7d" className="px-2 text-xs">
                  7d
                </TabsTrigger>
                <TabsTrigger value="30d" className="px-2 text-xs">
                  30d
                </TabsTrigger>
                <TabsTrigger value="all" className="px-2 text-xs">
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareInsights}
              className="flex items-center gap-2"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share Insights
            </Button>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Profile Views
              </CardTitle>
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-semibold">{totalViewsLabel}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border/60 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Link Clicks
              </CardTitle>
              <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-semibold">{totalClicksLabel}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                CTR
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-semibold">{ctrLabel}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Click-through rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Links */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Top Links</CardTitle>
            <CardDescription className="text-xs">
              Most clicked links in the selected time range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                Loading links...
              </div>
            ) : analytics.topLinks.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                {analytics.hasAnyLinkClicksEver
                  ? 'No clicks in the selected time range.'
                  : 'No activity yet. Share your profile to start tracking.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground">
                      <th className="py-2 text-left font-medium">Link</th>
                      <th className="py-2 text-left font-medium">Category</th>
                      <th className="py-2 text-right font-medium">Clicks</th>
                      <th className="py-2 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topLinks.map((link) => (
                      <tr key={link.id} className="border-b border-border/40 last:border-0">
                        <td className="py-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{link.title}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{link.url}</p>
                          </div>
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {link.categoryName || '—'}
                        </td>
                        <td className="py-2 text-right font-medium">
                          {link.clicks.toLocaleString('en-US')}
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => router.push(`/dashboard/${address}/links/${link.id}`)}
                            >
                              Details
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => {
                                // Navigate to Links panel (where links are actually managed)
                                const linkItem = links.find((l) => l.id === link.id)
                                const categoryId = linkItem?.categoryId
                                const params = new URLSearchParams()
                                params.set('tab', 'links')
                                if (link.id) params.set('link', link.id)
                                if (categoryId) params.set('category', categoryId)
                                router.push(`/dashboard/${address}?${params.toString()}`)
                              }}
                            >
                              Optimize
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
            <CardDescription className="text-xs">
              Category performance sorted by clicks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!analytics.hasAnyLinkClicksEver ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                No activity yet. Share your profile to start tracking.
              </div>
            ) : analytics.categoryRows.length === 0 || analytics.categoryRows.every((r) => r.totalClicks === 0) ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                No category data in the selected time range.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground">
                      <th className="py-2 text-left font-medium">Category</th>
                      <th className="py-2 text-right font-medium">Clicks</th>
                      <th className="py-2 text-right font-medium">Share</th>
                      <th className="py-2 w-32"></th>
                      <th className="py-2 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.categoryRows
                      .filter((row) => row.totalClicks > 0)
                      .map((row) => {
                        const percentage = Math.round(row.percentageShare * 100)
                        const widthPercent =
                          analytics.maxCategoryClicks > 0
                            ? Math.max(4, (row.totalClicks / analytics.maxCategoryClicks) * 100)
                            : 0

                        return (
                          <tr key={row.id} className="border-b border-border/40 last:border-0">
                            <td className="py-2">
                              <p className="font-medium">{row.name}</p>
                            </td>
                            <td className="py-2 text-right font-medium">
                              {row.totalClicks.toLocaleString('en-US')}
                            </td>
                            <td className="py-2 text-right text-muted-foreground">
                              {percentage}%
                            </td>
                            <td className="py-2">
                              <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{
                                    width: `${widthPercent}%`,
                                  }}
                                />
                              </div>
                            </td>
                            <td className="py-2 text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[11px]"
                                onClick={() => {
                                  // Navigate to Links panel for category optimization
                                  const params = new URLSearchParams()
                                  params.set('tab', 'links')
                                  if (row.id !== GENERAL_CATEGORY_ID) {
                                    params.set('category', row.id)
                                  }
                                  router.push(`/dashboard/${address}?${params.toString()}`)
                                }}
                              >
                                Optimize
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <CardDescription className="text-xs">
              Last 10 events (privacy-first, no user identity).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recentActivity.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                No activity yet. Share your profile to start tracking.
              </div>
            ) : (
              <div className="space-y-2">
                {analytics.recentActivity.map((activity, idx) => {
                  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                  })

                  return (
                    <div
                      key={`${activity.type}-${activity.timestamp}-${idx}`}
                      className="flex items-center gap-3 rounded-md border border-border/40 bg-background/60 px-3 py-2 text-xs"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
                        {activity.type === 'link_click' ? (
                          <BarChart2 className="h-3 w-3" />
                        ) : (
                          <Activity className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {activity.type === 'link_click' ? (
                          <p className="truncate">
                            Someone clicked{' '}
                            <span className="font-medium">{activity.linkTitle}</span>
                          </p>
                        ) : (
                          <p>Profile viewed</p>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {timeAgo}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Suggestions</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Optimization tips based on your analytics data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="flex items-start gap-3 rounded-md border border-border/40 bg-background/60 px-3 py-2.5 text-xs"
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">{suggestion.message}</p>
                    </div>
                    {suggestion.action && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px] shrink-0"
                        onClick={() => {
                          if (suggestion.action?.preset) {
                            // Apply preset via Builder
                            router.push(`${suggestion.action.href}`)
                            // Note: Preset application would need to be handled in Builder
                          } else {
                            router.push(suggestion.action.href)
                          }
                        }}
                      >
                        {suggestion.action.label}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  )
}


