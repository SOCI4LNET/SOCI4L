'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, Users, UserPlus, Share2 } from 'lucide-react'
import { formatAddress, isValidAddress } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { PageShell } from '@/components/app-shell/page-shell'

interface SocialPanelProps {
  address: string
}

interface FollowItem {
  address: string
  createdAt: string
  displayName?: string | null
}

export function SocialPanel({ address }: SocialPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [followers, setFollowers] = useState<FollowItem[]>([])
  const [following, setFollowing] = useState<FollowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Get active tab from URL query param 'subtab' (to avoid conflict with dashboard's 'tab' param)
  // Default to 'following'
  const subtabParam = searchParams.get('subtab')
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(
    (subtabParam === 'followers' || subtabParam === 'following') 
      ? subtabParam 
      : 'following'
  )
  
  // Sync with URL on mount and when subtab param changes
  useEffect(() => {
    const subtab = searchParams.get('subtab')
    if (subtab === 'followers' || subtab === 'following') {
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

  useEffect(() => {
    if (!mounted || !isValidAddress(address)) return

    const fetchFollows = async () => {
      setLoading(true)
      try {
        const normalizedAddress = address.toLowerCase()

        // Fetch both followers and following
        const [followersRes, followingRes] = await Promise.all([
          fetch(`/api/dashboard/${normalizedAddress}/follows?type=followers`, {
            cache: 'no-store',
            credentials: 'include',
          }),
          fetch(`/api/dashboard/${normalizedAddress}/follows?type=following`, {
            cache: 'no-store',
            credentials: 'include',
          }),
        ])

        if (followersRes.ok) {
          const data = await followersRes.json()
          setFollowers(data || [])
        }

        if (followingRes.ok) {
          const data = await followingRes.json()
          setFollowing(data || [])
        }
      } catch (error) {
        console.error('Error fetching follows:', error)
        toast.error('Takip listesi alınırken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchFollows()
  }, [mounted, address])


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
    item.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFollowing = following.filter((item) =>
    item.address.toLowerCase().includes(searchQuery.toLowerCase())
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
      toast.error(error.message || 'Failed to unfollow')
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
    showUnfollow: boolean = false
  ) => {
    if (loading) {
      return (
        <div className="space-y-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${i < 3 ? 'border-b border-border/40' : ''}`}>
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      )
    }

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          {emptyTitle === 'No followers yet' ? (
            <Users className="h-10 w-10 text-muted-foreground" />
          ) : (
            <UserPlus className="h-10 w-10 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium mb-1">{emptyTitle}</p>
            <p className="text-xs text-muted-foreground mb-4">
              {emptyHelper}
            </p>
          </div>
          {emptyTitle === 'No followers yet' && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/p/${address}`}>
                <Share2 className="mr-2 h-3.5 w-3.5" />
                Share your profile
              </Link>
            </Button>
          )}
          {emptyTitle === "You're not following anyone yet" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
            >
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Explore profiles
            </Button>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-0">
        {items.map((item, index) => {
          const normalizedAddr = item.address.toLowerCase()
          const avatarUrl = `https://effigy.im/a/${normalizedAddr}.svg`
          const fallbackText = item.address.slice(2, 4).toUpperCase()
          const shortAddress = formatAddress(item.address, 4)
          const primaryLabel = (item.displayName || '').trim() || shortAddress

          return (
            <div
              key={item.address}
              className={`flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors ${
                index < items.length - 1 ? 'border-b border-border/40' : ''
              }`}
            >
              <Avatar className="h-11 w-11 flex-shrink-0">
                <AvatarImage src={avatarUrl} alt={shortAddress} />
                <AvatarFallback className="text-xs">{fallbackText}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{primaryLabel}</p>
                <p className="text-xs font-mono text-muted-foreground truncate">
                  {shortAddress}
                </p>
                {showUnfollow && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Followed on {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 text-xs"
                >
                  <Link href={`/p/${normalizedAddr}`}>
                    View profile
                  </Link>
                </Button>
                {showUnfollow && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnfollow(item.address)}
                    className="h-8 text-xs"
                  >
                    Unfollow
                  </Button>
                )}
              </div>
            </div>
          )
        })}
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
              </TabsList>
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 h-8"
              />
            </div>
            <TabsContent value="followers" className="mt-4">
              {renderList(
                filteredFollowers,
                'No followers yet',
                'Share your profile to get discovered.'
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
          </Tabs>
        </CardContent>
      </Card>
    </PageShell>
  )
}
