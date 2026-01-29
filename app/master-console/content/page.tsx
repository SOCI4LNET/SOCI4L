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
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/admin/empty-state'
import Link from 'next/link'
import { ExternalLink, Link2 } from 'lucide-react'
import { LinkActions } from '@/components/admin/link-actions'

// Force dynamic rendering since this page uses Prisma queries
export const dynamic = 'force-dynamic'

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
              <TableHead className="min-w-[150px] h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Profile
              </TableHead>
              <TableHead className="min-w-[120px] hidden sm:table-cell h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Link Title
              </TableHead>
              <TableHead className="min-w-[200px] h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                URL
              </TableHead>
              <TableHead className="min-w-[100px] hidden md:table-cell h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </TableHead>
              <TableHead className="min-w-[80px] hidden sm:table-cell h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Enabled
              </TableHead>
              <TableHead className="min-w-[140px] hidden lg:table-cell h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Created At
              </TableHead>
              <TableHead className="min-w-[220px] text-right h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12">
                  <EmptyState
                    icon={<Link2 className="h-6 w-6" />}
                    title="No links yet"
                    description="Links will appear here once users add them to their profiles"
                    variant="empty"
                  />
                </TableCell>
              </TableRow>
            ) : (
              links.map((link) => (
                <TableRow
                  key={link.id}
                  className="group transition-all duration-150 ease-out hover:bg-muted/60 hover:shadow-sm border-b border-border/40"
                >
                  <TableCell className="py-4 align-top">
                    <div className="flex flex-col gap-1.5">
                      <Link
                        href={`/p/${link.profile.slug || link.profile.address}`}
                        className="text-sm font-semibold hover:underline transition-colors duration-150 hover:text-primary"
                      >
                        {link.profile.displayName || link.profile.address.slice(0, 10) + '...'}
                      </Link>
                      <span className="text-xs text-muted-foreground font-mono">
                        {link.profile.address.slice(0, 10)}...{link.profile.address.slice(-6)}
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
                  <TableCell className="max-w-[180px] truncate hidden sm:table-cell py-4 align-top">
                    <span className="text-sm">
                      {link.title || <span className="text-muted-foreground/60">Untitled</span>}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate font-mono text-xs py-4 align-top">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline break-all transition-colors duration-150 hover:text-primary flex items-center gap-1"
                    >
                      {link.url.length > 40 ? link.url.slice(0, 40) + '...' : link.url}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate hidden md:table-cell py-4 align-top">
                    <span className="text-sm text-muted-foreground">
                      {link.category?.name || <span className="text-muted-foreground/60">—</span>}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-4 align-top">
                    <Badge
                      variant={link.enabled ? 'default' : 'outline'}
                      className={`text-xs font-semibold ${link.enabled
                        ? 'bg-green-600/10 text-green-700 dark:text-green-400 border-green-600/20 dark:border-green-400/30'
                        : 'bg-muted/50 text-muted-foreground border-border'
                        }`}
                    >
                      {link.enabled ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell py-4 align-top">
                    {link.createdAt.toISOString().slice(0, 10)}
                  </TableCell>
                  <TableCell className="text-right py-4 align-top">
                    <LinkActions
                      linkId={link.id}
                      linkTitle={link.title}
                      linkUrl={link.url}
                      enabled={link.enabled}
                      profileAddress={link.profile.address}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
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

