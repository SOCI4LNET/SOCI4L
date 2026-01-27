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

async function getSubscribers() {
  const subscribers = await prisma.emailSubscription.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  return subscribers
}

export default async function AdminSubscribersPage() {
  const subscribers = await getSubscribers()

  return (
    <PageShell
      title="Subscribers"
      subtitle="Email addresses collected through SOCI4L."
      mode="constrained"
    >
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
            Showing up to 500 most recent subscribers. Export and advanced filters will be added
            later.
          </TableCaption>
        </Table>
      </div>
    </PageShell>
  )
}

