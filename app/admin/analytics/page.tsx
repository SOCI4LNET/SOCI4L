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
import Link from 'next/link'

async function getAnalytics() {
  const [
    totalProfiles,
    claimedProfiles,
    totalFollows,
    totalLinks,
    topFollowedRaw,
    topLinkOwnersRaw,
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
    prisma.follow.groupBy({
      by: ['followingAddress'],
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 10,
    }),
    prisma.profileLink.groupBy({
      by: ['profileId'],
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 10,
    }),
  ])

  const topFollowAddresses = topFollowedRaw.map((row) => row.followingAddress.toLowerCase())
  const topLinkProfileIds = topLinkOwnersRaw.map((row) => row.profileId)

  const [topFollowProfiles, topLinkProfiles] = await Promise.all([
    prisma.profile.findMany({
      where: { address: { in: topFollowAddresses } },
    }),
    prisma.profile.findMany({
      where: { id: { in: topLinkProfileIds } },
    }),
  ])

  const profileByAddress = new Map(
    topFollowProfiles.map((p) => [p.address.toLowerCase(), p]),
  )
  const profileById = new Map(topLinkProfiles.map((p) => [p.id, p]))

  const topFollowed = topFollowedRaw.map((row) => {
    const profile = profileByAddress.get(row.followingAddress.toLowerCase())
    return {
      address: row.followingAddress,
      followers: row._count._all,
      displayName: profile?.displayName || null,
      slug: profile?.slug || null,
    }
  })

  const topLinkOwners = topLinkOwnersRaw.map((row) => {
    const profile = profileById.get(row.profileId)
    return {
      profileId: row.profileId,
      links: row._count._all,
      address: profile?.address || null,
      displayName: profile?.displayName || null,
      slug: profile?.slug || null,
    }
  })

  return {
    totalProfiles,
    claimedProfiles,
    totalFollows,
    totalLinks,
    topFollowed,
    topLinkOwners,
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {analytics.totalProfiles.toLocaleString('en-US')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.claimedProfiles.toLocaleString('en-US')} claimed (
              {claimRate.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follows</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {analytics.totalFollows.toLocaleString('en-US')}
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
            <p className="text-2xl font-semibold">
              {analytics.totalLinks.toLocaleString('en-US')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Links added across all SOCI4L profiles
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Followed Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topFollowed.length === 0 ? (
              <p className="text-xs text-muted-foreground">No follow data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile</TableHead>
                    <TableHead>Followers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topFollowed.map((row) => (
                    <TableRow key={row.address}>
                      <TableCell>
                        <div className="flex flex-col">
                          <Link
                            href={`/p/${row.slug || row.address}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {row.displayName || row.address}
                          </Link>
                          <span className="text-xs text-muted-foreground font-mono">
                            {row.address}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold">
                          {row.followers.toLocaleString('en-US')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Link Owners</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topLinkOwners.length === 0 ? (
              <p className="text-xs text-muted-foreground">No link data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile</TableHead>
                    <TableHead>Links</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topLinkOwners.map((row) => (
                    <TableRow key={row.profileId}>
                      <TableCell>
                        <div className="flex flex-col">
                          {row.address ? (
                            <Link
                              href={`/p/${row.slug || row.address}`}
                              className="text-sm font-medium hover:underline"
                            >
                              {row.displayName || row.address}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground">
                              Unknown profile
                            </span>
                          )}
                          {row.address && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {row.address}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold">
                          {row.links.toLocaleString('en-US')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

