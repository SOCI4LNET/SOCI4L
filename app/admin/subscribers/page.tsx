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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <p className="text-xs text-muted-foreground">
          Showing {subscribers.length} of {totalCount.toLocaleString('en-US')} subscribers
        </p>
        <form action="/api/admin/export/subscribers" method="get" className="w-full sm:w-auto">
          <Button type="submit" variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </form>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Email</TableHead>
              <TableHead className="min-w-[140px] hidden sm:table-cell">Subscribed At</TableHead>
              <TableHead className="min-w-[140px] hidden md:table-cell">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-mono text-xs break-all">
                  {sub.email}
                  <div className="sm:hidden mt-1 text-muted-foreground">
                    {sub.createdAt.toISOString().slice(0, 10)}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                  {sub.createdAt.toISOString().slice(0, 10)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                  {sub.updatedAt.toISOString().slice(0, 10)}
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

