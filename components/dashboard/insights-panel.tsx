'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, BarChart2, Clock, Lightbulb, ArrowRight, Share2, TrendingUp, Eye, MousePointerClick, Copy, User, Link as LinkIcon } from 'lucide-react'
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
  Tooltip as RechartsTooltip,
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useInsights } from '@/hooks/use-insights'
import { useLinks } from '@/hooks/use-links'
import { useProfile } from '@/hooks/use-profile'
import { AnalyticsSource } from '@/lib/analytics' // Kept only type if needed, removed unused funcs
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
  isDeleted: boolean
}

type RecentActivity = {
  type: 'profile_view' | 'link_click'
  timestamp: number
  linkTitle?: string
  linkId?: string
  visitorWallet?: string
  referrer?: string
  source?: AnalyticsSource
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
  linkClickCounts: Record<string, number>
  topReferrers: Array<{ name: string; count: number }>
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
  const { profile } = useProfile(address)
  const { data: analyticsData, loading: analyticsLoading } = useInsights(address)
  const { links, categories, loading: linksLoading } = useLinks(address)

  const loading = analyticsLoading || linksLoading

  // Use layout from profile hook or fallback
  const layoutConfig = profile?.layout ? normalizeLayoutConfig(profile.layout) : getDefaultProfileLayout()

  const [range, setRange] = useState<TimeRange>('7d')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  // Backwards compatibility for the UI which expects 'GlobalAnalytics' structure
  // The hook returns 'AnalyticsData' which is very similar.
  // We might need to adapt it if there are discrepancies.

  const analytics: GlobalAnalytics = useMemo(() => {
    if (!analyticsData) {
      return {
        totalProfileViews: 0,
        totalLinkClicks: 0,
        ctr: null,
        hasAnyLinkClicksEver: false,
        topLinks: [],
        categoryRows: [],
        maxCategoryClicks: 0,
        recentActivity: [],
        sourceBreakdown: { profile: 0, qr: 0, copy: 0, unknown: 0 } as any,
        linkClickCounts: {},
        topReferrers: []
      }
    }

    return {
      ...analyticsData,
      topReferrers: analyticsData.topReferrers || [],
      // Ensure strictly typed fields match what UI expects
      hasAnyLinkClicksEver: analyticsData.totalLinkClicks > 0,
      maxCategoryClicks: Math.max(...analyticsData.topCategories.map(c => c.clicks), 0),
      recentActivity: analyticsData.recentActivity.map(a => ({
        ...a,
        source: a.source as AnalyticsSource || 'unknown'
      })),
      categoryRows: analyticsData.topCategories.map(c => ({
        id: c.id,
        name: c.name,
        totalClicks: c.clicks,
        percentageShare: c.share,
        topLinkLabel: c.topLinkLabel
      })),
      sourceBreakdown: analyticsData.sourceBreakdown as any
    }
  }, [analyticsData])

  // Placeholder for pagination if we want to keep it, 
  // but for now we rely on the 10 recent activities from hook.
  const paginatedActivity = analytics.recentActivity || []
  const hasMoreActivity = false
  const isLoadingMore = false
  const loadMoreActivity = () => { }

  // Removed complex client-side calculation.
  // We now rely on 'analytics' derived from 'useInsights' above.

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
      toast.success('Link copied')
    } catch (error) {
      toast.error('Failed to copy')
      console.error('[InsightsPanel] Failed to copy link', error)
    }
  }

  // Prepare chart data from analytics
  const chartData = useMemo(() => {
    const sourceData = [
      ...Object.entries(analytics.sourceBreakdown)
        .filter(([source, count]) => count > 0)
        .map(([source, count]) => ({
          name: source === 'profile' ? 'Direct'
            : source === 'qr' ? 'QR Code'
              : source === 'copy' ? 'Ref Link'
                : source === 'extension' ? 'Extension'
                  : 'Direct/Unknown',
          value: count,
        })),
      ...analytics.topReferrers.map(ref => ({
        name: (() => {
          try {
            return ref.name.startsWith('http') ? new URL(ref.name).hostname : ref.name
          } catch {
            return ref.name
          }
        })(),
        value: ref.count,
      }))
    ]

    // Group by name to avoid duplicates
    const groupedData = new Map<string, number>()
    sourceData.forEach(item => {
      groupedData.set(item.name, (groupedData.get(item.name) || 0) + item.value)
    })

    const finalSourceData = Array.from(groupedData.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    const categoryChartData = analytics.categoryRows
      .filter((row) => row.totalClicks > 0)
      .slice(0, 5)
      .map((row) => ({
        name: row.name,
        clicks: row.totalClicks,
        share: Math.round(row.percentageShare * 100),
      }))

    // Show empty state IF no views at all
    const shouldShowSourceEmptyState = analytics.totalProfileViews === 0

    return {
      sourceData: finalSourceData,
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
                        toast.error('No links available')
                        return
                      }
                      const testLink = links[0]
                      const { trackLinkClick } = await import('@/lib/analytics')
                      trackLinkClick(
                        address.toLowerCase(),
                        testLink.id,
                        'unknown',
                        testLink.categoryId || null,
                        testLink.title || undefined,
                        testLink.url
                      )
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

        {/* Source Attribution Section */}
        <Card className="bg-card border-border/60 shadow-sm">
          <CardHeader className="pb-3 px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Top Sources (7d)</CardTitle>
                <CardDescription className="text-[11px]">Traffic attribution by origin</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-medium opacity-70">
                Measurable Profile
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {analytics.totalProfileViews > 0 ? (
              <div className="space-y-4">
                {(() => {
                  // Internal sources that have data
                  const internalSources = (['profile', 'qr', 'copy', 'extension'] as AnalyticsSource[])
                    .filter(src => (analytics.sourceBreakdown[src] || 0) > 0)
                    .map(src => {
                      const count = analytics.sourceBreakdown[src] || 0
                      const labels: Record<string, string> = {
                        profile: 'Direct',
                        qr: 'QR Code',
                        copy: 'Ref Link',
                        extension: 'Extension'
                      }
                      return {
                        name: labels[src] || src,
                        count,
                        percentage: (count / (analytics.totalProfileViews || 1)) * 100,
                        isInternal: true
                      }
                    })

                  // External referrers (domains)
                  const externalReferrers = analytics.topReferrers.map(ref => {
                    let cleanName = ref.name
                    try {
                      if (ref.name.startsWith('http')) {
                        cleanName = new URL(ref.name).hostname
                      }
                    } catch { }

                    return {
                      name: cleanName,
                      count: ref.count,
                      percentage: (ref.count / (analytics.totalProfileViews || 1)) * 100,
                      isInternal: false
                    }
                  })

                  // Combine and sort by count
                  const allSources = [...internalSources, ...externalReferrers]
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 6) // Top 6 sources

                  // If total is 0 or no sources found, show unknown
                  if (allSources.length === 0) {
                    return (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-muted-foreground">Direct/Unknown</span>
                          <span className="font-mono text-foreground/80">100%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full" style={{ width: '100%' }} />
                        </div>
                      </div>
                    )
                  }

                  return allSources.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground break-all truncate max-w-[180px]">
                            {item.name}
                          </span>
                          {item.isInternal && (
                            <Badge variant="outline" className="text-[9px] px-1 h-3.5 font-normal opacity-50 shrink-0">
                              System
                            </Badge>
                          )}
                        </div>
                        <span className="font-mono text-foreground/80 shrink-0">{item.percentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                })()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-xs text-muted-foreground italic">
                  Some traffic sources may be unavailable
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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
                      <p className="text-sm font-medium mb-1">Some traffic sources may be unavailable</p>
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
                      <BarChart data={chartData.sourceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid {...chartGridProps} />
                        <XAxis
                          dataKey="name"
                          {...chartAxisProps}
                        />
                        <YAxis
                          {...chartAxisProps}
                        />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--foreground))', fillOpacity: 0.04 }} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" {...chartBarProps} />
                      </BarChart>
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
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--foreground))', fillOpacity: 0.04 }} />
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

                        {/* B) Middle: Link name + URL (primary content) */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-xs font-medium truncate">{link.title}</p>
                            {link.isDeleted && (
                              <Badge variant="destructive" className="h-3.5 px-1 rounded-[4px] text-[9px] font-semibold uppercase tracking-wider">
                                Deleted
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {link.url}
                          </p>
                          {link.categoryName && (
                            <Badge variant="outline" className="text-[10px] mt-1">
                              {link.categoryName}
                            </Badge>
                          )}
                        </div>

                        {/* C) Right: Metric + View button (right actions) */}
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
            description="Latest events timeline (verified real-time activity)"
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
                <div className="space-y-6">
                  <div className="relative">
                    {/* Vertical timeline line */}
                    <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-border/40" />

                    <div className="space-y-3">
                      {paginatedActivity.map((activity, idx) => {
                        const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        })

                        return (
                          <div
                            key={`${activity.type}-${activity.timestamp}-${idx}`}
                            className="relative flex items-center gap-3"
                          >
                            {/* Timeline dot - shifted to align with avatar top */}
                            <div className="relative z-10 flex items-center justify-center w-6 shrink-0 mt-3">
                              <div className="w-2 h-2 rounded-full bg-primary/40 border-2 border-background" />
                            </div>

                            {/* Activity item info */}
                            <div className="flex-1 flex items-start gap-4 rounded-xl border border-border/40 bg-background/40 p-4 transition-all hover:bg-background/60 group">
                              {/* Visitor Identity */}
                              <div className="relative shrink-0">
                                <Avatar className="h-9 w-9 border border-border/20 shadow-sm">
                                  {activity.visitorWallet ? (
                                    <>
                                      <AvatarImage src={`https://effigy.im/a/${activity.visitorWallet}.svg`} />
                                      <AvatarFallback className="text-[10px] font-mono">
                                        {activity.visitorWallet.slice(2, 4).toUpperCase()}
                                      </AvatarFallback>
                                    </>
                                  ) : (
                                    <AvatarFallback className="bg-muted">
                                      <User className="h-4 w-4 text-muted-foreground/60" />
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                {activity.type === 'link_click' ? (
                                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white border-2 border-background shadow-xs">
                                    <MousePointerClick className="h-2 w-2" />
                                  </div>
                                ) : (
                                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white border-2 border-background shadow-xs">
                                    <Eye className="h-2 w-2" />
                                  </div>
                                )}
                              </div>

                              {/* Action Content */}
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  {activity.visitorWallet ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(activity.visitorWallet!)
                                              toast.success('Address copied')
                                            }}
                                            className="font-mono text-[10px] font-medium bg-muted/80 hover:bg-muted px-1.5 py-0.5 rounded transition-colors text-foreground/80 hover:text-foreground inline-flex items-center gap-1"
                                          >
                                            {activity.visitorWallet.slice(0, 6)}...{activity.visitorWallet.slice(-4)}
                                            <Copy className="h-2 w-2 opacity-40" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Copy wallet address</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                      Anonymous
                                    </span>
                                  )}

                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    {activity.type === 'link_click' ? (
                                      <>clicked your <span className="text-foreground font-semibold">"{activity.linkTitle}"</span> link</>
                                    ) : (
                                      <>viewed your <span className="text-foreground font-semibold">Profile</span></>
                                    )}
                                  </span>
                                </div>

                                {/* Metadata & Source Row */}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground/80">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    {timeAgo}
                                  </span>

                                  {activity.referrer && (
                                    <span className="flex items-center gap-1 bg-muted/30 px-1.5 py-0.5 rounded italic">
                                      <LinkIcon className="h-2.5 w-2.5" />
                                      from {(() => {
                                        try {
                                          return new URL(activity.referrer).hostname
                                        } catch {
                                          return activity.referrer
                                        }
                                      })()}
                                    </span>
                                  )}

                                  {activity.source && activity.source !== 'unknown' && (
                                    <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase tracking-tighter border-primary/20 bg-primary/5 text-primary/70">
                                      via {activity.source}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Secondary indicator */}
                              <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {hasMoreActivity && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadMoreActivity}
                        disabled={isLoadingMore}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {isLoadingMore ? 'Loading...' : 'Load more activity'}
                      </Button>
                    </div>
                  )}
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
    </PageShell >
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

    // Get links in this category
    const linksInCategory = links.filter((link) => {
      const catId = link.categoryId || GENERAL_CATEGORY_ID
      return catId === categoryId
    })

    return linksInCategory
      .map((link) => ({
        id: link.id,
        title: link.title || link.url || 'Untitled link',
        url: link.url,
        clicks: analytics.linkClickCounts?.[link.id] || 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
  }, [categoryId, links, analytics.linkClickCounts])

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


