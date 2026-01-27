'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, BarChart2, Clock, Lightbulb, ArrowRight, Share2, TrendingUp, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import { PageShell } from '@/components/app-shell/page-shell'
import {
  CustomTooltip,
  chartAxisProps,
  chartGridProps,
  chartBarProps,
  chartLineProps,
} from '@/components/insights/chart-theme'
import { SectionHeader } from '@/components/insights/section-header'
import { KpiCard } from '@/components/insights/kpi-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getEventsForProfile, getProfileViewCountBySource, type AnalyticsEvent, type AnalyticsSource } from '@/lib/analytics'
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
  sourceBreakdown: Record<AnalyticsSource, number>
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  useEffect(() => {
    // Load categories from API (not localStorage)
    const loadCategories = async () => {
      try {
        const response = await fetch(`/api/profile/categories?address=${encodeURIComponent(address)}`)
        if (response.ok) {
          const data = await response.json()
          setCategories(
            (data.categories || []).map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              order: cat.order || 0,
            }))
          )
        } else {
          // Fallback to localStorage if API fails
          setCategories(loadCategoriesFromStorage())
        }
      } catch (error) {
        console.error('[InsightsPanel] Failed to load categories from API', error)
        // Fallback to localStorage
        setCategories(loadCategoriesFromStorage())
      }
    }
    
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
            categoryId: link.categoryId || null, // Use categoryId from API
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
      loadCategories()
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
        sourceBreakdown: { profile: 0, qr: 0, copy: 0, unknown: 0 },
      }
    }

    // Normalize address to lowercase for consistent lookup
    const normalizedAddress = address.toLowerCase()
    const allEvents = getEventsForProfile(normalizedAddress)
    console.log('[InsightsPanel] Analytics data', {
      address: normalizedAddress,
      totalEvents: allEvents.length,
      linkClickEvents: allEvents.filter(e => e.type === 'link_click').length,
      profileViewEvents: allEvents.filter(e => e.type === 'profile_view').length,
      range,
      categoriesCount: categories.length,
      categories: categories.map(c => ({ id: c.id, name: c.name })),
      linksCount: links.length,
      linksWithCategory: links.filter(l => l.categoryId).length,
      linksWithoutCategory: links.filter(l => !l.categoryId).length,
    })
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

    // Calculate source breakdown for profile views
    const sourceBreakdown: Record<AnalyticsSource, number> = {
      profile: 0,
      qr: 0,
      copy: 0,
      unknown: 0,
    }
    for (const view of profileViewEventsInRange) {
      sourceBreakdown[view.source] = (sourceBreakdown[view.source] || 0) + 1
    }

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
      // Prefer categoryId from event (for historical data), fallback to link's categoryId
      const eventCategoryId = event.categoryId
      const linkCategoryId = (link as LinkItem | undefined)?.categoryId
      const rawCategoryId = eventCategoryId || linkCategoryId

      const effectiveCategoryId =
        typeof rawCategoryId === 'string' && rawCategoryId && categoryMap.has(rawCategoryId)
          ? rawCategoryId
          : GENERAL_CATEGORY_ID

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('[InsightsPanel] Category assignment', {
          linkId: event.linkId,
          eventCategoryId,
          linkCategoryId,
          rawCategoryId,
          effectiveCategoryId,
          categoryExists: categoryMap.has(effectiveCategoryId),
          availableCategories: Array.from(categoryMap.keys()),
        })
      }

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

    const result = {
      totalProfileViews,
      totalLinkClicks,
      ctr,
      hasAnyLinkClicksEver,
      topLinks,
      categoryRows,
      maxCategoryClicks,
      recentActivity,
      sourceBreakdown,
    }
    console.log('[InsightsPanel] Calculated analytics', {
      totalProfileViews: result.totalProfileViews,
      totalLinkClicks: result.totalLinkClicks,
      ctr: result.ctr,
      topLinksCount: result.topLinks.length,
      recentActivityCount: result.recentActivity.length,
    })
    return result
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

  // Prepare chart data from analytics
  const chartData = useMemo(() => {
    // For now, we'll create placeholder data structure
    // In the future, this can be enhanced with time-series data
    const sourceData = Object.entries(analytics.sourceBreakdown)
      .filter(([_, count]) => count > 0)
      .map(([source, count]) => ({
        name: source === 'profile' ? 'Profile' 
          : source === 'qr' ? 'QR Code'
          : source === 'copy' ? 'Copy Link'
          : 'Unknown',
        value: count,
      }))

    const categoryChartData = analytics.categoryRows
      .filter((row) => row.totalClicks > 0)
      .slice(0, 5)
      .map((row) => ({
        name: row.name,
        clicks: row.totalClicks,
        share: Math.round(row.percentageShare * 100),
      }))

    // Check if source data should show empty state
    // Show empty state if: no views, no source data, or only Unknown with 100%
    const shouldShowSourceEmptyState = 
      analytics.totalProfileViews === 0 ||
      sourceData.length === 0 ||
      (sourceData.length === 1 && sourceData[0].name === 'Unknown')

    return {
      sourceData,
      categoryChartData,
      shouldShowSourceEmptyState,
    }
  }, [analytics])

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--primary)) / 0.8', 'hsl(var(--primary)) / 0.6', 'hsl(var(--primary)) / 0.4', 'hsl(var(--primary)) / 0.2']

  return (
    <PageShell
      title="Insights"
      subtitle="Profile performance and interaction metrics."
    >
      <div className="space-y-8">
        {/* 1. TOP KPI SUMMARY */}
        <section className="space-y-4">
          <SectionHeader
            title="Overview"
            description="Key performance indicators at a glance"
            rightSlot={
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Time range:</span>
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
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!address || !links.length) {
                        toast.error('No address or links available')
                        return
                      }
                      const testLinkId = links[0].id
                      const { trackLinkClick } = await import('@/lib/analytics')
                      trackLinkClick(address.toLowerCase(), testLinkId, 'unknown', null)
                      toast.success('Test click event recorded. Refresh to see changes.')
                    }}
                    className="flex items-center gap-2"
                  >
                    Test Click
                  </Button>
                )}
              </div>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <KpiCard
              icon={Eye}
              label="Profile Views"
              value={totalViewsLabel}
              description="Total profile views"
            />
            <KpiCard
              icon={BarChart2}
              label="Link Clicks"
              value={totalClicksLabel}
              description="Total link clicks"
            />
            <KpiCard
              icon={TrendingUp}
              label="CTR"
              value={ctrLabel}
              description="Click-through rate"
            />
          </div>
        </section>

        {/* 2. CHARTS & TRENDS */}
        <section className="space-y-4">
          <SectionHeader
            title="Charts & Trends"
            description="Visual analytics and performance trends"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Profile Views Source Breakdown Chart */}
            <Card className="bg-card border border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Profile Views by Source</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 min-h-[220px] flex items-center justify-center">
                {chartData.shouldShowSourceEmptyState ? (
                  <div className="flex flex-col items-center justify-center text-center gap-2 w-full">
                    <Activity className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium mb-1">No source attribution yet</p>
                      <p className="text-xs text-muted-foreground">
                        {analytics.totalProfileViews === 0
                          ? 'Share your profile to start collecting analytics'
                          : 'Source tracking will appear here once available.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-transparent w-full">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={chartData.sourceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          outerRadius={60}
                          innerRadius={30}
                          fill="transparent"
                          dataKey="value"
                        >
                          {chartData.sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <text
                          x="50%"
                          y="48%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{ fontSize: '12px', fontWeight: 600, fill: 'hsl(var(--foreground))' }}
                        >
                          {analytics.totalProfileViews.toLocaleString('en-US')}
                        </text>
                        <text
                          x="50%"
                          y="52%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{ fontSize: '10px', fill: 'hsl(var(--muted-foreground))' }}
                        >
                          total views
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Performance Chart */}
            <Card className="bg-card border border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Category Performance</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 min-h-[220px] flex items-center justify-center">
                {!analytics.hasAnyLinkClicksEver || chartData.categoryChartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center gap-2 w-full">
                    <BarChart2 className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium mb-1">No category data</p>
                      <p className="text-xs text-muted-foreground">
                        {analytics.hasAnyLinkClicksEver
                          ? 'No clicks in the selected time range'
                          : 'Share your profile to start collecting clicks'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-transparent w-full">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={chartData.categoryChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid {...chartGridProps} />
                        <XAxis 
                          dataKey="name" 
                          {...chartAxisProps}
                        />
                        <YAxis 
                          {...chartAxisProps}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--foreground))', fillOpacity: 0.04 }} />
                        <Bar dataKey="clicks" fill="hsl(var(--primary))" {...chartBarProps} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 3. PERFORMANCE BREAKDOWNS */}
        <section className="space-y-4">
          <SectionHeader
            title="Performance Breakdowns"
            description="Detailed analysis by links and categories"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Links */}
            <Card className="bg-card border border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Top Links</CardTitle>
                <CardDescription className="text-xs">
                  Most clicked links in the selected time range
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                    Loading links...
                  </div>
                ) : analytics.topLinks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                    <BarChart2 className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium mb-1">
                        {analytics.hasAnyLinkClicksEver
                          ? 'No clicks in the selected time range'
                          : 'No activity yet'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {analytics.hasAnyLinkClicksEver
                          ? 'Try selecting a different time range'
                          : 'Share your profile to start tracking'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {analytics.topLinks.slice(0, 5).map((link, index) => (
                      <div
                        key={link.id}
                        className="flex items-center gap-3 rounded-md border border-border/40 bg-background/60 px-3 py-2.5 hover:bg-accent/50 transition-colors min-w-0"
                      >
                        {/* A) Sol: Rank badge (secondary/low emphasis) */}
                        <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center p-0 text-xs font-medium shrink-0">
                          {index + 1}
                        </Badge>
                        
                        {/* B) Orta: Link adı + URL (primary content) */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate mb-0.5">{link.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {link.url}
                          </p>
                          {link.categoryName && (
                            <Badge variant="outline" className="text-[10px] mt-1">
                              {link.categoryName}
                            </Badge>
                          )}
                        </div>
                        
                        {/* C) Sağ: Metric + View butonu (right actions) */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-semibold whitespace-nowrap">
                            {link.clicks.toLocaleString('en-US')}{' '}
                            <span className="text-muted-foreground font-normal">clicks</span>
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] shrink-0"
                            onClick={() => router.push(`/dashboard/${address}/links/${link.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                    {analytics.topLinks.length > 5 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          const params = new URLSearchParams()
                          params.set('tab', 'links')
                          router.push(`/dashboard/${address}?${params.toString()}`)
                        }}
                      >
                        View all {analytics.topLinks.length} links
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card className="bg-card border border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
                <CardDescription className="text-xs">
                  Category performance sorted by clicks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!analytics.hasAnyLinkClicksEver ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                    <BarChart2 className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium mb-1">No category data yet</p>
                      <p className="text-xs text-muted-foreground">
                        Share your profile to start collecting clicks
                      </p>
                    </div>
                  </div>
                ) : analytics.categoryRows.length === 0 || analytics.categoryRows.every((r) => r.totalClicks === 0) ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                    <BarChart2 className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium mb-1">No category data in this time range</p>
                      <p className="text-xs text-muted-foreground">
                        Try selecting a different time range
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {analytics.categoryRows
                      .filter((row) => row.totalClicks > 0)
                      .map((row, index) => {
                        const percentage = Math.round(row.percentageShare * 100)
                        const widthPercent =
                          analytics.maxCategoryClicks > 0
                            ? Math.max(4, (row.totalClicks / analytics.maxCategoryClicks) * 100)
                            : 0
                        const isTopCategory = index === 0

                        return (
                          <div
                            key={row.id}
                            className="rounded-md border border-border/40 bg-background/60 px-3 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer"
                            onClick={() => setSelectedCategoryId(row.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="text-xs font-medium truncate">{row.name}</p>
                                {isTopCategory && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                                    Top
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <p className="text-xs font-semibold">{row.totalClicks.toLocaleString('en-US')}</p>
                                <p className="text-[10px] text-muted-foreground">{percentage}%</p>
                              </div>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden mb-1">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{
                                  width: `${widthPercent}%`,
                                }}
                              />
                            </div>
                            {row.topLinkLabel && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                Top: {row.topLinkLabel}
                              </p>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 4. RECENT ACTIVITY TIMELINE */}
        <section className="space-y-4">
          <SectionHeader
            title="Recent Activity"
            description="Latest events timeline (privacy-first, no user identity)"
          />
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardContent className="pt-6">
              {analytics.recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <Activity className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium mb-1">No recent activity</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Share your profile to start tracking views and clicks
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/p/${address}`)}
                  >
                    <Share2 className="mr-2 h-3.5 w-3.5" />
                    View public profile
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-border/40" />
                  
                  {/* Activity items */}
                  <div className="space-y-3">
                    {analytics.recentActivity.map((activity, idx) => {
                      const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })

                      return (
                        <div
                          key={`${activity.type}-${activity.timestamp}-${idx}`}
                          className="relative flex items-center gap-3"
                        >
                          {/* Timeline dot - centered with card */}
                          <div className="relative z-10 flex items-center justify-center w-6 shrink-0">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/60 border-2 border-background" />
                          </div>
                          
                          {/* Activity card */}
                          <div className="flex-1 flex items-center gap-3 rounded-md border border-border/40 bg-background/60 px-3 py-2.5 min-w-0">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted/60 text-muted-foreground shrink-0">
                                {activity.type === 'link_click' ? (
                                  <BarChart2 className="h-3 w-3" />
                                ) : (
                                  <Activity className="h-3 w-3" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                {activity.type === 'link_click' ? (
                                  <p className="text-xs truncate">
                                    <span className="text-muted-foreground">Link clicked: </span>
                                    <span className="font-medium">{activity.linkTitle}</span>
                                  </p>
                                ) : (
                                  <p className="text-xs">
                                    <span className="font-medium">Profile viewed</span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                              {timeAgo}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Suggestions (Optional Section) */}
        {suggestions.length > 0 && (
          <section className="space-y-4">
            <SectionHeader
              title="Optimization Suggestions"
              description="AI-powered tips to improve your profile performance"
            />
            <Card className="bg-card border border-border/60 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="flex items-start gap-3 rounded-md border border-border/40 bg-background/60 px-3 py-2.5 hover:bg-accent/50 transition-colors"
                    >
                      <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed">{suggestion.message}</p>
                      </div>
                      {suggestion.action && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] shrink-0"
                        onClick={() => {
                          if (suggestion.action?.preset) {
                            router.push(`${suggestion.action.href}`)
                          } else if (suggestion.action) {
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
          </section>
        )}

        {/* Category Detail Sheet */}
        <CategoryDetailSheet
          categoryId={selectedCategoryId}
          open={selectedCategoryId !== null}
          onOpenChange={(open) => !open && setSelectedCategoryId(null)}
          address={address}
          links={links}
          categories={categories}
          analytics={analytics}
          range={range}
          router={router}
        />
      </div>
    </PageShell>
  )
}

interface CategoryDetailSheetProps {
  categoryId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  address: string
  links: LinkItem[]
  categories: LinkCategory[]
  analytics: GlobalAnalytics
  range: TimeRange
  router: ReturnType<typeof useRouter>
}

function CategoryDetailSheet({
  categoryId,
  open,
  onOpenChange,
  address,
  links,
  categories,
  analytics,
  range,
  router,
}: CategoryDetailSheetProps) {
  const category = categoryId ? categories.find((c) => c.id === categoryId) : null
  const categoryName = category?.name || (categoryId === GENERAL_CATEGORY_ID ? 'General' : 'Unknown')

  // Get links in this category with click counts
  const categoryLinks = useMemo(() => {
    if (!categoryId) return []

    const linkById = new Map<string, LinkItem>()
    links.forEach((link) => {
      linkById.set(link.id, link)
    })

    // Get all link click events for this category
    const normalizedAddress = address.toLowerCase()
    const allEvents = getEventsForProfile(normalizedAddress)
    const now = Date.now()
    const fromTs =
      range === 'all'
        ? 0
        : range === '24h'
        ? now - 24 * 60 * 60 * 1000
        : range === '7d'
        ? now - 7 * 24 * 60 * 60 * 1000
        : now - 30 * 24 * 60 * 60 * 1000

    const linkClickEventsInRange = allEvents.filter(
      (e): e is Extract<AnalyticsEvent, { type: 'link_click' }> =>
        e.type === 'link_click' && e.ts >= fromTs
    )

    // Filter events for this category
    const categoryEvents = linkClickEventsInRange.filter((event) => {
      const eventCategoryId = event.categoryId
      const linkCategoryId = linkById.get(event.linkId)?.categoryId
      const effectiveCategoryId = eventCategoryId || linkCategoryId || GENERAL_CATEGORY_ID
      return effectiveCategoryId === categoryId
    })

    // Count clicks per link
    const linkClickCounts = new Map<string, number>()
    for (const event of categoryEvents) {
      const count = linkClickCounts.get(event.linkId) || 0
      linkClickCounts.set(event.linkId, count + 1)
    }

    // Get links in this category
    const linksInCategory = links.filter((link) => {
      const linkCategoryId = link.categoryId || GENERAL_CATEGORY_ID
      return linkCategoryId === categoryId
    })

    // Create link rows with click counts
    return linksInCategory
      .map((link) => ({
        id: link.id,
        title: link.title || link.url || 'Untitled link',
        url: link.url,
        clicks: linkClickCounts.get(link.id) || 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
  }, [categoryId, links, address, range])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{categoryName}</SheetTitle>
          <SheetDescription>
            Links in this category ranked by clicks ({range}).
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {categoryLinks.length === 0 ? (
            <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
              <p className="text-sm font-medium mb-1">No links in this category</p>
              <p className="text-xs">Add links to this category to see analytics.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categoryLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-md border border-border/40 bg-background/60 px-3 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => {
                    router.push(`/dashboard/${address}/links/${link.id}`)
                    onOpenChange(false)
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{link.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{link.clicks.toLocaleString('en-US')}</p>
                      <p className="text-[10px] text-muted-foreground">clicks</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/${address}/links/${link.id}`)
                        onOpenChange(false)
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}


