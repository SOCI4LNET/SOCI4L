import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PageShell } from '@/components/app-shell/page-shell'

// Force dynamic rendering since this page uses searchParams
export const dynamic = 'force-dynamic'
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
import { Download, ExternalLink, Eye, Users } from 'lucide-react'
import { AdminUserActions } from '@/components/admin/admin-user-actions'

interface SearchParams {
  search?: string
  page?: string
  status?: string
  visibility?: string
  sortBy?: string
}

async function getUsers(searchParams: SearchParams) {
  const pageSize = 25
  const page = Math.max(parseInt(searchParams.page || '1', 10), 1)
  const skip = (page - 1) * pageSize
  const search = (searchParams.search || '').trim()
  const statusFilter = (searchParams.status || '').toLowerCase()
  const visibilityFilter = (searchParams.visibility || '').toLowerCase()
  const sortBy = (searchParams.sortBy || 'newest').toLowerCase()

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

  // Determine sorting order based on sortBy parameter
  let orderBy: any = { createdAt: 'desc' } // default: newest first

  switch (sortBy) {
    case 'oldest':
      orderBy = { createdAt: 'asc' }
      break
    case 'newest':
      orderBy = { createdAt: 'desc' }
      break
    case 'name-asc':
      orderBy = [
        { displayName: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'desc' }
      ]
      break
    case 'name-desc':
      orderBy = [
        { displayName: { sort: 'desc', nulls: 'first' } },
        { createdAt: 'desc' }
      ]
      break
    // For follower sorting, we'll sort in-memory after fetching
    case 'followers-asc':
    case 'followers-desc':
      orderBy = { createdAt: 'desc' } // fallback, we'll sort after
      break
  }

  // Load profiles and total count first
  const [profiles, totalCount] = await Promise.all([
    prisma.profile.findMany({
      where,
      orderBy,
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

  // Handle follower count sorting (in-memory)
  let sortedProfiles = profiles
  if (sortBy === 'followers-asc' || sortBy === 'followers-desc') {
    sortedProfiles = [...profiles].sort((a, b) => {
      const aCount = followerCountMap.get(a.address.toLowerCase()) ?? 0
      const bCount = followerCountMap.get(b.address.toLowerCase()) ?? 0

      if (sortBy === 'followers-desc') {
        return bCount - aCount // descending
      } else {
        return aCount - bCount // ascending
      }
    })
  }

  return {
    profiles: sortedProfiles,
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    search,
    status: statusFilter,
    visibility: visibilityFilter,
    sortBy,
    followerCountMap,
  }
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  let profiles: any[] = []
  let totalCount = 0
  let page = 1
  let totalPages = 1
  let search = ''
  let status = ''
  let visibility = ''
  let sortBy = 'newest'
  let followerCountMap = new Map<string, number>()

  try {
    const result = await getUsers(searchParams)
    profiles = result.profiles
    totalCount = result.totalCount
    page = result.page
    totalPages = result.totalPages
    search = result.search
    status = result.status
    visibility = result.visibility
    sortBy = result.sortBy
    followerCountMap = result.followerCountMap
  } catch (error: any) {
    console.error('[Admin Users] Failed to load users:', error)
    // Return empty state - UI will show empty table
  }

  return (
    <PageShell
      title="Users"
      subtitle="Browse and inspect SOCI4L profiles across the platform."
      mode="constrained"
    >
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 flex-1">
          <div className="flex-1 flex flex-col gap-1 sm:max-w-sm">
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search by address, slug, or display name…"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              name="status"
              defaultValue={status || ''}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs transition-all duration-150 ease-out hover:bg-accent hover:border-border/80 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:border-ring/50 active:scale-[0.98]"
            >
              <option value="">All statuses</option>
              <option value="claimed">Claimed</option>
              <option value="unclaimed">Unclaimed</option>
            </select>
            <select
              name="visibility"
              defaultValue={visibility || ''}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs transition-all duration-150 ease-out hover:bg-accent hover:border-border/80 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:border-ring/50 active:scale-[0.98]"
            >
              <option value="">All visibilities</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <select
              name="sortBy"
              defaultValue={sortBy || 'newest'}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs transition-all duration-150 ease-out hover:bg-accent hover:border-border/80 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:border-ring/50 active:scale-[0.98]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="followers-desc">Most Followers</option>
              <option value="followers-asc">Least Followers</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 transition-all duration-150 ease-out whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 active:scale-[0.98]"
          >
            Apply
          </button>
        </form>
        <form action="/api/admin/export/users" method="get" className="w-full sm:w-auto">
          <Button type="submit" variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
            <Download className="h-3.5 w-3.5 transition-transform duration-150 group-hover:scale-110" />
            Export CSV
          </Button>
        </form>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60">
              <TableHead className="min-w-[140px] h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Address
              </TableHead>
              <TableHead className="min-w-[120px] hidden sm:table-cell h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Display Name
              </TableHead>
              <TableHead className="min-w-[100px] hidden md:table-cell h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Slug
              </TableHead>
              <TableHead className="min-w-[80px] h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="min-w-[80px] hidden sm:table-cell h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Visibility
              </TableHead>
              <TableHead className="min-w-[80px] h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Followers
              </TableHead>
              <TableHead className="min-w-[100px] hidden md:table-cell h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Claimed At
              </TableHead>
              <TableHead className="text-right min-w-[180px] h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                      <Users className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      {totalCount === 0 ? 'No profiles found' : 'No profiles match your filters'}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {totalCount === 0
                        ? 'Profiles will appear here once users claim their addresses'
                        : 'Try adjusting your search or filter criteria'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => {
                const isClaimed =
                  profile.status === 'CLAIMED' ||
                  !!profile.claimedAt ||
                  !!profile.ownerAddress ||
                  !!profile.owner
                const isPublic =
                  profile.visibility === 'PUBLIC' || profile.isPublic === true

                return (
                  <TableRow
                    key={profile.id}
                    className="group transition-all duration-150 ease-out hover:bg-muted/60 hover:shadow-sm border-b border-border/40"
                  >
                    <TableCell className="font-mono text-xs py-4 align-top">
                      <Link
                        href={`/p/${profile.slug || profile.address}`}
                        className="hover:underline break-all transition-colors duration-150 hover:text-primary font-medium"
                      >
                        {profile.address.slice(0, 10)}...
                      </Link>
                      <div className="sm:hidden mt-1.5">
                        {profile.displayName && (
                          <div className="text-xs text-muted-foreground truncate">
                            {profile.displayName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate hidden sm:table-cell py-4 align-top">
                      <span className="text-sm">
                        {profile.displayName || <span className="text-muted-foreground">—</span>}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate hidden md:table-cell py-4 align-top">
                      <span className="text-sm text-muted-foreground">
                        {profile.slug || <span className="text-muted-foreground/60">—</span>}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      <Badge
                        variant={isClaimed ? 'default' : 'outline'}
                        className={`text-xs font-semibold ${isClaimed
                          ? 'bg-green-600/10 text-green-700 dark:text-green-400 border-green-600/20 dark:border-green-400/30'
                          : 'bg-muted/50 text-muted-foreground border-border'
                          }`}
                      >
                        {isClaimed ? 'Claimed' : 'Unclaimed'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-4 align-top">
                      <Badge
                        variant={isPublic ? 'default' : 'outline'}
                        className={`text-xs font-semibold ${isPublic
                          ? 'bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-600/20 dark:border-blue-400/30'
                          : 'bg-muted/50 text-muted-foreground border-border'
                          }`}
                      >
                        {isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      <span className="text-sm font-semibold">
                        {followerCountMap.get(profile.address.toLowerCase()) ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-4 align-top">
                      {profile.claimedAt ? (
                        <span className="text-xs text-muted-foreground">
                          {profile.claimedAt.toISOString().slice(0, 10)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs">—</span>
                      )}
                    </TableCell>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <Link href={`/master-console/users/${encodeURIComponent(profile.address.toLowerCase())}`}>
                        <Eye className="h-3 w-3 transition-transform duration-150 group-hover:scale-110" />
                        Admin View
                      </Link>
                    </Button>
                    <AdminUserActions
                      address={profile.address}
                      isBanned={profile.isBanned}
                      isVerified={profile.isVerified}
                      currentBio={profile.bio}
                      currentDisplayName={profile.displayName}
                    />
                  </div>
                    </TableCell>
        </TableRow>
        )
              })
            )}
      </TableBody>
      <TableCaption className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-4 pb-4 border-t border-border/60 mt-4">
        <span className="text-xs text-muted-foreground">
          Showing page {page} of {totalPages} • {totalCount.toLocaleString('en-US')} profiles
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            {page > 1 && (
              <Link
                href={`/master-console/users?search=${encodeURIComponent(search)}&page=${page - 1}&sortBy=${sortBy}&status=${status}&visibility=${visibility}`}
                className="text-xs text-primary hover:underline whitespace-nowrap transition-colors duration-150"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/master-console/users?search=${encodeURIComponent(search)}&page=${page + 1}&sortBy=${sortBy}&status=${status}&visibility=${visibility}`}
                className="text-xs text-primary hover:underline whitespace-nowrap transition-colors duration-150"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </TableCaption>
    </Table>
      </div >
    </PageShell >
  )
}

