'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserPlus, Share2, Copy, Twitter, QrCode } from 'lucide-react'
import { formatAddress, isValidAddress } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { PageShell } from '@/components/app-shell/page-shell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { QRCodeModal } from '@/components/qr/qr-code-modal'
import { getPublicProfileHref } from '@/lib/routing'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { SocialKPICards } from '@/components/dashboard/social-kpi-cards'
import { ConnectionCard } from '@/components/dashboard/connection-card'
import { SocialFilterBar, FilterType, SortType } from '@/components/dashboard/social-filter-bar'

interface SocialPanelProps {
  address: string
}

interface FollowItem {
  address: string
  createdAt: string
  displayName?: string | null
  slug?: string | null
  score?: number
  reason?: string
  primaryRole?: string | null
  statusMessage?: string | null
}

export function SocialPanel({ address }: SocialPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { address: connectedAddress } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [followers, setFollowers] = useState<FollowItem[]>([])
  const [following, setFollowing] = useState<FollowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('recent')

  // Check if the profile belongs to the connected wallet
  const isOwnProfile = connectedAddress && address.toLowerCase() === connectedAddress.toLowerCase()

  // Get active tab from URL query param 'subtab' (to avoid conflict with dashboard's 'tab' param)
  // Default to 'following'
  const subtabParam = searchParams.get('subtab')
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'mutuals'>(
    (subtabParam === 'followers' || subtabParam === 'following' || subtabParam === 'mutuals')
      ? subtabParam
      : 'following'
  )

  // Sync with URL on mount and when subtab param changes
  useEffect(() => {
    const subtab = searchParams.get('subtab')
    if (subtab === 'followers' || subtab === 'following' || subtab === 'mutuals') {
      setActiveTab(subtab)
    } else {
      // If subtab param is missing, set default to 'following' and update URL
      const params = new URLSearchParams(searchParams.toString())
      if (!params.has('subtab')) {
        params.set('subtab', 'following')
        // Ensure 'tab=social' is set
        if (!params.has('tab') || params.get('tab') !== 'social') {
          params.set('tab', 'social')
        }
        // Only update query params, keep the same pathname - no navigation
        if (pathname) {
          router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        }
      }
    }
  }, [searchParams, pathname, router])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch profile data for sharing
  const { data: profileData } = useQuery<{
    profile?: {
      slug?: string | null
      displayName?: string | null
    }
  }>({
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

  // Fetch social stats (KPIs)
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

  // Fetch mutuals list
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

  // Fetch suggestions
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

  // Share functions
  const getShareUrl = (): string => {
    if (typeof window === 'undefined') {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      const profilePath = getPublicProfileHref(address, profileData?.profile?.slug)
      return `${appUrl}${profilePath}`
    }
    const baseUrl = window.location.origin
    const profilePath = getPublicProfileHref(address, profileData?.profile?.slug)
    return `${baseUrl}${profilePath}`
  }

  const handleCopyLink = async () => {
    const url = getShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Profile link copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleShareTwitter = () => {
    const url = getShareUrl()
    let shareText: string
    if (isOwnProfile) {
      shareText = 'Just claimed my SOCI4L profile on Avalanche.\n\nTrack my on-chain identity and links in one place.\n\n' + url
    } else {
      const profileName = profileData?.profile?.displayName || formatAddress(address, 4)
      shareText = `Check out this SOCI4L profile on Avalanche: ${profileName}\n\nTrack on-chain identity and links in one place.\n\n` + url
    }
    const text = encodeURIComponent(shareText)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const handleShareNative = async () => {
    const url = getShareUrl()
    if (navigator.share) {
      try {
        let shareTitle: string
        let shareText: string
        if (isOwnProfile) {
          shareTitle = 'My Avalanche Profile'
          shareText = 'Check out my SOCI4L profile on Avalanche. Track my on-chain identity and links in one place.'
        } else {
          const profileName = profileData?.profile?.displayName || formatAddress(address, 4)
          shareTitle = 'Avalanche Profile'
          shareText = `Check out this SOCI4L profile on Avalanche: ${profileName}. Track on-chain identity and links in one place.`
        }
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: url,
        })
      } catch (error: any) {
        // User cancelled or share failed, fall back to clipboard
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error)
          handleCopyLink()
        }
      }
    } else {
      // Fallback to clipboard if Web Share API is not available
      handleCopyLink()
    }
  }

  useEffect(() => {
    if (!mounted || !isValidAddress(address)) return

    const fetchFollows = async () => {
      setLoading(true)
      try {
        const normalizedAddress = address.toLowerCase()

        // Build query params with filter and sort
        const params = new URLSearchParams()
        if (filter !== 'all') params.append('filter', filter)
        if (sort !== 'recent') params.append('sort', sort)
        const queryString = params.toString()
        const queryParam = queryString ? `&${queryString}` : ''

        // Fetch both followers and following
        const [followersRes, followingRes] = await Promise.all([
          fetch(`/api/dashboard/${normalizedAddress}/follows?type=followers${queryParam}`, {
            credentials: 'include',
          }),
          fetch(`/api/dashboard/${normalizedAddress}/follows?type=following${queryParam}`, {
            credentials: 'include',
          }),
        ])

        if (followersRes.ok) {
          const data = await followersRes.json()
          setFollowers(Array.isArray(data) ? data : [])
        } else {
          console.error('Failed to fetch followers:', followersRes.status, await followersRes.text())
        }

        if (followingRes.ok) {
          const data = await followingRes.json()
          setFollowing(Array.isArray(data) ? data : [])
        } else {
          console.error('Failed to fetch following:', followingRes.status, await followingRes.text())
        }
      } catch (error) {
        console.error('Error fetching follows:', error)
        toast.error('Failed to load followers')
      } finally {
        setLoading(false)
      }
    }

    fetchFollows()
  }, [mounted, address, filter, sort]) // Re-fetch when filter or sort changes


  const handleTabChange = (value: string) => {
    const newTab = value as 'followers' | 'following'

    // Update local state immediately - no navigation, just state change
    setActiveTab(newTab)

    // Update URL with 'subtab' param (not 'tab' to avoid conflict with dashboard routing)
    // Preserve 'tab=social' and other query params
    const params = new URLSearchParams(searchParams.toString())
    params.set('subtab', newTab)

    // Ensure 'tab=social' is set
    if (!params.has('tab') || params.get('tab') !== 'social') {
      params.set('tab', 'social')
    }

    // Only update query params, keep the same pathname - no navigation
    if (pathname) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }

  const filteredFollowers = followers.filter((item) =>
    item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.displayName && item.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.slug && item.slug.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredFollowing = following.filter((item) =>
    item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.displayName && item.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.slug && item.slug.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleUnfollow = async (targetAddress: string) => {
    try {
      const normalizedTargetAddress = targetAddress.toLowerCase()
      const response = await fetch(`/api/profile/${normalizedTargetAddress}/follow`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Unfollow failed')
      }

      // Remove from following list
      setFollowing((prev) => prev.filter((item) => item.address.toLowerCase() !== normalizedTargetAddress))

      toast.success('Unfollowed successfully')
    } catch (error: any) {
      console.error('Error unfollowing:', error)
      toast.error('Failed to unfollow. Please try again.')
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const renderList = (
    items: FollowItem[],
    emptyTitle: string,
    emptyHelper: string,
    showUnfollow = false,
    suggestions: any[] = []
  ) => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      )
    }

    const suggestionsBlock = suggestions && suggestions.length > 0 && (
      <div className="w-full mt-8 text-left border-t pt-6">
        <h4 className="text-sm font-semibold mb-3 px-1 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          Suggested for you
        </h4>
        <div className="space-y-0 border rounded-md overflow-hidden">
          {suggestions.map((s) => (
            <ConnectionCard
              key={s.address}
              address={s.address}
              displayName={s.displayName}
              avatarUrl={`https://effigy.im/a/${s.address.toLowerCase()}.svg`}
              primaryRole={s.primaryRole}
              statusMessage={s.statusMessage}
              connectionReason={s.reason}
              followedAt={new Date(s.createdAt)}
            // No showUnfollow since these are suggestions
            />
          ))}
        </div>
      </div>
    )

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed rounded-lg">
          {emptyTitle.toLowerCase().includes('followers') ? (
            <Users className="h-10 w-10 text-muted-foreground" />
          ) : (
            <UserPlus className="h-10 w-10 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium mb-1 mt-4">{emptyTitle}</p>
            <p className="text-xs text-muted-foreground mb-4">
              {emptyHelper}
            </p>
          </div>
          {emptyTitle === 'No followers yet' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Share2 className="mr-2 h-3.5 w-3.5" />
                  Share your profile
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy profile link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareTwitter}>
                  <Twitter className="mr-2 h-4 w-4" />
                  Share on X
                </DropdownMenuItem>
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                  <DropdownMenuItem onClick={handleShareNative}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share via...
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setQrModalOpen(true)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Show QR code
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Suggestions in Empty State */}
          {suggestionsBlock}
        </div>
      )
    }

    return (
      <div className="space-y-0">
        {items.map((item) => (
          <ConnectionCard
            key={item.address}
            address={item.address}
            displayName={item.displayName}
            avatarUrl={`https://effigy.im/a/${item.address.toLowerCase()}.svg`}
            followedAt={new Date(item.createdAt)}
            showUnfollow={showUnfollow}
            onUnfollow={handleUnfollow}
            connectionStrength={item.score}
            connectionReason={item.reason}
            primaryRole={item.primaryRole}
            statusMessage={item.statusMessage}
          />
        ))}
        {/* Suggestions appended to list */}
        {suggestionsBlock}
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
          {/* KPI Cards */}
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
              </TabsList>
              {/* Replace Input with SocialFilterBar */}
              <SocialFilterBar
                filter={filter}
                onFilterChange={setFilter}
                sort={sort}
                onSortChange={setSort}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>

            <TabsContent value="followers" className="mt-4">
              {renderList(
                filteredFollowers,
                'No followers yet',
                'Share your profile to get discovered.',
                false,
                suggestionsData?.suggestions // Pass suggestions
              )}
            </TabsContent>
            <TabsContent value="following" className="mt-4">
              {renderList(
                filteredFollowing,
                "You're not following anyone yet",
                'Explore profiles and follow creators.',
                true // showUnfollow
              )}
            </TabsContent>

            <TabsContent value="mutuals" className="mt-4">
              {mutualsData && renderList(
                mutualsData.mutuals || [],
                'No mutual connections',
                'Mutual connections appear when you follow each other.'
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
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
