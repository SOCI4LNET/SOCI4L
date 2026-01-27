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
      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60">
              <TableHead className="min-w-[150px]">Profile</TableHead>
              <TableHead className="min-w-[120px] hidden sm:table-cell">Link Title</TableHead>
              <TableHead className="min-w-[200px]">URL</TableHead>
              <TableHead className="min-w-[100px] hidden md:table-cell">Category</TableHead>
              <TableHead className="min-w-[80px] hidden sm:table-cell">Enabled</TableHead>
              <TableHead className="min-w-[140px] hidden lg:table-cell">Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => (
              <TableRow key={link.id} className="transition-colors duration-150 hover:bg-muted/50">
                <TableCell className="py-3">
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/p/${link.profile.slug || link.profile.address}`}
                      className="text-sm font-medium hover:underline transition-colors duration-150 hover:text-primary"
                    >
                      {link.profile.displayName || link.profile.address.slice(0, 10) + '...'}
                    </Link>
                    <span className="text-xs text-muted-foreground font-mono">
                      {link.profile.address.slice(0, 10)}...
                    </span>
                    <div className="sm:hidden mt-1">
                      {link.title && (
                        <div className="text-xs text-muted-foreground truncate">
                          {link.title}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[180px] truncate hidden sm:table-cell py-3">
                  {link.title || <span className="text-muted-foreground">Untitled</span>}
                </TableCell>
                <TableCell className="max-w-[260px] truncate font-mono text-xs py-3">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline break-all transition-colors duration-150 hover:text-primary"
                  >
                    {link.url.length > 40 ? link.url.slice(0, 40) + '...' : link.url}
                  </a>
                </TableCell>
                <TableCell className="max-w-[140px] truncate hidden md:table-cell py-3">
                  {link.category?.name || <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="hidden sm:table-cell py-3">
                  <span className={`text-xs font-medium ${link.enabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {link.enabled ? 'Yes' : 'No'}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden lg:table-cell py-3">
                  {link.createdAt.toISOString().slice(0, 10)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableCaption className="pt-4 pb-4 border-t border-border/60 mt-4">
            Showing the 200 most recently created links. Moderation and flagging tools will be added
            here later.
          </TableCaption>
        </Table>
      </div>
    </PageShell>
  )
}

