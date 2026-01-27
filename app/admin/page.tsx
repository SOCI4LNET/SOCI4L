import { prisma } from '@/lib/prisma'
import { PageShell } from '@/components/app-shell/page-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

async function getOverviewStats() {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [
    totalProfiles,
    claimedProfiles,
    publicProfiles,
    totalFollows,
    totalLinks,
    totalEmailSubscribers,
    newClaims24h,
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
  ])

  return {
    totalProfiles,
    claimedProfiles,
    publicProfiles,
    totalFollows,
    totalLinks,
    totalEmailSubscribers,
    newClaims24h,
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
      </div>
    </PageShell>
  )
}

