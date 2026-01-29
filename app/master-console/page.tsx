import { unstable_noStore } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { PageShell } from '@/components/app-shell/page-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OverviewTrends } from '@/components/admin/overview-trends'
import { EmptyState } from '@/components/admin/empty-state'
import { TrendingUp, TrendingDown, Minus, Eye, MousePointerClick, Users, UserPlus, Link2, Mail } from 'lucide-react'

// Force dynamic rendering since this page uses Prisma queries
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getOverviewStats() {
  unstable_noStore()
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalProfiles,
    claimedProfiles,
    publicProfiles,
    totalFollows,
    totalLinks,
    totalEmailSubscribers,
    newClaims24h,
    totalProfileViews,
    totalLinkClicks,
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
    prisma.profile.count({
      where: {
        OR: [{ visibility: 'PUBLIC' }, { isPublic: true }],
      },
    }),
    prisma.follow.count(),
    prisma.profileLink.count(),
    prisma.emailSubscription.count(),
    prisma.profile.count({
      where: {
        claimedAt: {
          gte: yesterday,
        },
      },
    }),
    prisma.analyticsEvent.count({
      where: { type: 'profile_view' },
    }),
    prisma.analyticsEvent.count({
      where: { type: 'link_click' },
    }),
  ])

  // Calculate daily trends for last 30 days
  const dailyBuckets: Map<string, { profiles: number; follows: number; links: number; views: number; clicks: number }> = new Map()
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const dateKey = date.toISOString().split('T')[0]
    dailyBuckets.set(dateKey, { profiles: 0, follows: 0, links: 0, views: 0, clicks: 0 })
  }

  // Get profiles created per day
  const profilesCreated = await prisma.profile.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { createdAt: true },
  })
  profilesCreated.forEach((profile) => {
    const dateKey = profile.createdAt.toISOString().split('T')[0]
    const bucket = dailyBuckets.get(dateKey)
    if (bucket) {
      bucket.profiles++
    }
  })

  // Get follows created per day
  const followsCreated = await prisma.follow.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { createdAt: true },
  })
  followsCreated.forEach((follow) => {
    const dateKey = follow.createdAt.toISOString().split('T')[0]
    const bucket = dailyBuckets.get(dateKey)
    if (bucket) {
      bucket.follows++
    }
  })

  // Get links created per day
  const linksCreated = await prisma.profileLink.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { createdAt: true },
  })
  linksCreated.forEach((link) => {
    const dateKey = link.createdAt.toISOString().split('T')[0]
    const bucket = dailyBuckets.get(dateKey)
    if (bucket) {
      bucket.links++
    }
  })

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
    publicProfiles,
    totalFollows,
    totalLinks,
    totalEmailSubscribers,
    newClaims24h,
    totalProfileViews,
    totalLinkClicks,
    trends,
    profileViewsTrend,
    linkClicksTrend,
  }
}

export default async function AdminOverviewPage() {
  const stats = await getOverviewStats()

  const profileClaimRate =
    stats.totalProfiles > 0 ? (stats.claimedProfiles / stats.totalProfiles) * 100 : 0

  return (
    <PageShell
      title="Admin Overview"
      subtitle="Platform-wide metrics for SOCI4L."
      mode="constrained"
    >
      {/* Primary KPIs - Engagement Metrics */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Engagement Metrics
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Profile Views - Primary */}
          <Card className="border-2 border-primary/20 bg-card shadow-sm transition-all duration-200 ease-out hover:shadow-md hover:border-primary/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Profile Views
                </CardTitle>
                {stats.profileViewsTrend > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                ) : stats.profileViewsTrend < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                ) : (
                  <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.totalProfileViews === 0 ? (
                <EmptyState
                  icon={<Eye className="h-6 w-6" />}
                  title="0"
                  description="Tracking active"
                  hint="Views will appear here as profiles are visited"
                  variant="tracking"
                />
              ) : (
                <>
                  <p className="text-4xl font-bold tracking-tight">{stats.totalProfileViews.toLocaleString('en-US')}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">Total tracked</p>
                    {Math.abs(stats.profileViewsTrend) > 0.1 && (
                      <span
                        className={`text-xs font-medium ${
                          stats.profileViewsTrend > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {stats.profileViewsTrend > 0 ? '+' : ''}
                        {stats.profileViewsTrend.toFixed(1)}% vs last week
                      </span>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Link Clicks - Primary */}
          <Card className="border-2 border-primary/20 bg-card shadow-sm transition-all duration-200 ease-out hover:shadow-md hover:border-primary/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Link Clicks
                </CardTitle>
                {stats.linkClicksTrend > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                ) : stats.linkClicksTrend < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                ) : (
                  <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.totalLinkClicks === 0 ? (
                <EmptyState
                  icon={<MousePointerClick className="h-6 w-6" />}
                  title="0"
                  description="Tracking active"
                  hint="Clicks will appear here as links are clicked"
                  variant="tracking"
                />
              ) : (
                <>
                  <p className="text-4xl font-bold tracking-tight">{stats.totalLinkClicks.toLocaleString('en-US')}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">Total tracked</p>
                    {Math.abs(stats.linkClicksTrend) > 0.1 && (
                      <span
                        className={`text-xs font-medium ${
                          stats.linkClicksTrend > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {stats.linkClicksTrend > 0 ? '+' : ''}
                        {stats.linkClicksTrend.toFixed(1)}% vs last week
                      </span>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Secondary KPIs - Platform Metrics */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Platform Metrics
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Total Profiles - Secondary */}
          <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {stats.totalProfiles === 0 ? (
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="0"
                  description="No profiles yet"
                  variant="empty"
                />
              ) : (
                <>
                  <p className="text-3xl font-semibold tracking-tight">{stats.totalProfiles.toLocaleString('en-US')}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.claimedProfiles.toLocaleString('en-US')} claimed ({profileClaimRate.toFixed(1)}%)
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Public Profiles - Secondary */}
          <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Public Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {stats.publicProfiles === 0 ? (
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="0"
                  description="No public profiles"
                  variant="empty"
                />
              ) : (
                <>
                  <p className="text-3xl font-semibold tracking-tight">
                    {stats.publicProfiles.toLocaleString('en-US')}
                  </p>
                  <p className="text-xs text-muted-foreground">Visible on public directory</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* New Claims - Secondary */}
          <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                New Claims (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {stats.newClaims24h === 0 ? (
                <EmptyState
                  icon={<UserPlus className="h-6 w-6" />}
                  title="0"
                  description="No new claims"
                  hint="Last 24 hours"
                  variant="empty"
                />
              ) : (
                <>
                  <p className="text-3xl font-semibold tracking-tight">
                    {stats.newClaims24h.toLocaleString('en-US')}
                  </p>
                  <p className="text-xs text-muted-foreground">Profiles claimed in last 24 hours</p>
                </>
              )}
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
              {stats.totalFollows === 0 ? (
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="0"
                  description="No follows yet"
                  variant="empty"
                />
              ) : (
                <>
                  <p className="text-3xl font-semibold tracking-tight">
                    {stats.totalFollows.toLocaleString('en-US')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total follow relationships
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Profile Links - Secondary */}
          <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Profile Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {stats.totalLinks === 0 ? (
                <EmptyState
                  icon={<Link2 className="h-6 w-6" />}
                  title="0"
                  description="No links added"
                  variant="empty"
                />
              ) : (
                <>
                  <p className="text-3xl font-semibold tracking-tight">
                    {stats.totalLinks.toLocaleString('en-US')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Links across all profiles
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Email Subscribers - Secondary */}
          <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email Subscribers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {stats.totalEmailSubscribers === 0 ? (
                <EmptyState
                  icon={<Mail className="h-6 w-6" />}
                  title="0"
                  description="No subscribers yet"
                  variant="empty"
                />
              ) : (
                <>
                  <p className="text-3xl font-semibold tracking-tight">
                    {stats.totalEmailSubscribers.toLocaleString('en-US')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Newsletter subscribers
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <OverviewTrends trends={stats.trends} />
      </div>
    </PageShell>
  )
}

