import Link from 'next/link'
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
import { Input } from '@/components/ui/input'

interface SearchParams {
  search?: string
  page?: string
}

async function getUsers(searchParams: SearchParams) {
  const pageSize = 25
  const page = Math.max(parseInt(searchParams.page || '1', 10), 1)
  const skip = (page - 1) * pageSize
  const search = (searchParams.search || '').trim()

  const where =
    search.length > 0
      ? {
          OR: [
            { address: { contains: search.toLowerCase() } },
            { slug: { contains: search.toLowerCase() } },
            { displayName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

  const [profiles, totalCount] = await Promise.all([
    prisma.profile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.profile.count({ where }),
  ])

  return {
    profiles,
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    search,
  }
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { profiles, totalCount, page, totalPages, search } = await getUsers(searchParams)

  return (
    <PageShell
      title="Users"
      subtitle="Browse and inspect SOCI4L profiles across the platform."
      mode="constrained"
    >
      <form className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Search by address, slug, or display name…"
          className="sm:max-w-sm"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Search
        </button>
      </form>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Claimed At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => {
              const isClaimed =
                profile.status === 'CLAIMED' ||
                !!profile.claimedAt ||
                !!profile.ownerAddress ||
                !!profile.owner
              const isPublic =
                profile.visibility === 'PUBLIC' || profile.isPublic === true

              return (
                <TableRow key={profile.id}>
                  <TableCell className="font-mono text-xs">
                    <Link
                      href={`/p/${profile.slug || profile.address}`}
                      className="hover:underline"
                    >
                      {profile.address}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">
                    {profile.displayName || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate">
                    {profile.slug || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isClaimed ? 'default' : 'outline'}>
                      {isClaimed ? 'Claimed' : 'Unclaimed'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={isPublic ? 'default' : 'outline'}>
                      {isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {profile.claimedAt ? (
                      <span className="text-xs text-muted-foreground">
                        {profile.claimedAt.toISOString().slice(0, 10)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/p/${profile.slug || profile.address}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View profile
                      </Link>
                      <Link
                        href={`/dashboard/${profile.address.toLowerCase()}`}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        View dashboard
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableCaption className="flex items-center justify-between gap-2">
            <span className="text-xs">
              Showing page {page} of {totalPages} • {totalCount.toLocaleString('en-US')} profiles
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin/users?search=${encodeURIComponent(search)}&page=${page - 1}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/admin/users?search=${encodeURIComponent(search)}&page=${page + 1}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </TableCaption>
        </Table>
      </div>
    </PageShell>
  )
}

