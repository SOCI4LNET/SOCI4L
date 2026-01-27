import { prisma } from '@/lib/prisma'
import { PageShell } from '@/components/app-shell/page-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OverviewTrends } from '@/components/admin/overview-trends'

async function getOverviewStats() {
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.totalProfiles.toLocaleString('en-US')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.claimedProfiles.toLocaleString('en-US')} claimed (
              {profileClaimRate.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Public Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {stats.publicProfiles.toLocaleString('en-US')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Visible on public directory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New Claims (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {stats.newClaims24h.toLocaleString('en-US')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Profiles claimed in last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follows</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {stats.totalFollows.toLocaleString('en-US')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total follow relationships between profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Links</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {stats.totalLinks.toLocaleString('en-US')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Links added across all SOCI4L profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {stats.totalEmailSubscribers.toLocaleString('en-US')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Newsletter subscribers collected via SOCI4L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Views</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {stats.totalProfileViews.toLocaleString('en-US')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total profile views tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Link Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {stats.totalLinkClicks.toLocaleString('en-US')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total link clicks tracked
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <OverviewTrends trends={stats.trends} />
      </div>
    </PageShell>
  )
}

