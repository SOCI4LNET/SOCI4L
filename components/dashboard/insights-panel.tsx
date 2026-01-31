'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, BarChart2, Clock, Lightbulb, ArrowRight, Share2, TrendingUp, Eye, MousePointerClick } from 'lucide-react'
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
import { useInsights } from '@/hooks/use-insights'
import { useLinks, type LinkItem } from '@/hooks/use-links'
import { useProfile } from '@/hooks/use-profile'
import { type ProfilePreset } from '@/lib/profile-layout'
import { getPublicProfileHref } from '@/lib/routing'

const GENERAL_CATEGORY_ID = '__general'

type TimeRange = '24h' | '7d' | '30d' | 'all'

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
  ctr: number | null
  hasAnyLinkClicksEver: boolean
  topLinks: Array<{
    id: string
    title: string
    url: string
    categoryName: string | null
    clicks: number
    isDeleted: boolean
  }>
  categoryRows: Array<{
    id: string
    name: string
    totalClicks: number
    percentageShare: number
    topLinkLabel: string | null
  }>
  maxCategoryClicks: number
  recentActivity: Array<{
    type: 'profile_view' | 'link_click'
    timestamp: number
    linkTitle?: string
    linkId?: string
  }>
  sourceBreakdown: Record<string, number>
  linkClickCounts: Record<string, number>
}

type InsightsPanelProps = {
  address: string
}


export function InsightsPanel({ address }: InsightsPanelProps) {
  const router = useRouter()
  const [range, setRange] = useState<TimeRange>('7d')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  // Data Hooks
  const { data: insightsData, loading: insightsLoading } = useInsights(address)
  const { links, loading: linksLoading } = useLinks(address)
  const { profile, loading: profileLoading } = useProfile(address)

  const layoutConfig = profile?.layout || null

  const loading = insightsLoading || linksLoading || profileLoading

  // Prepare Analytics Object
  const analytics: GlobalAnalytics = useMemo(() => {
    if (!insightsData) {
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
        linkClickCounts: {},
      }
    }

    // Map topCategories to categoryRows shape
    const categoryRows = insightsData.topCategories.map(c => ({
      id: c.id,
      name: c.name,
      totalClicks: c.clicks,
      percentageShare: c.share,
      topLinkLabel: c.topLinkLabel
    }))

    const maxCategoryClicks = Math.max(...categoryRows.map(r => r.totalClicks), 0)

    // Ensure source breakdown has defaults
    const defaultSourceBreakdown = { profile: 0, qr: 0, copy: 0, unknown: 0 }
    const sourceBreakdown = { ...defaultSourceBreakdown, ...insightsData.sourceBreakdown }

    const hasAnyLinkClicksEver = insightsData.totalLinkClicks > 0 // Approximation, or check if total > 0

    return {
      totalProfileViews: insightsData.totalProfileViews,
      totalLinkClicks: insightsData.totalLinkClicks,
      ctr: insightsData.ctr,
      hasAnyLinkClicksEver,
      topLinks: insightsData.topLinks,
      categoryRows,
      maxCategoryClicks,
      recentActivity: insightsData.recentActivity,
      sourceBreakdown,
      linkClickCounts: insightsData.linkClickCounts || {},
    }
  }, [insightsData])

  const chartData = useMemo(() => {
    const sourceData = Object.entries(analytics.sourceBreakdown).map(([name, value]) => {
      const labels: Record<string, string> = {
        profile: 'Direct',
        qr: 'QR Code',
        copy: 'Referrer',
        unknown: 'Unknown'
      }
      return { name: labels[name] || name, value: value || 0 }
    })

    // Filter out zero values for cleaner chart
    const activeSourceData = sourceData.filter(d => d.value > 0)

    const categoryChartData = analytics.categoryRows
      .filter(r => r.totalClicks > 0)
      .map(r => ({ name: r.name, clicks: r.totalClicks }))
      .slice(0, 5) // Top 5

    return {
      sourceData: activeSourceData,
      categoryChartData,
      shouldShowSourceEmptyState: activeSourceData.length === 0
    }
  }, [analytics])

  // NOTE: Server-side API filtering by Range ('7d' etc) is not yet implemented in useInsights hook (it fetches all?).
  // The API route `api/profile/insights` currently does NOT accept a 'range' param (except limit/offset).
  // The current logic in `InsightsPanel` (previous) did client-side filtering.
  // The new hook returns specific metrics which might be "All Time" or "7d"?
  // The mock data suggests fixed numbers.
  // The API implementation (Step 1578) returns ALL counts (via prisma.count). It DOES NOT filter by date.
  // So `range` selector currently does nothing but is kept for UI.
  // To implement Range, we would need to update API to accept ?range=... and filter queries.
  // For now, we display "All Time" data regardless of selector, or we can just hide selector?
  // Let's keep selector but note that data might be static/all-time for now.


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
      const linksBlock = layoutConfig.blocks.find((b: any) => b.key === 'links')
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
                {(['profile', 'qr', 'copy', 'unknown'] as string[]).map((src) => {
                  const count = analytics.sourceBreakdown[src] || 0
                  const percentage = analytics.totalProfileViews > 0
                    ? (count / analytics.totalProfileViews) * 100
                    : 0

                  const sourceLabels: Record<string, string> = {
                    profile: 'Direct',
                    qr: 'QR Code',
                    copy: 'Referrer',
                    unknown: 'Unknown'
                  }

                  const sourceHints: Record<string, string | null> = {
                    profile: null,
                    qr: 'Use on physical assets',
                    copy: 'Best for social bios',
                    unknown: null
                  }

                  if (count === 0 && src !== 'unknown') return null

                  return (
                    <div key={src} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">{sourceLabels[src]}</span>
                          {sourceHints[src] && (
                            <Badge variant="outline" className="text-[9px] px-1 h-4 font-normal text-muted-foreground/70 border-border/40">
                              {sourceHints[src]}
                            </Badge>
                          )}
                        </div>
                        <span className="font-mono text-foreground/80">{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
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
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--foreground))', fillOpacity: 0.04 }} />
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
                <div className="space-y-6">
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
                                      <span className="font-medium">{activity.linkTitle || 'Unknown Link'}</span>
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
          categoryName={analytics.categoryRows.find(c => c.id === selectedCategoryId)?.name || 'Category'}
          linkClickCounts={analytics.linkClickCounts || {}}
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
  categoryName: string
  linkClickCounts: Record<string, number>
  router: ReturnType<typeof useRouter>
}



function CategoryDetailSheet({
  categoryId,
  open,
  onOpenChange,
  address,
  links,
  categoryName,
  linkClickCounts,
  router,
}: CategoryDetailSheetProps) {

  // Get links in this category with click counts
  const categoryLinks = useMemo(() => {
    if (!categoryId) return []

    // Filter links for this category
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
        clicks: linkClickCounts[link.id] || 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
  }, [categoryId, links, linkClickCounts])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{categoryName}</SheetTitle>
          <SheetDescription>
            Links in this category ranked by clicks
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


