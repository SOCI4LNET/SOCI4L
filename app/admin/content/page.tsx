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
import Link from 'next/link'

async function getRecentLinks() {
  const links = await prisma.profileLink.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      profile: true,
      category: true,
    },
  })

  return links
}

export default async function AdminContentPage() {
  const links = await getRecentLinks()

  return (
    <PageShell
      title="Content"
      subtitle="Recently added links across SOCI4L profiles."
      mode="constrained"
    >
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profile</TableHead>
              <TableHead>Link Title</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => (
              <TableRow key={link.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <Link
                      href={`/p/${link.profile.slug || link.profile.address}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {link.profile.displayName || link.profile.address}
                    </Link>
                    <span className="text-xs text-muted-foreground font-mono">
                      {link.profile.address}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[180px] truncate">
                  {link.title || <span className="text-muted-foreground">Untitled</span>}
                </TableCell>
                <TableCell className="max-w-[260px] truncate font-mono text-xs">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {link.url}
                  </a>
                </TableCell>
                <TableCell className="max-w-[140px] truncate">
                  {link.category?.name || <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <span className="text-xs">
                    {link.enabled ? 'Yes' : 'No'}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {link.createdAt.toISOString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableCaption>
            Showing the 200 most recently created links. Moderation and flagging tools will be added
            here later.
          </TableCaption>
        </Table>
      </div>
    </PageShell>
  )
}

