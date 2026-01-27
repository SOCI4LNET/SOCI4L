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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <p className="text-xs text-muted-foreground">
          Showing {subscribers.length} of {totalCount.toLocaleString('en-US')} subscribers
        </p>
        <form action="/api/admin/export/subscribers" method="get" className="w-full sm:w-auto">
          <Button type="submit" variant="outline" size="sm" className="gap-2 w-full sm:w-auto transition-all duration-200 hover:bg-accent hover:text-accent-foreground">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </form>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60">
              <TableHead className="min-w-[200px] h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </TableHead>
              <TableHead className="min-w-[140px] hidden sm:table-cell h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Subscribed At
              </TableHead>
              <TableHead className="min-w-[140px] hidden md:table-cell h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Last Updated
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.map((sub) => (
              <TableRow
                key={sub.id}
                className="group transition-colors duration-200 hover:bg-muted/60 border-b border-border/40"
              >
                <TableCell className="font-mono text-xs break-all py-4 align-top">
                  <span className="font-medium">{sub.email}</span>
                  <div className="sm:hidden mt-1.5 text-muted-foreground text-xs">
                    {sub.createdAt.toISOString().slice(0, 10)}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden sm:table-cell py-4 align-top">
                  {sub.createdAt.toISOString().slice(0, 10)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden md:table-cell py-4 align-top">
                  {sub.updatedAt.toISOString().slice(0, 10)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableCaption className="pt-4 pb-4 border-t border-border/60 mt-4">
            Showing up to 500 most recent subscribers. Use Export CSV to download all subscribers.
          </TableCaption>
        </Table>
      </div>
    </PageShell>
  )
}

