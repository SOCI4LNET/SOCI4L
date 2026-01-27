import { prisma } from '@/lib/prisma'
import { PageShell } from '@/components/app-shell/page-shell'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

async function getSubscribers() {
  const subscribers = await prisma.emailSubscription.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  const totalCount = await prisma.emailSubscription.count()

  return { subscribers, totalCount }
}

export default async function AdminSubscribersPage() {
  const { subscribers, totalCount } = await getSubscribers()

  return (
    <PageShell
      title="Subscribers"
      subtitle="Email addresses collected through SOCI4L."
      mode="constrained"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">
          Showing {subscribers.length} of {totalCount.toLocaleString('en-US')} subscribers
        </p>
        <form action="/api/admin/export/subscribers" method="get">
          <Button type="submit" variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </form>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Subscribed At</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-mono text-xs">{sub.email}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {sub.createdAt.toISOString()}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {sub.updatedAt.toISOString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableCaption>
            Showing up to 500 most recent subscribers. Use Export CSV to download all subscribers.
          </TableCaption>
        </Table>
      </div>
    </PageShell>
  )
}

