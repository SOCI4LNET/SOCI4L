import { prisma } from '@/lib/prisma'
import { PageShell } from '@/components/app-shell/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function getSystemStats() {
  const [
    profileCount,
    followCount,
    linkCount,
    subscriberCount,
    analyticsEventCount,
    scoreSnapshotCount,
    categoryCount,
    showcaseItemCount,
  ] = await Promise.all([
    prisma.profile.count(),
    prisma.follow.count(),
    prisma.profileLink.count(),
    prisma.emailSubscription.count(),
    prisma.analyticsEvent.count(),
    prisma.scoreSnapshot.count(),
    prisma.linkCategory.count(),
    prisma.showcaseItem.count(),
  ])

  // Get recent activity counts (last 24h)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const [
    recentProfiles,
    recentFollows,
    recentLinks,
    recentAnalyticsEvents,
    recentScoreSnapshots,
  ] = await Promise.all([
    prisma.profile.count({
      where: { createdAt: { gte: yesterday } },
    }),
    prisma.follow.count({
      where: { createdAt: { gte: yesterday } },
    }),
    prisma.profileLink.count({
      where: { createdAt: { gte: yesterday } },
    }),
    prisma.analyticsEvent.count({
      where: { createdAt: { gte: yesterday } },
    }),
    prisma.scoreSnapshot.count({
      where: { createdAt: { gte: yesterday } },
    }),
  ])

  return {
    profileCount,
    followCount,
    linkCount,
    subscriberCount,
    analyticsEventCount,
    scoreSnapshotCount,
    categoryCount,
    showcaseItemCount,
    recentProfiles,
    recentFollows,
    recentLinks,
    recentAnalyticsEvents,
    recentScoreSnapshots,
  }
}

export default async function AdminSystemPage() {
  const stats = await getSystemStats()

  return (
    <PageShell
      title="System"
      subtitle="High-level system health for SOCI4L."
      mode="constrained"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-medium mb-4">Database Tables</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {stats.profileCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.recentProfiles > 0 && `+${stats.recentProfiles} in 24h`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Follows</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {stats.followCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.recentFollows > 0 && `+${stats.recentFollows} in 24h`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Links</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {stats.linkCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.recentLinks > 0 && `+${stats.recentLinks} in 24h`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscribers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {stats.subscriberCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Rows in EmailSubscription table</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {stats.analyticsEventCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.recentAnalyticsEvents > 0 && `+${stats.recentAnalyticsEvents} in 24h`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score Snapshots</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {stats.scoreSnapshotCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.recentScoreSnapshots > 0 && `+${stats.recentScoreSnapshots} in 24h`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {stats.categoryCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Link categories created</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Showcase Items</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {stats.showcaseItemCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">NFT showcase items</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

