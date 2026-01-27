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
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface SearchParams {
  search?: string
  page?: string
  status?: string
  visibility?: string
}

async function getUsers(searchParams: SearchParams) {
  const pageSize = 25
  const page = Math.max(parseInt(searchParams.page || '1', 10), 1)
  const skip = (page - 1) * pageSize
  const search = (searchParams.search || '').trim()
  const statusFilter = (searchParams.status || '').toLowerCase()
  const visibilityFilter = (searchParams.visibility || '').toLowerCase()

  const where: any = {}

  if (search.length > 0) {
    where.OR = [
      { address: { contains: search.toLowerCase() } },
      { slug: { contains: search.toLowerCase() } },
      { displayName: { contains: search, mode: 'insensitive' as const } },
    ]
  }

  if (statusFilter === 'claimed') {
    where.OR = [
      ...(where.OR || []),
      { status: 'CLAIMED' },
      { claimedAt: { not: null } },
      { ownerAddress: { not: null } },
      { owner: { not: null } },
    ]
  } else if (statusFilter === 'unclaimed') {
    where.AND = [
      ...(where.AND || []),
      {
        AND: [
          { status: { not: 'CLAIMED' } },
          { claimedAt: null },
          { ownerAddress: null },
          { owner: null },
        ],
      },
    ]
  }

  if (visibilityFilter === 'public') {
    where.OR = [
      ...(where.OR || []),
      { visibility: 'PUBLIC' },
      { isPublic: true },
    ]
  } else if (visibilityFilter === 'private') {
    where.AND = [
      ...(where.AND || []),
      {
        AND: [
          { OR: [{ visibility: 'PRIVATE' }, { visibility: null }] },
          { OR: [{ isPublic: false }, { isPublic: null }] },
        ],
      },
    ]
  }

  // Load profiles and total count first
  const [profiles, totalCount] = await Promise.all([
    prisma.profile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.profile.count({ where }),
  ])

  // Follower counts per profile (best-effort; UI should not break if this fails)
  let followerCounts: Array<{
    followingAddress: string
    _count: { followingAddress: number }
  }> = []

  try {
    const profileAddresses = profiles.map((p) => p.address.toLowerCase())

    if (profileAddresses.length > 0) {
      followerCounts = await prisma.follow.groupBy({
        by: ['followingAddress'],
        _count: { followingAddress: true },
        where: {
          followingAddress: {
            in: profileAddresses,
          },
        },
      })
    }
  } catch (error) {
    console.error('[Admin Users] Failed to load followerCounts', error)
    followerCounts = []
  }

  const followerCountMap = new Map<string, number>()
  for (const row of followerCounts) {
    followerCountMap.set(
      row.followingAddress.toLowerCase(),
      row._count.followingAddress,
    )
  }

  return {
    profiles,
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    search,
    status: statusFilter,
    visibility: visibilityFilter,
    followerCountMap,
  }
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const {
    profiles,
    totalCount,
    page,
    totalPages,
    search,
    status,
    visibility,
    followerCountMap,
  } = await getUsers(searchParams)

  return (
    <PageShell
      title="Users"
      subtitle="Browse and inspect SOCI4L profiles across the platform."
      mode="constrained"
    >
      <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 flex-1">
          <div className="flex-1 flex flex-col gap-1 sm:max-w-sm">
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search by address, slug, or display name…"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <select
              name="status"
              defaultValue={status || ''}
              className="h-8 rounded border bg-background px-2 text-xs"
            >
              <option value="">All statuses</option>
              <option value="claimed">Claimed</option>
              <option value="unclaimed">Unclaimed</option>
            </select>
            <select
              name="visibility"
              defaultValue={visibility || ''}
              className="h-8 rounded border bg-background px-2 text-xs"
            >
              <option value="">All visibilities</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            Apply
          </button>
        </form>
        <form action="/api/admin/export/users" method="get" className="w-full sm:w-auto">
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
              <TableHead className="min-w-[140px]">Address</TableHead>
              <TableHead className="min-w-[120px] hidden sm:table-cell">Display Name</TableHead>
              <TableHead className="min-w-[100px] hidden md:table-cell">Slug</TableHead>
              <TableHead className="min-w-[80px]">Status</TableHead>
              <TableHead className="min-w-[80px] hidden sm:table-cell">Visibility</TableHead>
              <TableHead className="min-w-[80px]">Followers</TableHead>
              <TableHead className="min-w-[100px] hidden md:table-cell">Claimed At</TableHead>
              <TableHead className="text-right min-w-[140px]">Actions</TableHead>
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
                      className="hover:underline break-all"
                    >
                      {profile.address.slice(0, 10)}...
                    </Link>
                    <div className="sm:hidden mt-1">
                      {profile.displayName && (
                        <div className="text-xs text-muted-foreground truncate">
                          {profile.displayName}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate hidden sm:table-cell">
                    {profile.displayName || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate hidden md:table-cell">
                    {profile.slug || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isClaimed ? 'default' : 'outline'} className="text-xs">
                      {isClaimed ? 'Claimed' : 'Unclaimed'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={isPublic ? 'default' : 'outline'} className="text-xs">
                      {isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">
                      {followerCountMap.get(profile.address.toLowerCase()) ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {profile.claimedAt ? (
                      <span className="text-xs text-muted-foreground">
                        {profile.claimedAt.toISOString().slice(0, 10)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col sm:flex-row justify-end gap-1 sm:gap-2">
                      <Link
                        href={`/p/${profile.slug || profile.address}`}
                        className="text-xs text-primary hover:underline whitespace-nowrap"
                      >
                        View profile
                      </Link>
                      <Link
                        href={`/admin/users/${encodeURIComponent(profile.address.toLowerCase())}`}
                        className="text-xs text-muted-foreground hover:underline whitespace-nowrap"
                      >
                        Admin view
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableCaption className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-4">
            <span className="text-xs">
              Showing page {page} of {totalPages} • {totalCount.toLocaleString('en-US')} profiles
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin/users?search=${encodeURIComponent(search)}&page=${page - 1}`}
                    className="text-xs text-primary hover:underline whitespace-nowrap"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/admin/users?search=${encodeURIComponent(search)}&page=${page + 1}`}
                    className="text-xs text-primary hover:underline whitespace-nowrap"
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

