'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, BarChart2, Share2, TrendingUp, Eye, Lock, MousePointerClick, User, Link as LinkIcon, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { PageShell } from '@/components/app-shell/page-shell'
import { SectionHeader } from '@/components/insights/section-header'
import { KpiCard } from '@/components/insights/kpi-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  topReferrers: Array<{ name: string; count: number }>
}

type InsightsPanelProps = {
  address: string
}

export function InsightsPanel({ address }: InsightsPanelProps) {
  const router = useRouter()
  // Ensure useProfile is returning the updated type with premiumExpiresAt
  const { profile, loading: profileLoading } = useProfile(address)
  const { data: analyticsData, loading: analyticsLoading } = useInsights(address)
  const { links, loading: linksLoading } = useLinks(address)

  const loading = profileLoading || analyticsLoading || linksLoading

  const [range, setRange] = useState<TimeRange>('7d')
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
      const COOLDOWN = 10 * 60 * 1000; // 10 minutes

      if (!lastSync || now - Number(lastSync) > COOLDOWN) {
        console.log('[InsightsPanel] Triggering background premium sync...');
        // Fire and forget
        fetch('/api/cron/sync-premium')
          .then(res => res.json())
          .then(data => console.log('[InsightsPanel] Sync result:', data))
          .catch(e => console.error('[InsightsPanel] Background sync failed', e))
          .finally(() => {
            localStorage.setItem(`last_premium_sync_${address}`, now.toString());
          });
      }
    }
  }, [hasAccess, address]);


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
        topReferrers: []
      }
    }

    return {
      ...analyticsData,
      topReferrers: analyticsData.topReferrers || [],
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
              <div className="flex justify-between text-xs"><span className="text-foreground/70">Twitter / X</span><span className="text-foreground/70">856</span></div>
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

        {/* Geographic & Device Breakdown (Added to match Modal Features) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border border-border/60 shadow-sm h-48">
            <CardHeader className="pb-3"><div className="h-4 w-32 bg-foreground/10 rounded" /></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between border-b border-border/40 pb-2 text-xs">
                <span className="text-foreground/70">United States</span>
                <span className="text-foreground/70">32%</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2 text-xs">
                <span className="text-foreground/70">Turkey</span>
                <span className="text-foreground/70">18%</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2 text-xs">
                <span className="text-foreground/70">Germany</span>
                <span className="text-foreground/70">12%</span>
              </div>
            </CardContent>
          </Card>
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
              See who's viewing your profile with advanced source breakdown and detailed history.
            </p>

            <Button
              onClick={() => setShowUpgradeModal(true)}
              size="sm"
              className="bg-foreground hover:bg-foreground/90 text-background font-medium border border-white/10 shadow-sm transition-all px-8 h-9 rounded-full"
            >
              Unlock for 0.5 AVAX
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
                  <CardContent>
                    {analytics.topLinks.slice(0, 5).map((link, i) => (
                      <div key={link.id} className="flex justify-between py-2 border-b border-border/40 last:border-0 text-sm">
                        <span className="truncate max-w-[200px]">{link.title}</span>
                        <span className="font-mono">{link.clicks}</span>
                      </div>
                    ))}
                    {!analytics.topLinks.length && <div className="text-center text-xs text-muted-foreground py-4">No activity</div>}
                  </CardContent>
                </Card>
                {/* Top Categories */}
                <Card className="bg-card border border-border/60 shadow-sm">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Top Categories</CardTitle></CardHeader>
                  <CardContent>
                    {analytics.categoryRows.map((cat) => (
                      <div key={cat.id} className="flex justify-between py-2 border-b border-border/40 last:border-0 text-sm">
                        <span>{cat.name}</span>
                        <span className="font-mono">{cat.totalClicks}</span>
                      </div>
                    ))}
                    {!analytics.categoryRows.length && <div className="text-center text-xs text-muted-foreground py-4">No activity</div>}
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Activity Timeline */}
            <section className="space-y-4">
              <SectionHeader title="Recent Activity" description="Real-time event log" />
              <Card className="bg-card border border-border/60 shadow-sm">
                <CardContent className="pt-6">
                  {analytics.recentActivity.slice(0, 10).map((act, i) => (
                    <div key={i} className="flex items-center gap-3 mb-4 text-xs last:mb-0">
                      <div className={`w-2 h-2 rounded-full ${act.type === 'profile_view' ? 'bg-blue-500' : 'bg-green-500'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium capitalize flex items-center gap-1">
                            {act.type === 'profile_view' ? <Eye className="w-3 h-3" /> : <MousePointerClick className="w-3 h-3" />}
                            {act.type.replace('_', ' ')}
                          </span>
                          <span className="text-muted-foreground">{formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}</span>
                        </div>
                        {act.linkTitle && <div className="text-muted-foreground mt-0.5 truncate max-w-[200px]">{act.linkTitle}</div>}
                      </div>
                    </div>
                  ))}
                  {!analytics.recentActivity.length && <div className="text-center text-xs text-muted-foreground py-4">No activity yet</div>}
                </CardContent>
              </Card>
            </section>
          </div>
        </PremiumContent>

        <PremiumUpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          onSuccess={() => {
            setOptimisticPremium(true);
            // Trigger a sync immediately in background too
            fetch('/api/cron/sync-premium');
          }}
        />
      </div>
    </PageShell>
  )
}
