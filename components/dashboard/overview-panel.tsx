'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  RefreshCw,
  CheckCircle2,
  Activity,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  AlertCircle,
  Copy,
  Share2,
  Eye,
  Users,
  UserPlus,
  Link2,
} from "lucide-react"
import { formatAddress } from "@/lib/utils"
import Link from "next/link"
import { PageShell } from "@/components/app-shell/page-shell"
import { toast } from "sonner"
import { getCachedLogo, setCachedLogo, setCachedLogos, getCacheKey } from "@/lib/logo-cache"
import { formatDistanceToNow } from "date-fns"
import type { ActivityTransaction } from "@/lib/activity/fetchActivity"
import { getPublicProfileHref } from "@/lib/routing"
import { getProfileViewCount } from "@/lib/analytics"
import { isProfileClaimed } from "@/lib/profile/isProfileClaimed"
import { ClaimProfileButton } from "@/components/claim-profile-button"
import { QRCodeModal } from "@/components/qr/qr-code-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Twitter, QrCode } from "lucide-react"
import { useAccount } from "wagmi"

interface WalletData {
  address: string
  nativeBalance: string
  tokenBalances: Array<{
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
  transactions: Array<{
    hash: string
    from: string
    to: string
    value: string
    timestamp: number
    blockNumber: number
  }>
  txCount: number
  firstSeen?: number
  lastSeen?: number
}

interface ProfileData {
  displayName?: string | null
  bio?: string | null
  slug?: string | null
  status?: string | null
  claimedAt?: string | Date | null
  socialLinks?: Array<{ id?: string; platform?: string; type?: string; url: string; label?: string }> | null
}

interface OverviewPanelProps {
  walletData: WalletData | null
  profile: ProfileData | null
  address: string
  loading?: boolean
  error?: Error | null
  onRetry?: () => void
  onClaimSuccess?: () => void
}

interface QuickStats {
  followers: number | null
  following: number | null
  views7d: number | null
  totalLinks: number | null
}


export function OverviewPanel({ walletData, profile, address, loading: propLoading, error: propError, onRetry, onClaimSuccess }: OverviewPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { address: connectedAddress } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [quickStats, setQuickStats] = useState<QuickStats>({
    followers: null,
    following: null,
    views7d: null,
    totalLinks: null,
  })
  const [qrModalOpen, setQrModalOpen] = useState(false)

  // Get address from route param (primary) or prop (fallback)
  const addressMatch = pathname?.match(/\/dashboard\/(0x[a-fA-F0-9]{40})/)
  const urlAddress = addressMatch ? addressMatch[1].toLowerCase() : null
  const targetAddress = urlAddress || address?.toLowerCase() || ''
  const normalizedAddress = targetAddress.toLowerCase()

  // Check if the profile belongs to the connected wallet
  const isOwnProfile = connectedAddress && normalizedAddress === connectedAddress.toLowerCase()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch follow stats using React Query for automatic invalidation
  const { data: followStats } = useQuery({
    queryKey: ['follow-stats', normalizedAddress],
    queryFn: async () => {
      const followStatsRes = await fetch(`/api/profile/${normalizedAddress}/follow-stats`, {
        cache: 'no-store',
      })
      if (!followStatsRes.ok) {
        throw new Error('Failed to fetch follow stats')
      }
      return followStatsRes.json()
    },
    enabled: mounted && !!normalizedAddress,
    retry: 1,
  })

  // Update quick stats when follow stats change
  useEffect(() => {
    if (followStats) {
      setQuickStats((prev) => ({
        ...prev,
        followers: followStats.followersCount ?? 0,
        following: followStats.followingCount ?? 0,
      }))
    }
  }, [followStats])

  // Fetch quick stats
  useEffect(() => {
    if (!mounted || !normalizedAddress) return

    const fetchQuickStats = async () => {
      try {

        // Fetch view count (7d) from analytics
        const views7d = getProfileViewCount(normalizedAddress, 7)
        setQuickStats((prev) => ({
          ...prev,
          views7d,
        }))

        // Fetch links count
        try {
          const linksRes = await fetch(`/api/profile/links?address=${encodeURIComponent(normalizedAddress)}`)
          if (linksRes.ok) {
            const linksData = await linksRes.json()
            const enabledLinks = (linksData.links || []).filter((link: any) => link.enabled)
            setQuickStats((prev) => ({
              ...prev,
              totalLinks: enabledLinks.length,
            }))
          } else {
            // API request failed, set to 0
            setQuickStats((prev) => ({
              ...prev,
              totalLinks: 0,
            }))
          }
        } catch (linksError) {
          // Network error or parse error, set to 0
          console.error('[Overview] Error fetching links:', linksError)
          setQuickStats((prev) => ({
            ...prev,
            totalLinks: 0,
          }))
        }
      } catch (error) {
        console.error('[Overview] Error fetching quick stats:', error)
      }
    }

    fetchQuickStats()
  }, [mounted, normalizedAddress])

  const ACTIVITY_LIMIT = 10
  const ASSETS_LIMIT = 5

  // Fetch activity data
  const {
    data: activityData,
    isLoading: activityLoading,
    error: activityError,
    refetch: refetchActivity
  } = useQuery<{ items: ActivityTransaction[] }>({
    queryKey: ['wallet-activity-preview', targetAddress],
    queryFn: async () => {
      if (!targetAddress) {
        console.error('[Overview Activity] No address provided')
        throw new Error('No address')
      }
      const normalizedAddress = targetAddress.toLowerCase()
      console.log('[Overview Activity] Starting fetch for:', normalizedAddress)
      try {
        const response = await fetch(`/api/wallet/${normalizedAddress}/activity?limit=${ACTIVITY_LIMIT}`)
        if (!response.ok) {
          const errorText = await response.text()
          console.error('[Overview Activity] Fetch failed:', response.status, errorText)
          throw new Error(`Failed to fetch activity: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        console.log('[Overview Activity] Fetch successful:', { itemCount: data.items?.length || 0 })
        return data
      } catch (error) {
        console.error('[Overview Activity] Fetch error:', error)
        throw error
      }
    },
    enabled: mounted && !!targetAddress,
    retry: 1,
    retryDelay: 1000,
  })

  // Fetch assets data
  const {
    data: assetsData,
    isLoading: assetsLoading,
    error: assetsError,
    refetch: refetchAssets
  } = useQuery<{
    tokens?: Array<{
      address: string | null
      symbol: string
      name: string
      balanceFormatted: string
      valueUsd?: number
      logoUrl?: string
      isNative?: boolean
    }>
    nfts?: Array<{
      contract: string
      tokenId: string
      name?: string
      imageUrl?: string
    }>
  }>({
    queryKey: ['wallet-assets-preview', targetAddress],
    queryFn: async () => {
      if (!targetAddress) {
        console.error('[Overview Assets] No address provided')
        throw new Error('No address')
      }
      const normalizedAddress = targetAddress.toLowerCase()
      console.log('[Overview Assets] Starting fetch for:', normalizedAddress)
      try {
        const response = await fetch(`/api/wallet/${normalizedAddress}/assets?tab=tokens&limit=${ASSETS_LIMIT}`)
        if (!response.ok) {
          const errorText = await response.text()
          console.error('[Overview Assets] Fetch failed:', response.status, errorText)
          throw new Error(`Failed to fetch assets: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        console.log('[Overview Assets] Fetch successful:', {
          tokenCount: data.tokens?.length || 0,
          nftCount: data.nfts?.length || 0
        })
        return data
      } catch (error) {
        console.error('[Overview Assets] Fetch error:', error)
        throw error
      }
    },
    enabled: mounted && !!targetAddress,
    retry: 1,
    retryDelay: 1000,
    // Assets preview can be cached for 60 seconds
    staleTime: 60 * 1000, // 60 seconds
    refetchOnWindowFocus: false,
  })

  // Cache logos when assets data is loaded
  useEffect(() => {
    if (!assetsData?.tokens || !mounted) return

    // Cache all logo URLs from API response
    const logosToCache: Record<string, string | null> = {}

    for (const token of assetsData.tokens) {
      const cacheKey = getCacheKey(token.address, token.symbol)
      if (token.logoUrl) {
        logosToCache[cacheKey] = token.logoUrl
      }
    }

    if (Object.keys(logosToCache).length > 0) {
      setCachedLogos(logosToCache)
    }
  }, [assetsData, mounted])

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      toast.success('Hash copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const getStatusIcon = (status: ActivityTransaction['status']) => {
    if (status === 'success') {
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
    } else if (status === 'failed') {
      return <CheckCircle2 className="h-3.5 w-3.5 text-red-500" />
    } else {
      return <CheckCircle2 className="h-3.5 w-3.5 text-yellow-500" />
    }
  }

  const getDirectionIcon = (direction: ActivityTransaction['direction']) => {
    if (direction === 'outgoing') {
      return <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
    } else {
      return <ArrowDownRight className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  const getExplorerLink = (hash: string): string => {
    return `https://snowtrace.io/tx/${hash}`
  }

  // Use prop loading/error if provided, otherwise fall back to walletData check
  const isLoading = propLoading !== undefined ? propLoading : walletData === null
  const error = propError

  // Show error state if there's an error and no data
  if (error && !walletData && !isLoading) {
    return (
      <PageShell title="Overview" subtitle="Wallet summary and activity">
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Overview</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                {error.message || 'An error occurred while loading wallet data. Please try again.'}
              </p>
              {onRetry && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    console.log('[Overview] Retry button clicked')
                    onRetry()
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  const isClaimed = isProfileClaimed(profile)
  const displayName = profile?.displayName || formatAddress(normalizedAddress, 4)
  const bio = profile?.bio || null
  const publicProfileHref = normalizedAddress ? getPublicProfileHref(normalizedAddress, profile?.slug) : null

  const handleCopyAddress = async () => {
    if (!normalizedAddress) return
    try {
      await navigator.clipboard.writeText(normalizedAddress)
      toast.success('Address copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleCopyProfileLink = async () => {
    if (!publicProfileHref) return
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const profileUrl = `${baseUrl}${publicProfileHref}`
      await navigator.clipboard.writeText(profileUrl)
      toast.success('Profile link copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleShareOnX = () => {
    if (!publicProfileHref) return
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const profileUrl = `${baseUrl}${publicProfileHref}`
    let shareText: string
    if (isOwnProfile) {
      shareText = 'Just claimed my SOCI4L profile on Avalanche.\n\nTrack my on-chain identity and links in one place.\n\n' + profileUrl
    } else {
      const profileName = profile?.displayName || formatAddress(normalizedAddress, 4)
      shareText = `Check out this SOCI4L profile on Avalanche: ${profileName}\n\nTrack on-chain identity and links in one place.\n\n` + profileUrl
    }
    const text = encodeURIComponent(shareText)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <PageShell title="Overview" subtitle="Wallet summary and activity">
      <div className="space-y-6">
        {/* Profile Snapshot */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              {/* Left: Avatar + Name/Bio */}
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  {normalizedAddress ? (
                    <>
                      <AvatarImage src={`https://effigy.im/a/${normalizedAddress}.svg`} alt={displayName} />
                      <AvatarFallback className="text-xs">
                        {normalizedAddress.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback className="text-xs">??</AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0 flex-1">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-base font-semibold truncate">{displayName}</h2>
                        {!isClaimed && (
                          <ClaimProfileButton address={normalizedAddress} onSuccess={onClaimSuccess} />
                        )}
                      </div>
                      {bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{bio}</p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {formatAddress(normalizedAddress, 4)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Quick Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleCopyAddress}
                        aria-label="Copy address"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy address</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {publicProfileHref && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          asChild
                          aria-label="Open public profile"
                        >
                          <Link href={publicProfileHref}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Open public profile</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {publicProfileHref && (
                  <DropdownMenu>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              aria-label="Share profile"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Share profile</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleCopyProfileLink}>
                        <Copy className="mr-2 h-4 w-4" />
                        <span>Copy profile link</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShareOnX}>
                        <Twitter className="mr-2 h-4 w-4" />
                        <span>Share on X</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setQrModalOpen(true)}>
                        <QrCode className="mr-2 h-4 w-4" />
                        <span>Show QR code</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Hints (Mini Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              {quickStats.followers !== null ? (
                <p className="text-lg font-semibold tracking-tight">
                  {quickStats.followers.toLocaleString('en-US')}
                </p>
              ) : (
                <Skeleton className="h-6 w-12" />
              )}
            </CardContent>
          </Card>
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Following</p>
              </div>
              {quickStats.following !== null ? (
                <p className="text-lg font-semibold tracking-tight">
                  {quickStats.following.toLocaleString('en-US')}
                </p>
              ) : (
                <Skeleton className="h-6 w-12" />
              )}
            </CardContent>
          </Card>
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Views (7d)</p>
              </div>
              {quickStats.views7d !== null ? (
                <p className="text-lg font-semibold tracking-tight">
                  {quickStats.views7d.toLocaleString('en-US')}
                </p>
              ) : (
                <Skeleton className="h-6 w-12" />
              )}
            </CardContent>
          </Card>
          <Card className="bg-card border border-border/60 shadow-sm opacity-50">
            <CardContent className="p-4 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Links</p>
              </div>
              {quickStats.totalLinks !== null ? (
                <p className="text-lg font-semibold tracking-tight text-muted-foreground">
                  {quickStats.totalLinks.toLocaleString('en-US')}
                </p>
              ) : (
                <Skeleton className="h-6 w-12" />
              )}
            </CardContent>
        </div>


        {/* Recent Activity Section (Full Width) */}
        <Card className="bg-card border border-border/60 shadow-sm relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Last {ACTIVITY_LIMIT} transactions</CardDescription>
            </div>
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
          </CardHeader>
          <CardContent className="relative">
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
                  Tekrar Dene
                </Button>
              </div>
            ) : activityData?.items && activityData.items.length > 0 ? (
              <div className="space-y-3 relative">
                {activityData.items.map((tx, idx) => {
                  return (
                    <div key={tx.hash || idx} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {getDirectionIcon(tx.direction)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tx.status)}
                          <Badge variant="secondary" className="text-xs">
                            {tx.type === 'transfer' ? 'Transfer' : tx.type === 'contract' ? 'Kontrat' : 'Swap'}
                          </Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleCopyHash(tx.hash)}
                                  className="text-xs font-mono truncate hover:text-primary"
                                >
                                  {formatAddress(tx.hash, 4)}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{tx.hash}</p>
                                <p className="text-xs mt-1">Click to copy</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {parseFloat(tx.nativeValueAvax) > 0
                              ? `${parseFloat(tx.nativeValueAvax).toFixed(4)} AVAX`
                              : tx.tokenTransfers.length > 0
                                ? `${parseFloat(tx.tokenTransfers[0].amount).toFixed(4)} ${tx.tokenTransfers[0].symbol}`
                                : '-'}
                          </p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(tx.timestamp * 1000), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              asChild
                              aria-label="View on Explorer"
                            >
                              <a
                                href={getExplorerLink(tx.hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View on Explorer</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )
                })}
                {activityData.items.length >= 5 && (
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent via-background/60 to-background pointer-events-none" />
                )}
                <div className="pt-2 relative z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/dashboard/${normalizedAddress}?tab=activity`)}
                  >
                    View all
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
                  onClick={() => router.push(`/dashboard/${normalizedAddress}?tab=activity`)}
                >
                  View all activity
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assets Card */}
        <Card className="bg-card border border-border/60 shadow-sm relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Assets</CardTitle>
              <CardDescription className="text-xs">Token ve NFT'ler</CardDescription>
            </div>
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
          </CardHeader>
          <CardContent className="relative">
            {assetsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
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
                  Try Again
                </Button>
              </div>
            ) : assetsData && ((assetsData.tokens && assetsData.tokens.length > 0) || (assetsData.nfts && assetsData.nfts.length > 0)) ? (
              <div className="space-y-3 relative">
                {assetsData.tokens?.slice(0, ASSETS_LIMIT).map((token, idx) => {
                  // Get logo URL with cache fallback
                  const getLogoUrl = (): string | null => {
                    // First check API response
                    if (token.logoUrl) {
                      return token.logoUrl
                    }
                    // If no logo in API response, check cache
                    const cacheKey = getCacheKey(token.address, token.symbol)
                    const cachedLogo = getCachedLogo(cacheKey)
                    if (cachedLogo) {
                      return cachedLogo
                    }
                    return null
                  }

                  const logoUrl = getLogoUrl()

                  return (
                    <div key={token.address || idx} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={token.symbol}
                            className="h-10 w-10 rounded-full object-cover"
                            onLoad={() => {
                              // Cache logo URL when successfully loaded
                              const cacheKey = getCacheKey(token.address, token.symbol)
                              setCachedLogo(cacheKey, logoUrl)
                            }}
                            onError={() => {
                              // Mark as "no logo found" in cache to avoid retrying
                              const cacheKey = getCacheKey(token.address, token.symbol)
                              setCachedLogo(cacheKey, null)
                            }}
                          />
                        ) : (
                          <Coins className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{token.symbol}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            {token.balanceFormatted} {token.symbol}
                          </p>
                          {token.valueUsd !== undefined && token.valueUsd > 0 && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <p className="text-xs text-muted-foreground">
                                ${token.valueUsd.toFixed(2)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {assetsData.nfts?.slice(0, Math.max(0, ASSETS_LIMIT - (assetsData.tokens?.length || 0))).map((nft, idx) => (
                  <div key={`${nft.contract}-${nft.tokenId}` || idx} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {nft.imageUrl ? (
                        <img src={nft.imageUrl} alt={nft.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <Coins className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{nft.name || `NFT #${nft.tokenId}`}</p>
                      <p className="text-xs text-muted-foreground">Token ID: {formatAddress(nft.tokenId, 4)}</p>
                    </div>
                  </div>
                ))}
                {((assetsData.tokens && assetsData.tokens.length >= ASSETS_LIMIT) || (assetsData.nfts && assetsData.nfts.length > 0)) && (
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background/90 backdrop-blur-sm pointer-events-none" />
                )}
                <div className="pt-2 relative z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/dashboard/${normalizedAddress}?tab=assets&assetTab=tokens`)}
                  >
                    View all
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
                  onClick={() => router.push(`/dashboard/${normalizedAddress}?tab=assets&assetTab=tokens`)}
                >
                  View all assets
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code Modal */}
      {normalizedAddress && publicProfileHref && (
        <QRCodeModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          profile={{
            address: normalizedAddress,
            slug: profile?.slug || null,
            displayName: profile?.displayName || null,
            avatarUrl: `https://effigy.im/a/${normalizedAddress}.svg`,
          }}
        />
      )}
    </div>
    </PageShell >
  )
}
