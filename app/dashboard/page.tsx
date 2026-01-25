'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Loader2, 
  Twitter, 
  Github, 
  Globe, 
  ExternalLink, 
  Copy, 
  Share2, 
  QrCode, 
  Eye,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Coins,
  Image as ImageIcon,
  FileText,
  Activity,
} from 'lucide-react'
import { formatAddress, isValidAddress } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { PageShell } from '@/components/app-shell/page-shell'
import { ClaimProfileButton } from '@/components/claim-profile-button'
import { QRCodeModal } from '@/components/qr/qr-code-modal'
import { getPublicProfileHref } from '@/lib/routing'
import { isProfileClaimed } from '@/lib/profile/isProfileClaimed'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getProfileViewCount, getTotalLinkClicks, getEventsForProfile } from '@/lib/analytics'
import { Users, UserPlus, Link2 } from 'lucide-react'

interface SummaryData {
  avaxBalance: string
  txCount: number
  tokenCount: number
  nftCount: number
  claimed: boolean
  visibility: string
  networkOk: boolean
  profile: {
    displayName?: string | null
    bio?: string | null
    slug?: string | null
    status?: string
  } | null
}

interface ActivityItem {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
  blockNumber: number
}

interface AssetsData {
  topTokens: Array<{
    contractAddress: string
    name: string
    symbol: string
    balance: string
    decimals: number
  }>
  nfts: Array<{
    contractAddress: string
    tokenId: string
    name?: string
    image?: string
  }>
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() / 1000) - timestamp)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function getExplorerLink(hash: string): string {
  return `https://snowtrace.io/tx/${hash}`
}

function getShareUrl(address: string, slug?: string | null): string {
  if (typeof window === 'undefined') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const profilePath = getPublicProfileHref(address, slug)
    return `${appUrl}${profilePath}`
  }
  const baseUrl = window.location.origin
  const profilePath = getPublicProfileHref(address, slug)
  return `${baseUrl}${profilePath}`
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [addressInput, setAddressInput] = useState('')
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [quickStats, setQuickStats] = useState<{
    followers: number
    following: number
    views7d: number
    totalLinks: number
    totalClicks7d: number
  }>({
    followers: 0,
    following: 0,
    views7d: 0,
    totalLinks: 0,
    totalClicks7d: 0,
  })
  const { address: connectedAddress, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch quick stats (followers, following, views, links, clicks)
  useEffect(() => {
    if (!mounted || !connectedAddress || !isConnected) return

    const fetchQuickStats = async () => {
      try {
        const normalizedAddress = connectedAddress.toLowerCase()

        // Fetch follow stats
        const followStatsRes = await fetch(`/api/profile/${normalizedAddress}/follow-stats`, {
          cache: 'no-store',
        })
        if (followStatsRes.ok) {
          const followStats = await followStatsRes.json()
          setQuickStats((prev) => ({
            ...prev,
            followers: followStats.followersCount || 0,
            following: followStats.followingCount || 0,
          }))
        }

        // Fetch view count (7d) from analytics
        const views7d = getProfileViewCount(normalizedAddress, 7)
        
        // Fetch total clicks (7d) from analytics
        const totalClicks7d = getTotalLinkClicks(normalizedAddress, 7)

        // Fetch links count
        const linksRes = await fetch(`/api/profile/links?address=${encodeURIComponent(normalizedAddress)}`)
        if (linksRes.ok) {
          const linksData = await linksRes.json()
          const enabledLinks = (linksData.links || []).filter((link: any) => link.enabled)
          setQuickStats((prev) => ({
            ...prev,
            totalLinks: enabledLinks.length,
            views7d,
            totalClicks7d,
          }))
        } else {
          setQuickStats((prev) => ({
            ...prev,
            views7d,
            totalClicks7d,
          }))
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching quick stats:', error)
      }
    }

    fetchQuickStats()
  }, [mounted, connectedAddress, isConnected])

  // Fetch summary data
  const { 
    data: summaryData, 
    isLoading: summaryLoading, 
    error: summaryError,
    refetch: refetchSummary 
  } = useQuery<SummaryData>({
    queryKey: ['wallet-summary', connectedAddress],
    queryFn: async () => {
      if (!connectedAddress) throw new Error('No address')
      const normalizedAddress = connectedAddress.toLowerCase()
      const response = await fetch(`/api/wallet/${normalizedAddress}/summary`)
      if (!response.ok) throw new Error('Failed to fetch summary')
      return response.json()
    },
    enabled: mounted && isConnected && !!connectedAddress,
  })

  // Fetch activity data (limit to 7 for preview)
  const { 
    data: activityData, 
    isLoading: activityLoading, 
    error: activityError,
    refetch: refetchActivity 
  } = useQuery<{ items: ActivityItem[] }>({
    queryKey: ['wallet-activity', connectedAddress],
    queryFn: async () => {
      if (!connectedAddress) throw new Error('No address')
      const normalizedAddress = connectedAddress.toLowerCase()
      const response = await fetch(`/api/wallet/${normalizedAddress}/activity?limit=7`)
      if (!response.ok) throw new Error('Failed to fetch activity')
      return response.json()
    },
    enabled: mounted && isConnected && !!connectedAddress,
  })

  // Fetch assets data
  const { 
    data: assetsData, 
    isLoading: assetsLoading, 
    error: assetsError,
    refetch: refetchAssets 
  } = useQuery<AssetsData>({
    queryKey: ['wallet-assets', connectedAddress],
    queryFn: async () => {
      if (!connectedAddress) throw new Error('No address')
      const normalizedAddress = connectedAddress.toLowerCase()
      const response = await fetch(`/api/wallet/${normalizedAddress}/assets?top=3&nfts=3`)
      if (!response.ok) throw new Error('Failed to fetch assets')
      return response.json()
    },
    enabled: mounted && isConnected && !!connectedAddress,
  })

  const handleAddressSubmit = () => {
    if (!addressInput.trim()) return
    
    const trimmedAddress = addressInput.trim()
    if (isValidAddress(trimmedAddress)) {
      const normalizedAddress = trimmedAddress.toLowerCase()
      router.push(`/dashboard/${normalizedAddress}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddressSubmit()
    }
  }

  const handleCopyAddress = async () => {
    if (!connectedAddress) return
    try {
      await navigator.clipboard.writeText(connectedAddress)
      toast.success('Address copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      toast.success('Hash copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  const handleCopyLink = async () => {
    if (!connectedAddress) return
    const url = getShareUrl(connectedAddress, summaryData?.profile?.slug)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Profile link copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  const handleShareTwitter = () => {
    if (!connectedAddress) return
    const url = getShareUrl(connectedAddress, summaryData?.profile?.slug)
    const shareText = 'Just claimed my SOCI4L profile on Avalanche.\n\nTrack my on-chain identity and links in one place.\n\n' + url
    const text = encodeURIComponent(shareText)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const getSocialIcon = (type: string) => {
    const normalizedType = type.toLowerCase()
    if (normalizedType.includes('twitter') || normalizedType.includes('x')) {
      return <Twitter className="h-3.5 w-3.5" />
    } else if (normalizedType.includes('github')) {
      return <Github className="h-3.5 w-3.5" />
    } else {
      return <Globe className="h-3.5 w-3.5" />
    }
  }

  // Get claim status (only used in Profile Snapshot for unclaimed state)
  const normalizedAddress = connectedAddress?.toLowerCase() || ''
  const profile = summaryData?.profile
  const isClaimed = isProfileClaimed(profile)
  const shortAddress = normalizedAddress ? formatAddress(normalizedAddress, 4) : ''
  const displayName = profile?.displayName || shortAddress
  const bio = profile?.bio || null

  if (!mounted) {
    return (
      <PageShell title="Dashboard" subtitle="Overview">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
        </div>
      </PageShell>
    )
  }

  if (!isConnected) {
    return (
      <PageShell title="Dashboard" subtitle="Overview">
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-base font-semibold">Wallet Connection Required</CardTitle>
            <CardDescription className="text-xs">Connect your wallet to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {connectors.length > 0 ? (
              <Button
                onClick={() => connect({ connector: connectors[0] })}
                variant="default"
                size="sm"
                className="w-full bg-accent-primary text-black hover:bg-accent-primary/90"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </Button>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                No wallet connectors available
              </p>
            )}
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  // Guard: if address is missing after connection check, show error
  if (isConnected && !connectedAddress) {
    return (
      <PageShell title="Dashboard" subtitle="Overview">
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-base font-semibold">Wallet Address Required</CardTitle>
            <CardDescription className="text-xs">Please connect a valid wallet address</CardDescription>
          </CardHeader>
        </Card>
      </PageShell>
    )
  }

  const publicProfileHref = summaryData?.profile?.slug 
    ? `/p/${summaryData.profile.slug}` 
    : `/p/${normalizedAddress}`

  return (
    <PageShell title="Dashboard" subtitle="Overview" mode="full-width">
      {/* Profile Snapshot */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Avatar + Name + Bio */}
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <Avatar className="h-12 w-12 shrink-0">
                {normalizedAddress ? (
                  <>
                    <AvatarImage
                      src={`https://effigy.im/a/${normalizedAddress}.svg`}
                      alt={displayName}
                    />
                    <AvatarFallback className="text-xs">
                      {normalizedAddress.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="text-xs">??</AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0 space-y-1.5 flex-1">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <h1 className="text-lg font-semibold truncate">{displayName}</h1>
                  {summaryLoading ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    <>
                      {summaryData?.visibility === 'PUBLIC' ? (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0.5 h-5">
                          Public
                        </Badge>
                      ) : summaryData?.visibility === 'PRIVATE' ? (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
                          Private
                        </Badge>
                      ) : null}
                      {!isClaimed && !summaryLoading && (
                        <ClaimProfileButton address={normalizedAddress} />
                      )}
                    </>
                  )}
                </div>
                {bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{bio}</p>
                )}
              </div>
            </div>
            {/* Right: Quick Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCopyAddress}
                      aria-label="Copy address"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy address</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                      aria-label="Open public profile"
                    >
                      <Link href={publicProfileHref} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open public profile</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Share profile"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Share profile</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy profile link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareTwitter}>
                    <Twitter className="mr-2 h-4 w-4" />
                    Share on X
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setQrModalOpen(true)}>
                    <QrCode className="mr-2 h-4 w-4" />
                    Show QR code
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Followers */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Followers</p>
            {summaryLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-semibold">{quickStats.followers}</p>
            )}
          </CardContent>
        </Card>

        {/* Following */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Following</p>
            {summaryLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-semibold">{quickStats.following}</p>
            )}
          </CardContent>
        </Card>

        {/* Views (7d) */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Views (7d)</p>
            {summaryLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-semibold">{quickStats.views7d}</p>
            )}
          </CardContent>
        </Card>

        {/* Total Links */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Links</p>
            {summaryLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-semibold">{quickStats.totalLinks}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Assets */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Last 5-7 transactions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => refetchActivity()}
                      disabled={activityLoading}
                      aria-label="Refresh activity"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${activityLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh activity</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activityError ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm font-medium mb-1">Failed to load activity</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchActivity()}
                  className="mt-2"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Retry
                </Button>
              </div>
            ) : activityData?.items && activityData.items.length > 0 ? (
              <div className="relative">
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {activityData.items.map((item, idx) => {
                    const isOutgoing = item.from.toLowerCase() === normalizedAddress
                    return (
                      <div key={item.hash || idx} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {isOutgoing ? (
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleCopyHash(item.hash)}
                                    className="text-sm font-mono truncate hover:text-primary"
                                  >
                                    {formatAddress(item.hash, 4)}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-mono text-xs">{item.hash}</p>
                                  <p className="text-xs mt-1">Click to copy</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {parseFloat(item.value).toFixed(4)} AVAX
                            </p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(item.timestamp)}
                            </p>
                          </div>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                                aria-label="View on explorer"
                              >
                                <a
                                  href={getExplorerLink(item.hash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View on explorer</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )
                  })}
                </div>
                {/* Bottom fade + View all link */}
                <div className="relative mt-3 pt-3 border-t">
                  <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/dashboard/${normalizedAddress}?tab=activity`)}
                  >
                    View all activity
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">No recent transactions detected</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Activity will appear as your wallet interacts on-chain.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchActivity()}
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Refresh
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Assets</CardTitle>
              <CardDescription className="text-xs">Top tokens and NFTs</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => refetchAssets()}
                      disabled={assetsLoading}
                      aria-label="Refresh assets"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${assetsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh assets</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            {assetsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : assetsError ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm font-medium mb-1">Failed to load assets</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchAssets()}
                  className="mt-2"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Retry
                </Button>
              </div>
            ) : assetsData &&
              ((assetsData.topTokens && assetsData.topTokens.length > 0) ||
                (assetsData.nfts && assetsData.nfts.length > 0)) ? (
              <div className="relative">
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {/* Filter out invalid tokens (0x0000... contracts) */}
                  {(assetsData.topTokens || []).filter((token) => {
                    // Filter out zero address or invalid contracts
                    const addr = token.contractAddress?.toLowerCase() || ''
                    return addr && addr !== '0x0000000000000000000000000000000000000000' && parseFloat(token.balance) > 0
                  }).map((token, idx) => (
                    <div key={token.contractAddress || idx} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Coins className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{token.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {parseFloat(token.balance).toFixed(4)} {token.symbol}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(assetsData.nfts || []).map((nft, idx) => (
                    <div key={`${nft.contractAddress}-${nft.tokenId}` || idx} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {nft.image ? (
                          <img src={nft.image} alt={nft.name} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{nft.name || `NFT #${nft.tokenId}`}</p>
                        <p className="text-xs text-muted-foreground">Token ID: {formatAddress(nft.tokenId, 4)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Bottom fade + View all link */}
                <div className="relative mt-3 pt-3 border-t">
                  <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/dashboard/${normalizedAddress}?tab=assets&assetTab=tokens`)}
                  >
                    View all assets
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Coins className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">No assets detected</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Tokens and NFTs will appear here once this wallet holds assets.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchAssets()}
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Refresh
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manage Another Profile */}
      <Card>
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-sm font-medium">Manage Another Profile</CardTitle>
          <CardDescription className="text-xs">
            Enter a wallet address to manage its profile
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            <Label htmlFor="address" className="text-xs">Wallet Address</Label>
            <div className="flex gap-2">
              <Input
                id="address"
                placeholder="0x..."
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 h-8 text-sm"
              />
              <Button
                onClick={handleAddressSubmit}
                disabled={!isValidAddress(addressInput.trim())}
                size="sm"
                variant="outline"
              >
                Go
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {connectedAddress && (
        <QRCodeModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          profile={{
            address: connectedAddress,
            slug: summaryData?.profile?.slug || null,
            displayName: summaryData?.profile?.displayName || null,
          }}
        />
      )}
    </PageShell>
  )
}
