import { prisma } from '@/lib/prisma'
import { PageShell } from '@/components/app-shell/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
    adminAuditLogCount,
  ] = await Promise.all([
    prisma.profile.count(),
    prisma.follow.count(),
    prisma.profileLink.count(),
    prisma.emailSubscription.count(),
    prisma.analyticsEvent.count(),
    prisma.scoreSnapshot.count(),
    prisma.linkCategory.count(),
    prisma.showcaseItem.count(),
    prisma.adminAuditLog.count(),
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
    recentAdminAuditLogs,
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
    prisma.adminAuditLog.count({
      where: { createdAt: { gte: yesterday } },
    }),
  ])

  // Get recent admin audit logs (last 50)
  const recentAuditLogs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return {
    profileCount,
    followCount,
    linkCount,
    subscriberCount,
    analyticsEventCount,
    scoreSnapshotCount,
    categoryCount,
    showcaseItemCount,
    adminAuditLogCount,
    recentProfiles,
    recentFollows,
    recentLinks,
    recentAnalyticsEvents,
    recentScoreSnapshots,
    recentAdminAuditLogs,
    auditLogs: recentAuditLogs,
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

            <Card>
              <CardHeader>
                <CardTitle>Admin Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {stats.adminAuditLogCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.recentAdminAuditLogs > 0 && `+${stats.recentAdminAuditLogs} in 24h`}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium mb-4">Admin Activity / Audit Log</h2>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-8">
                      No admin activity logged yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.auditLogs.map((log) => {
                    let metadataObj: any = {}
                    try {
                      if (log.metadata) {
                        metadataObj = JSON.parse(log.metadata)
                      }
                    } catch {
                      // ignore parse errors
                    }

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs font-mono">
                          {log.createdAt.toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.adminAddress.slice(0, 6)}...{log.adminAddress.slice(-4)}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium">{log.action}</span>
                        </TableCell>
                        <TableCell>
                          {log.targetType && log.targetId ? (
                            <span className="text-xs text-muted-foreground">
                              {log.targetType}: {log.targetId.slice(0, 8)}...
                            </span>
                          ) : log.targetType ? (
                            <span className="text-xs text-muted-foreground">{log.targetType}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {metadataObj.pathname ? (
                            <span title={metadataObj.pathname}>{metadataObj.pathname}</span>
                          ) : (
                            <span>—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

