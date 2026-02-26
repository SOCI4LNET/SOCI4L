'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, BarChart2, Share2, TrendingUp, Eye, Lock, MousePointerClick, User, Link as LinkIcon, Check, Copy, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { PageShell } from '@/components/app-shell/page-shell'
import { SectionHeader } from '@/components/insights/section-header'
import { KpiCard } from '@/components/insights/kpi-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatAddress } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useInsights } from '@/hooks/use-insights'
import { useLinks } from '@/hooks/use-links'
import { useProfile } from '@/hooks/use-profile'
import { AnalyticsSource } from '@/lib/analytics'
import { getPublicProfileHref } from '@/lib/routing'
import { PremiumUpgradeModal } from '@/components/premium/premium-upgrade-modal'

// --- Types ---
type TimeRange = '24h' | '7d' | '30d' | 'all'

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

type GlobalAnalytics = {
  totalProfileViews: number
  totalLinkClicks: number
  ctr: number | null
  hasAnyLinkClicksEver: boolean
  topLinks: TopLinkRow[]
  categoryRows: CategoryRow[]
  maxCategoryClicks: number
  recentActivity: RecentActivity[]
  sourceBreakdown: Record<AnalyticsSource, number>
  deviceBreakdown: Record<string, number>
  topReferrers: Array<{ name: string; count: number }>
}

type InsightsPanelProps = {
  address: string
}

export function InsightsPanel({ address }: InsightsPanelProps) {
  const router = useRouter()
  // Ensure useProfile is returning the updated type with premiumExpiresAt
  const { profile, loading: profileLoading } = useProfile(address)
  const [range, setRange] = useState<TimeRange>('7d')
  const { data: analyticsData, loading: analyticsLoading } = useInsights(address, range)
  const { links, loading: linksLoading } = useLinks(address)

  const loading = profileLoading || analyticsLoading || linksLoading

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // --- Premium Check ---
  const isPremium = useMemo(() => {
    if (!profile?.premiumExpiresAt) return false;
    return new Date(profile.premiumExpiresAt) > new Date();
  }, [profile?.premiumExpiresAt]);

  // Optimistic Premium State (for immediate unlock after payment)
  const [optimisticPremium, setOptimisticPremium] = useState(false);

  // Effective Premium State
  const hasAccess = isPremium || optimisticPremium;

  // --- Self-Healing Sync ---
  // If not premium (and not just optimistic), try to sync in background
  // to catch up if an event was missed or just happened.
  useEffect(() => {
    if (!hasAccess && address) {
      const lastSync = localStorage.getItem(`last_premium_sync_${address}`);
      const now = Date.now();
      const COOLDOWN = 1 * 60 * 1000; // 1 minute (more aggressive for better UX)

      if (!lastSync || now - Number(lastSync) > COOLDOWN) {
        console.log('[InsightsPanel] Triggering background premium sync (force)...');

        // Optimistically set the lock to prevent race conditions (double firing)
        localStorage.setItem(`last_premium_sync_${address}`, now.toString());

        // Fire and forget, but force=true to ensure deep scan if needed
        fetch('/api/cron/sync-premium?force=true')
          .then(res => res.json())
          .then(data => {
            console.log('[InsightsPanel] Sync result:', data)
            if (data.updatedProfiles > 0) {
              toast.success("Premium status synced!")
              router.refresh()
            }
          })
          .catch(e => {
            console.error('[InsightsPanel] Background sync failed', e)
            // If failed, maybe remove the lock so it tries again next time?
            // checking e.name !== 'AbortError' if we had specific cancellation
            localStorage.removeItem(`last_premium_sync_${address}`);
          });
      }
    }
  }, [hasAccess, address, router]);


  // When upgrade succeeds, we optimistically unlock
  // But also trigger a real sync
  const handleUpgradeSuccess = () => {
    setOptimisticPremium(true);
    toast.success("Welcome to Premium! Syncing blockchain...");
    // Trigger sync immediately
    fetch('/api/cron/sync-premium?force=true')
      .then(() => {
        setTimeout(() => {
          router.refresh()
        }, 2000)
      })
  }

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
        sourceBreakdown: { profile: 0, qr: 0, copy: 0, unknown: 0, extension: 0 } as any,
        deviceBreakdown: {},
        topReferrers: []
      }
    }

    const sourceBreakdown = analyticsData?.sourceBreakdown || {} as Record<AnalyticsSource, number>
    const deviceBreakdown = analyticsData?.deviceBreakdown || {} as Record<string, number>

    return {
      ...analyticsData,
      topReferrers: analyticsData.topReferrers || [],
      hasAnyLinkClicksEver: analyticsData.totalLinkClicks > 0,
      maxCategoryClicks: Math.max(...analyticsData.topCategories.map(c => c.clicks), 0),
      recentActivity: analyticsData.recentActivity.map(a => ({
        ...a,
        source: (a.source === 'unknown' ? 'Direct' : a.source) as AnalyticsSource || 'Direct'
      })),
      categoryRows: analyticsData.topCategories.map(c => ({
        id: c.id,
        name: c.name,
        totalClicks: c.clicks,
        percentageShare: c.share,
        topLinkLabel: c.topLinkLabel
      })),
      sourceBreakdown,
      deviceBreakdown
    }
  }, [analyticsData])

  const totalClicksLabel = analytics.totalLinkClicks.toLocaleString('en-US')
  const totalViewsLabel = analytics.totalProfileViews.toLocaleString('en-US')
  const ctrLabel = analytics.ctr != null ? `${(analytics.ctr * 100).toFixed(1)}%` : '—'

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
    }
  }

  // --- Premium Blur Wrapper ---
  const PremiumContent = ({ children }: { children: React.ReactNode }) => {
    // If user has access, show real content without blur
    if (hasAccess) return <>{children}</>;

    // MOCK DATA FOR PREVIEW (Realistic blurred content)
    const MockPreview = () => (
      <div className="space-y-8 select-none pointer-events-none filter blur-sm grayscale-[0.5] opacity-60 transition-all duration-700">
        {/* Fake Source Attribution */}
        <Card className="bg-card border-border/60 shadow-sm">
          <CardHeader className="pb-3 px-6"><div className="h-4 w-24 bg-foreground/10 rounded" /></CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs"><span className="text-foreground/70">Direct</span><span className="text-foreground/70">1,204</span></div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-foreground/30 w-[65%]" /></div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs"><span className="text-foreground/70">X</span><span className="text-foreground/70">856</span></div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-foreground/30 w-[45%]" /></div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs"><span className="text-foreground/70">Google Organic</span><span className="text-foreground/70">342</span></div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-foreground/30 w-[20%]" /></div>
            </div>
          </CardContent>
        </Card>

        {/* Fake Performance Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border border-border/60 shadow-sm h-48">
            <CardHeader className="pb-3"><div className="h-4 w-32 bg-foreground/10 rounded" /></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between border-b border-border/40 pb-2 text-xs">
                <span className="text-foreground/70">/p/0x123...890</span>
                <span className="text-foreground/70">432</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2 text-xs">
                <span className="text-foreground/70">/p/vitalik.eth</span>
                <span className="text-foreground/70">215</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2 text-xs">
                <span className="text-foreground/70">Portfolio Site</span>
                <span className="text-foreground/70">189</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border/60 shadow-sm h-48">
            <CardHeader className="pb-3"><div className="h-4 w-32 bg-foreground/10 rounded" /></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between border-b border-border/40 pb-2 text-xs">
                <span className="text-foreground/70">Social Profiles</span>
                <span className="text-foreground/70">850</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2 text-xs">
                <span className="text-foreground/70">NFT Galleries</span>
                <span className="text-foreground/70">420</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2 text-xs">
                <span className="text-foreground/70">DeFi Positions</span>
                <span className="text-foreground/70">310</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Device Breakdown (Mocking Premium Features) */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-card border border-border/60 shadow-sm h-48">
            <CardHeader className="pb-3"><div className="h-4 w-32 bg-foreground/10 rounded" /></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between border-b border-border/40 pb-2 text-xs">
                <span className="text-foreground/70">Desktop (Chrome)</span>
                <span className="text-foreground/70">54%</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2 text-xs">
                <span className="text-foreground/70">Mobile (iOS)</span>
                <span className="text-foreground/70">31%</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2 text-xs">
                <span className="text-foreground/70">Mobile (Android)</span>
                <span className="text-foreground/70">15%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );

    return (
      <div className="relative group mt-8">
        {/* Render Mock Content with Lighter Blur */}
        <MockPreview />

        {/* Minimal Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6">
          <div className="flex flex-col items-center text-center max-w-[320px]">

            {/* Icon Container */}
            <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center mb-3 ring-1 ring-border backdrop-blur-md">
              <Lock className="w-4 h-4 text-foreground/80" />
            </div>

            <h3 className="font-semibold text-lg mb-1 tracking-tight">Unlock Premium Insights</h3>
            <p className="text-xs text-muted-foreground mb-5 leading-normal max-w-[260px]">
              See who&apos;s viewing your profile with advanced source breakdown and detailed history.
            </p>

            <Button
              onClick={() => setShowUpgradeModal(true)}
              size="sm"
              className="bg-foreground hover:bg-foreground/90 text-background font-medium border border-white/10 shadow-sm transition-all px-8 h-9 rounded-full"
            >
              Get Premium Access
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageShell
      title="Insights"
      subtitle="Profile performance and interaction metrics."
    >
      <div className="space-y-8 pb-10">
        {/* 1. TOP KPI SUMMARY (Always Visible) */}
        <section className="space-y-4">
          <SectionHeader
            title="Overview"
            description="Key performance indicators at a glance"
            rightSlot={
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Time range:</span>
                <Tabs value={range} onValueChange={(value) => setRange(value as TimeRange)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="24h" className="px-2 text-xs">24h</TabsTrigger>
                    <TabsTrigger value="7d" className="px-2 text-xs">7d</TabsTrigger>
                    <TabsTrigger value="30d" className="px-2 text-xs" disabled={!hasAccess}>
                      {!hasAccess && <Lock className="w-3 h-3 mr-1 opacity-50" />} 30d
                    </TabsTrigger>
                    <TabsTrigger value="all" className="px-2 text-xs" disabled={!hasAccess}>
                      {!hasAccess && <Lock className="w-3 h-3 mr-1 opacity-50" />} All
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

        {/* 2. PREMIUM SECTIONS */}
        <PremiumContent>
          <div className="space-y-8">
            {/* Source Attribution */}
            <Card className="bg-card border-border/60 shadow-sm">
              <CardHeader className="pb-3 px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Top Sources</CardTitle>
                    <CardDescription className="text-[11px]">Traffic attribution by origin</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium opacity-70">
                    Measurable Profile
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {!analytics.totalProfileViews ? (
                  <div className="py-6 text-center text-xs text-muted-foreground italic">No data available</div>
                ) : (
                  <div className="space-y-4">
                    {/* Render simplified sources for brevity, matching previous style */}
                    {Object.entries(analytics.sourceBreakdown).map(([key, val]) => {
                      if (val === 0) return null;
                      const percentage = (val / analytics.totalProfileViews) * 100;
                      return (
                        <div key={key} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-muted-foreground capitalize">{key}</span>
                            <span className="font-mono text-foreground/80">{percentage.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Breakdowns */}
            <section className="space-y-4">
              <SectionHeader title="Performance Breakdowns" description="Detailed analysis by links and categories" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Links */}
                <Card className="bg-card border border-border/60 shadow-sm">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Top Links</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {analytics.topLinks.slice(0, 5).map((link, i) => (
                      <div key={link.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                            {i + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{link.title}</span>
                              {link.isDeleted && <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">DELETED</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{link.url}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pl-2">
                          <div className="text-xs font-mono font-medium">{link.clicks} clicks</div>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                            <a href={link.url} target="_blank" rel="noopener noreferrer">View</a>
                          </Button>
                        </div>
                      </div>
                    ))}
                    {!analytics.topLinks.length && <div className="text-center text-xs text-muted-foreground py-4">No activity</div>}
                  </CardContent>
                </Card>
                {/* Top Categories */}
                <Card className="bg-card border border-border/60 shadow-sm">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Top Categories</CardTitle></CardHeader>
                  <CardContent className="space-y-5">
                    {analytics.categoryRows.map((cat, i) => (
                      <div key={cat.id} className="space-y-2">
                        <div className="flex justify-between items-end text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{cat.name}</span>
                            {i === 0 && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-primary/10 text-primary border-primary/20">TOP</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="font-mono font-medium">{cat.totalClicks}</span>
                            <span className="text-muted-foreground w-8 text-right">{(cat.percentageShare * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-foreground rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${cat.percentageShare * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {!analytics.categoryRows.length && <div className="text-center text-xs text-muted-foreground py-4">No activity</div>}
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Device Breakdown */}
            <section className="space-y-4">
              <SectionHeader title="Device Distribution" description="Visitor traffic by device type" />
              <Card className="bg-card border-border/60 shadow-sm">
                <CardContent className="px-6 py-6">
                  {Object.keys(analytics.deviceBreakdown).length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground italic">No data available</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Simple List */}
                      <div className="space-y-4">
                        {Object.entries(analytics.deviceBreakdown)
                          .sort(([, a], [, b]) => b - a)
                          .map(([device, count]) => {
                            const total = Object.values(analytics.deviceBreakdown).reduce((a, b) => a + b, 0);
                            const percentage = (count / total) * 100;
                            return (
                              <div key={device} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${device === 'Desktop' ? 'bg-primary' : device === 'Mobile' ? 'bg-foreground/60' : 'bg-muted-foreground'}`} />
                                    <span className="font-medium text-muted-foreground">{device}</span>
                                  </div>
                                  <span className="font-mono text-foreground/80">{count} views ({percentage.toFixed(0)}%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${device === 'Desktop' ? 'bg-primary/60' : device === 'Mobile' ? 'bg-foreground/30' : 'bg-muted-foreground/30'}`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {/* Visual summary */}
                      <div className="flex items-center justify-center p-4 bg-muted/10 rounded-xl border border-border/40">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">
                            {Object.values(analytics.deviceBreakdown).reduce((a, b) => a + b, 0)}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Total Verified Views</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Activity Timeline */}
            <section className="space-y-4">
              <SectionHeader title="Recent Activity" description="Latest events timeline (verified real-time activity)" />
              <div className="space-y-2">
                {analytics.recentActivity.slice(0, 10).map((act, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-muted/10 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors">
                    {act.visitorWallet ? (
                      <Avatar className="h-9 w-9 border border-border/50">
                        <AvatarImage src={`https://effigy.im/a/${act.visitorWallet}.svg`} />
                        <AvatarFallback><User className="h-4 w-4 text-muted-foreground" /></AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center border border-border/50">
                        {act.type === 'profile_view' ? <User className="h-4 w-4 text-muted-foreground" /> : <MousePointerClick className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-foreground/90 flex items-center gap-2 flex-wrap">
                          {act.visitorWallet ? (
                            <div className="group/address relative flex items-center">
                              <div
                                className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-muted/50 border border-border/50 hover:bg-muted transition-colors cursor-pointer group-hover/address:border-foreground/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(act.visitorWallet!);
                                  toast.success('Address copied');
                                }}
                              >
                                <span className="font-mono text-xs text-foreground/80 font-medium">
                                  {formatAddress(act.visitorWallet)}
                                </span>
                                <Copy className="h-3 w-3 text-muted-foreground group-hover/address:text-foreground transition-colors" />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground opacity-0 group-hover/address:opacity-100 transition-opacity absolute -right-7"
                                asChild
                              >
                                <a href={`/p/${act.visitorWallet}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          ) : (
                            <span className="font-semibold text-foreground">Anonymous</span>
                          )}
                          <span className="text-muted-foreground">
                            {act.type === 'profile_view' ? 'viewed your Profile' : `clicked on ${act.linkTitle || 'a link'}`}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {!analytics.recentActivity.length && (
                  <Card className="bg-card border-border/60 shadow-sm">
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                      No activity recorded yet
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          </div>
        </PremiumContent>

        <PremiumUpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          onSuccess={handleUpgradeSuccess}
        />
      </div>
    </PageShell>
  )
}
