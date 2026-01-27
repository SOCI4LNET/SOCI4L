import { prisma } from '@/lib/prisma'
import { PageShell } from '@/components/app-shell/page-shell'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/admin/empty-state'
import Link from 'next/link'
import { AnalyticsTrends } from '@/components/admin/analytics-trends'
import { TrendingUp, TrendingDown, Minus, ExternalLink, Eye, MousePointerClick } from 'lucide-react'

async function getAnalytics() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const [
    totalProfiles,
    claimedProfiles,
    totalFollows,
    totalLinks,
    totalProfileViews,
    totalLinkClicks,
    topViewedRaw,
    topClickedRaw,
  ] = await Promise.all([
    prisma.profile.count(),
    prisma.profile.count({
      where: {
        OR: [
          { status: 'CLAIMED' },
          { claimedAt: { not: null } },
          { ownerAddress: { not: null } },
          { owner: { not: null } },
        ],
      },
    }),
    prisma.follow.count(),
    prisma.profileLink.count(),
    prisma.analyticsEvent.count({
      where: { type: 'profile_view' },
    }),
    prisma.analyticsEvent.count({
      where: { type: 'link_click' },
    }),
    prisma.analyticsEvent.groupBy({
      by: ['profileId'],
      where: { type: 'profile_view' },
      _count: { profileId: true },
      orderBy: { _count: { profileId: 'desc' } },
      take: 10,
    }),
    prisma.analyticsEvent.groupBy({
      by: ['linkId', 'linkTitle', 'linkUrl', 'profileId'],
      where: { type: 'link_click', linkId: { not: null } },
      _count: { linkId: true },
      orderBy: { _count: { linkId: 'desc' } },
      take: 10,
    }),
  ])

  const topViewedAddresses = topViewedRaw.map((row) => row.profileId.toLowerCase())
  const topClickedProfileIds = topClickedRaw
    .map((row) => row.profileId)
    .filter((id): id is string => Boolean(id))
    .map((id) => id.toLowerCase())

  const [topViewedProfiles, topClickedProfiles] = await Promise.all([
    prisma.profile.findMany({
      where: { address: { in: topViewedAddresses } },
    }),
    topClickedProfileIds.length > 0
      ? prisma.profile.findMany({
          where: { address: { in: topClickedProfileIds } },
        })
      : Promise.resolve([]),
  ])

  const profileByAddress = new Map(
    topViewedProfiles.map((p) => [p.address.toLowerCase(), p]),
  )
  const profileByAddressForLinks = new Map(
    topClickedProfiles.map((p) => [p.address.toLowerCase(), p]),
  )

  const topViewed = topViewedRaw.map((row) => {
    const profile = profileByAddress.get(row.profileId.toLowerCase())
    return {
      address: row.profileId,
      views: row._count.profileId,
      displayName: profile?.displayName || null,
      slug: profile?.slug || null,
    }
  })

  const topClicked = topClickedRaw.map((row) => {
    const profile = row.profileId
      ? profileByAddressForLinks.get(row.profileId.toLowerCase())
      : null
    return {
      linkId: row.linkId || null,
      linkTitle: row.linkTitle || 'Untitled Link',
      linkUrl: row.linkUrl || null,
      clicks: row._count.linkId,
      profileAddress: row.profileId || null,
      displayName: profile?.displayName || null,
      slug: profile?.slug || null,
    }
  })

  // Calculate daily trends for analytics (last 30 days)
  const dailyBuckets: Map<string, { views: number; clicks: number }> = new Map()
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const dateKey = date.toISOString().split('T')[0]
    dailyBuckets.set(dateKey, { views: 0, clicks: 0 })
  }

  // Get analytics events per day
  const analyticsEvents = await prisma.analyticsEvent.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { type: true, createdAt: true },
  })

  analyticsEvents.forEach((event) => {
    const dateKey = event.createdAt.toISOString().split('T')[0]
    const bucket = dailyBuckets.get(dateKey)
    if (bucket) {
      if (event.type === 'profile_view') {
        bucket.views++
      } else if (event.type === 'link_click') {
        bucket.clicks++
      }
    }
  })

  const trends = Array.from(dailyBuckets.entries()).map(([date, data]) => ({
    date,
    ...data,
  }))

  // Calculate trends for primary metrics (comparing last 7 days vs previous 7 days)
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const [recentProfileViews, previousProfileViews] = await Promise.all([
    prisma.analyticsEvent.count({
      where: {
        type: 'profile_view',
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        type: 'profile_view',
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
  ])

  const [recentLinkClicks, previousLinkClicks] = await Promise.all([
    prisma.analyticsEvent.count({
      where: {
        type: 'link_click',
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        type: 'link_click',
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
  ])

  const profileViewsTrend =
    previousProfileViews > 0
      ? ((recentProfileViews - previousProfileViews) / previousProfileViews) * 100
      : 0
  const linkClicksTrend =
    previousLinkClicks > 0
      ? ((recentLinkClicks - previousLinkClicks) / previousLinkClicks) * 100
      : 0

  return {
    totalProfiles,
    claimedProfiles,
    totalFollows,
    totalLinks,
    totalProfileViews,
    totalLinkClicks,
    topViewed,
    topClicked,
    trends,
    profileViewsTrend,
    linkClicksTrend,
  }
}

export default async function AdminAnalyticsPage() {
  const analytics = await getAnalytics()

  const claimRate =
    analytics.totalProfiles > 0
      ? (analytics.claimedProfiles / analytics.totalProfiles) * 100
      : 0

  return (
    <PageShell
      title="Analytics"
      subtitle="High-level engagement metrics across SOCI4L."
      mode="constrained"
    >
      {/* Primary KPIs - Engagement Metrics */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Engagement Metrics
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Profile Views - Primary */}
          <Card className="border-2 border-primary/20 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Profile Views
                </CardTitle>
                {analytics.profileViewsTrend > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                ) : analytics.profileViewsTrend < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                ) : (
                  <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-4xl font-bold tracking-tight">{analytics.totalProfileViews.toLocaleString('en-US')}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Total tracked</p>
                {Math.abs(analytics.profileViewsTrend) > 0.1 && (
                  <span
                    className={`text-xs font-medium ${
                      analytics.profileViewsTrend > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {analytics.profileViewsTrend > 0 ? '+' : ''}
                    {analytics.profileViewsTrend.toFixed(1)}% vs last week
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Link Clicks - Primary */}
          <Card className="border-2 border-primary/20 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Link Clicks
                </CardTitle>
                {analytics.linkClicksTrend > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                ) : analytics.linkClicksTrend < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                ) : (
                  <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-4xl font-bold tracking-tight">{analytics.totalLinkClicks.toLocaleString('en-US')}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Total tracked</p>
                {Math.abs(analytics.linkClicksTrend) > 0.1 && (
                  <span
                    className={`text-xs font-medium ${
                      analytics.linkClicksTrend > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {analytics.linkClicksTrend > 0 ? '+' : ''}
                    {analytics.linkClicksTrend.toFixed(1)}% vs last week
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Secondary KPIs - Platform Metrics */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Platform Metrics
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Profiles - Secondary */}
          <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <p className="text-3xl font-semibold tracking-tight">
                {analytics.totalProfiles.toLocaleString('en-US')}
              </p>
              <p className="text-xs text-muted-foreground">
                {analytics.claimedProfiles.toLocaleString('en-US')} claimed ({claimRate.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          {/* Follows - Secondary */}
          <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Follows
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <p className="text-3xl font-semibold tracking-tight">
                {analytics.totalFollows.toLocaleString('en-US')}
              </p>
              <p className="text-xs text-muted-foreground">
                Total follow relationships
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-8">
        <AnalyticsTrends trends={analytics.trends} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="transition-all duration-200 hover:shadow-md hover:border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Top Viewed Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topViewed.length === 0 ? (
              <EmptyState
                icon={Eye}
                title="No views yet"
                description="Tracking active"
                hint="Top viewed profiles will appear here"
                variant="tracking"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60">
                      <TableHead className="min-w-[200px] h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Profile
                      </TableHead>
                      <TableHead className="min-w-[100px] text-right h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Views
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {analytics.topViewed.map((row) => (
                    <TableRow
                      key={row.address}
                      className="group transition-all duration-150 ease-out hover:bg-muted/60 hover:shadow-sm border-b border-border/40"
                    >
                      <TableCell className="py-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <Link
                            href={`/p/${row.slug || row.address}`}
                            className="text-sm font-semibold hover:underline transition-colors duration-200 hover:text-primary flex items-center gap-1.5 group-hover:text-primary"
                          >
                            {row.displayName || row.address}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <span className="text-xs text-muted-foreground font-mono">
                            {row.address.slice(0, 10)}...{row.address.slice(-6)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4 align-top">
                        <span className="text-sm font-bold">
                          {row.views.toLocaleString('en-US')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md hover:border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Top Clicked Links</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topClicked.length === 0 ? (
              <EmptyState
                icon={MousePointerClick}
                title="No clicks yet"
                description="Tracking active"
                hint="Top clicked links will appear here"
                variant="tracking"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60">
                      <TableHead className="min-w-[200px] h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Link
                      </TableHead>
                      <TableHead className="min-w-[100px] text-right h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Clicks
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {analytics.topClicked.map((row, idx) => (
                    <TableRow
                      key={row.linkId || `link-${idx}`}
                      className="group transition-all duration-150 ease-out hover:bg-muted/60 hover:shadow-sm border-b border-border/40"
                    >
                      <TableCell className="py-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="text-sm font-semibold">
                            {row.linkTitle}
                          </div>
                          {row.linkUrl && (
                            <a
                              href={row.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-foreground hover:underline truncate max-w-xs transition-colors duration-200 flex items-center gap-1"
                            >
                              {row.linkUrl.length > 50 ? row.linkUrl.slice(0, 50) + '...' : row.linkUrl}
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          )}
                          {row.profileAddress && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              by{' '}
                              {row.displayName || row.slug ? (
                                <Link
                                  href={`/p/${row.slug || row.profileAddress}`}
                                  className="hover:underline hover:text-foreground transition-colors duration-200 font-medium"
                                >
                                  {row.displayName || row.slug || row.profileAddress}
                                </Link>
                              ) : (
                                <span className="font-mono">{row.profileAddress.slice(0, 10)}...</span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4 align-top">
                        <span className="text-sm font-bold">
                          {row.clicks.toLocaleString('en-US')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

