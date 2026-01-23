'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, Users, UserPlus } from 'lucide-react'
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
    }
  }, [searchParams])

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

  if (!mounted) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const renderList = (items: FollowItem[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {items.map((item) => {
          const normalizedAddr = item.address.toLowerCase()
          const avatarUrl = `https://effigy.im/a/${normalizedAddr}.svg`
          const fallbackText = item.address.slice(2, 4).toUpperCase()

          return (
            <div
              key={item.address}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-accent/50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl} alt={formatAddress(item.address)} />
                <AvatarFallback className="text-xs">{fallbackText}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono truncate">{formatAddress(item.address, 4)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-7"
                      >
                        <Link href={`/p/${normalizedAddr}`}>
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          View profile
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View profile</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <PageShell title="Social" subtitle="Manage your followers and following">
      <Card className="bg-card border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Follows</CardTitle>
          <CardDescription>View and manage your social connections</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <TabsList>
                <TabsTrigger value="followers" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span>Followers</span>
                </TabsTrigger>
                <TabsTrigger value="following" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Following</span>
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
                'No followers yet. Share your profile to get followers!'
              )}
            </TabsContent>
            <TabsContent value="following" className="mt-4">
              {renderList(
                filteredFollowing,
                'You are not following anyone yet. Start following profiles to see them here!'
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageShell>
  )
}
