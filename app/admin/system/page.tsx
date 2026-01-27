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
      <div className="space-y-8">
        <div>
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wide text-muted-foreground">Database Tables</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Profiles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-semibold tracking-tight">
                  {stats.profileCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.recentProfiles > 0 && `+${stats.recentProfiles} in 24h`}
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Follows</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-semibold tracking-tight">
                  {stats.followCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.recentFollows > 0 && `+${stats.recentFollows} in 24h`}
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-semibold tracking-tight">
                  {stats.linkCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.recentLinks > 0 && `+${stats.recentLinks} in 24h`}
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Subscribers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-semibold tracking-tight">
                  {stats.subscriberCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground">Rows in EmailSubscription table</p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Analytics Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-semibold tracking-tight">
                  {stats.analyticsEventCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.recentAnalyticsEvents > 0 && `+${stats.recentAnalyticsEvents} in 24h`}
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Score Snapshots</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-semibold tracking-tight">
                  {stats.scoreSnapshotCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.recentScoreSnapshots > 0 && `+${stats.recentScoreSnapshots} in 24h`}
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-semibold tracking-tight">
                  {stats.categoryCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground">Link categories created</p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Showcase Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-semibold tracking-tight">
                  {stats.showcaseItemCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground">NFT showcase items</p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 ease-out hover:shadow-md hover:border-border/80 hover:scale-[1.01]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Admin Audit Logs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-semibold tracking-tight">
                  {stats.adminAuditLogCount.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.recentAdminAuditLogs > 0 && `+${stats.recentAdminAuditLogs} in 24h`}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wide text-muted-foreground">Admin Activity / Audit Log</h2>
          <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60">
                  <TableHead className="min-w-[120px] h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Time
                  </TableHead>
                  <TableHead className="min-w-[100px] hidden sm:table-cell h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Admin
                  </TableHead>
                  <TableHead className="min-w-[100px] h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Action
                  </TableHead>
                  <TableHead className="min-w-[100px] hidden md:table-cell h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Target
                  </TableHead>
                  <TableHead className="min-w-[150px] hidden lg:table-cell h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Details
                  </TableHead>
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
                      <TableRow
                        key={log.id}
                        className="group transition-all duration-150 ease-out hover:bg-muted/60 hover:shadow-sm border-b border-border/40"
                      >
                        <TableCell className="text-xs font-mono py-4 align-top">
                          <span className="font-medium">
                            {log.createdAt.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <div className="sm:hidden mt-1.5 text-muted-foreground text-xs">
                            {log.adminAddress.slice(0, 6)}...{log.adminAddress.slice(-4)}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs hidden sm:table-cell py-4 align-top">
                          <span className="font-medium">
                            {log.adminAddress.slice(0, 6)}...{log.adminAddress.slice(-4)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 align-top">
                          <span className="text-xs font-semibold uppercase tracking-wide">{log.action}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-4 align-top">
                          {log.targetType && log.targetId ? (
                            <span className="text-xs text-muted-foreground">
                              {log.targetType}: <span className="font-mono">{log.targetId.slice(0, 8)}...</span>
                            </span>
                          ) : log.targetType ? (
                            <span className="text-xs text-muted-foreground">{log.targetType}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground hidden lg:table-cell py-4 align-top">
                          {metadataObj.pathname ? (
                            <span
                              title={metadataObj.pathname}
                              className="hover:text-foreground transition-colors duration-200 font-mono"
                            >
                              {metadataObj.pathname}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
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

