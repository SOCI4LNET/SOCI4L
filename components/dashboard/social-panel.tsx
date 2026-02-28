'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { isValidAddress } from '@/lib/utils'

import { Users, UserPlus, Search } from 'lucide-react'

import { PageShell } from '@/components/app-shell/page-shell'
import { QRCodeModal } from '@/components/qr/qr-code-modal'
import { SocialKPICards } from '@/components/dashboard/social-kpi-cards'
import { SocialFilterBar, FilterType, SortType } from '@/components/dashboard/social-filter-bar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConnectionCard } from '@/components/dashboard/connection-card'
import { SocialList } from './social-list'

import { useProfileShare } from '@/hooks/use-profile-share'
import { useSocialActions, FollowItem } from '@/hooks/use-social-actions'

interface SocialPanelProps {
  address: string
}

export function SocialPanel({ address }: SocialPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { address: connectedAddress } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('recent')
  const [searchQuery, setSearchQuery] = useState('')

  const isOwnProfile = connectedAddress && address.toLowerCase() === connectedAddress.toLowerCase()

  const subtabParam = searchParams.get('subtab')
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'mutuals' | 'explore'>(
    (subtabParam === 'followers' || subtabParam === 'following' || subtabParam === 'mutuals' || subtabParam === 'explore')
      ? subtabParam
      : 'following'
  )

  useEffect(() => {
    const subtab = searchParams.get('subtab')
    if (subtab === 'followers' || subtab === 'following' || subtab === 'mutuals' || subtab === 'explore') {
      setActiveTab(subtab)
    } else {
      const params = new URLSearchParams(searchParams.toString())
      if (!params.has('subtab')) {
        params.set('subtab', 'following')
        if (!params.has('tab') || params.get('tab') !== 'social') {
          params.set('tab', 'social')
        }
        if (pathname) {
          router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        }
      }
    }
  }, [searchParams, pathname, router])

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: profileData } = useQuery({
    queryKey: ['profile-for-share', address],
    queryFn: async () => {
      if (!address || !isValidAddress(address)) throw new Error('Invalid address')
      const normalizedAddress = address.toLowerCase()
      const response = await fetch(`/api/wallet/${normalizedAddress}/summary`)
      if (!response.ok) throw new Error('Failed to fetch profile')
      return response.json()
    },
    enabled: mounted && isValidAddress(address),
  })

  const { data: socialStats, isLoading: statsLoading } = useQuery({
    queryKey: ['social-stats', address?.toLowerCase()],
    queryFn: async () => {
      if (!address || !isValidAddress(address)) throw new Error('Invalid address')
      const normalizedAddress = address.toLowerCase()
      const response = await fetch(`/api/profile/${normalizedAddress}/social-stats`)
      if (!response.ok) throw new Error('Failed to fetch social stats')
      return response.json()
    },
    enabled: mounted && isValidAddress(address),
  })

  const { data: mutualsData, isLoading: mutualsLoading } = useQuery({
    queryKey: ['mutuals', address?.toLowerCase()],
    queryFn: async () => {
      if (!address || !isValidAddress(address)) throw new Error('Invalid address')
      const normalizedAddress = address.toLowerCase()
      const response = await fetch(`/api/profile/${normalizedAddress}/mutuals`)
      if (!response.ok) throw new Error('Failed to fetch mutuals')
      return response.json()
    },
    enabled: mounted && isValidAddress(address),
  })

  const { data: suggestionsData } = useQuery({
    queryKey: ['suggestions', address?.toLowerCase()],
    queryFn: async () => {
      if (!address || !isValidAddress(address)) throw new Error('Invalid address')
      const response = await fetch(`/api/profile/suggestions?address=${address}`)
      if (!response.ok) throw new Error('Failed to fetch suggestions')
      return response.json()
    },
    enabled: mounted && isValidAddress(address) && isOwnProfile,
  })

  const { data: followers = [], isLoading: followersLoading } = useQuery<FollowItem[]>({
    queryKey: ['followers', address?.toLowerCase(), filter, sort],
    queryFn: async () => {
      const normalizedAddress = address.toLowerCase()
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('filter', filter)
      if (sort !== 'recent') params.append('sort', sort)
      const queryString = params.toString()
      const queryParam = queryString ? `&${queryString}` : ''

      const res = await fetch(`/api/dashboard/${normalizedAddress}/follows?type=followers${queryParam}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch followers')
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
    enabled: mounted && isValidAddress(address)
  })

  const { data: following = [], isLoading: followingLoading } = useQuery<FollowItem[]>({
    queryKey: ['following', address?.toLowerCase(), filter, sort],
    queryFn: async () => {
      const normalizedAddress = address.toLowerCase()
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('filter', filter)
      if (sort !== 'recent') params.append('sort', sort)
      const queryString = params.toString()
      const queryParam = queryString ? `&${queryString}` : ''

      const res = await fetch(`/api/dashboard/${normalizedAddress}/follows?type=following${queryParam}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch following')
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
    enabled: mounted && isValidAddress(address)
  })

  const { handleCopyLink, handleShareTwitter, handleShareNative } = useProfileShare({
    address,
    isOwnProfile: isOwnProfile ?? false,
    profileData
  })

  const { handleFollow, handleUnfollow, handleBlock, handleRemoveFollower } = useSocialActions(address, filter, sort)

  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['search', globalSearchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(globalSearchQuery)}`)
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      return (data.results || []).map((p: any) => ({
        address: p.address,
        createdAt: new Date().toISOString(),
        displayName: p.displayName,
        slug: p.slug,
        primaryRole: p.primaryRole,
        reason: following.some((f: FollowItem) => f.address.toLowerCase() === p.address.toLowerCase())
          ? 'Following'
          : undefined
      }))
    },
    enabled: globalSearchQuery.length >= 2,
    staleTime: 1000 * 60 * 5,
  })

  const loading = followersLoading || followingLoading

  const handleTabChange = (value: string) => {
    const newTab = value as 'followers' | 'following' | 'explore' | 'mutuals'
    setActiveTab(newTab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('subtab', newTab)
    if (!params.has('tab') || params.get('tab') !== 'social') {
      params.set('tab', 'social')
    }
    if (pathname) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }

  const filteredFollowers = followers.filter((item: FollowItem) =>
    item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.displayName && item.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.slug && item.slug.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredFollowing = following.filter((item: FollowItem) =>
    item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.displayName && item.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.slug && item.slug.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (!mounted) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <PageShell
      title="Social"
      subtitle="View and manage on-chain social connections"
    >
      <Card className="bg-card border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>On-chain social graph</CardTitle>
          <CardDescription>
            Followers and following relationships for this wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SocialKPICards stats={socialStats} loading={statsLoading} />

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <TabsList className="bg-muted/40 p-1 rounded-lg">
                <TabsTrigger
                  value="followers"
                  className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground rounded-md px-3 py-1.5"
                >
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Followers</span>
                  <span className="text-[11px] rounded-full bg-accent/60 px-1.5 py-0.5">
                    {followers.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="following"
                  className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground rounded-md px-3 py-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="text-sm">Following</span>
                  <span className="text-[11px] rounded-full bg-accent/60 px-1.5 py-0.5">
                    {following.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="mutuals"
                  className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground rounded-md px-3 py-1.5"
                >
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Mutuals</span>
                  <span className="text-[11px] rounded-full bg-accent/60 px-1.5 py-0.5">
                    {mutualsData?.count || 0}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="explore"
                  className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground rounded-md px-3 py-1.5"
                >
                  <Search className="h-4 w-4" />
                  <span className="text-sm">Explore</span>
                </TabsTrigger>
              </TabsList>

              {activeTab !== 'explore' && (
                <SocialFilterBar
                  filter={filter}
                  onFilterChange={setFilter}
                  sort={sort}
                  onSortChange={setSort}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              )}
            </div>

            <TabsContent value="followers" className="mt-4">
              <SocialList
                items={filteredFollowers}
                loading={loading}
                emptyTitle="No followers yet"
                emptyHelper="Share your profile to get discovered."
                showUnfollow={false}
                suggestions={suggestionsData?.suggestions}
                dateLabel="Followed you on"
                showRemoveFollower={isOwnProfile ?? false}
                onRemoveFollower={handleRemoveFollower}
                onBlock={handleBlock}
                onCopyLink={handleCopyLink}
                onShareTwitter={handleShareTwitter}
                onShareNative={handleShareNative}
                onShowQrCode={() => setQrModalOpen(true)}
              />
            </TabsContent>

            <TabsContent value="following" className="mt-4">
              <SocialList
                items={filteredFollowing}
                loading={loading}
                emptyTitle="You're not following anyone yet"
                emptyHelper="Explore profiles and follow creators."
                showUnfollow={true}
                suggestions={suggestionsData?.suggestions}
                dateLabel="Followed on"
                onUnfollow={handleUnfollow}
                onBlock={handleBlock}
              />
            </TabsContent>

            <TabsContent value="mutuals" className="mt-4">
              {mutualsData && (
                <SocialList
                  items={mutualsData.mutuals || []}
                  loading={mutualsLoading}
                  emptyTitle="No mutual connections"
                  emptyHelper="Mutual connections appear when you follow each other."
                  showUnfollow={false}
                  suggestions={suggestionsData?.suggestions}
                  dateLabel="Followed on"
                  onUnfollow={handleUnfollow}
                  onBlock={handleBlock}
                />
              )}
            </TabsContent>

            <TabsContent value="explore" className="mt-4">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or address..."
                    className="pl-9"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  />
                </div>

                {isSearching ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-0">
                    {searchResults.map((item: FollowItem) => {
                      const isFollowing = following.some((f: FollowItem) => f.address.toLowerCase() === item.address.toLowerCase())
                      const isSelf = item.address.toLowerCase() === address.toLowerCase()

                      return (
                        <div key={item.address} className="relative group">
                          <ConnectionCard
                            address={item.address}
                            displayName={item.displayName}
                            avatarUrl={`https://effigy.im/a/${item.address.toLowerCase()}.svg`}
                            primaryRole={item.primaryRole}
                            followedAt={new Date()}
                            dateLabel="Joined"
                          />
                          {!isSelf && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              {isFollowing ? (
                                <Button size="sm" variant="secondary" disabled>Following</Button>
                              ) : (
                                <Button size="sm" onClick={() => handleFollow(item.address)}>Follow</Button>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : globalSearchQuery.length > 2 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No users found
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Type to search...
                    {suggestionsData?.suggestions && suggestionsData.suggestions.length > 0 && (
                      <div className="mt-8">
                        <SocialList
                          items={suggestionsData.suggestions}
                          loading={false}
                          emptyTitle=""
                          emptyHelper=""
                          dateLabel="Joined"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {address && isValidAddress(address) && (
        <QRCodeModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          profile={{
            address: address,
            slug: profileData?.profile?.slug || null,
            displayName: profileData?.profile?.displayName || null,
            avatarUrl: `https://effigy.im/a/${address.toLowerCase()}.svg`,
          }}
        />
      )}
    </PageShell>
  )
}
