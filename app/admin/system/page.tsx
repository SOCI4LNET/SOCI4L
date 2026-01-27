import { prisma } from '@/lib/prisma'
import { PageShell } from '@/components/app-shell/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function getSystemStats() {
  const [profileCount, followCount, linkCount, subscriberCount] = await Promise.all([
    prisma.profile.count(),
    prisma.follow.count(),
    prisma.profileLink.count(),
    prisma.emailSubscription.count(),
  ])

  return {
    profileCount,
    followCount,
    linkCount,
    subscriberCount,
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {stats.profileCount.toLocaleString('en-US')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Rows in Profile table</p>
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
            <p className="text-xs text-muted-foreground mt-1">Rows in Follow table</p>
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
            <p className="text-xs text-muted-foreground mt-1">Rows in ProfileLink table</p>
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
      </div>
    </PageShell>
  )
}

