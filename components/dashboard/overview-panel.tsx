'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RefreshCw, CheckCircle2, Activity, Coins, ArrowUpRight, ArrowDownRight, ExternalLink, AlertCircle, Copy } from 'lucide-react'
import { formatAddress } from '@/lib/utils'
import Link from 'next/link'
import { PageShell } from '@/components/app-shell/page-shell'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import type { ActivityTransaction } from '@/lib/activity/fetchActivity'
import { isProfileClaimed } from '@/lib/profile/isProfileClaimed'
import { getPublicProfileHref } from '@/lib/routing'

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

interface WalletHeaderProps {
  address: string
  profile: ProfileData | null
  isLoading: boolean
  lastUpdatedText?: string | null
  onCopyAddress: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
}

function WalletHeader({
  address,
  profile,
  isLoading,
  lastUpdatedText,
  onCopyAddress,
  onRefresh,
  isRefreshing,
}: WalletHeaderProps) {
  const isClaimed = isProfileClaimed(profile)
  const hasAddress = !!address
  const displayName = (profile?.displayName || '').trim()
  const primaryLabel = displayName || (hasAddress ? formatAddress(address) : '')
  const secondaryAddress = displayName && hasAddress ? formatAddress(address) : null

  const hasPublicProfile = isClaimed && hasAddress
  const publicProfileHref = hasPublicProfile ? getPublicProfileHref(address, profile?.slug) : null

  return (
    <Card className="bg-card border border-border/60 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-12 w-12">
              {hasAddress ? (
                <>
                  <AvatarImage src={`https://effigy.im/a/${address}.svg`} alt={primaryLabel || address} />
                  <AvatarFallback className="text-xs">
                    {address.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </>
              ) : (
                <AvatarFallback className="text-xs">??</AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 space-y-1">
              {isLoading && !primaryLabel ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-semibold truncate">{primaryLabel || 'Wallet'}</p>
                    {secondaryAddress && (
                      <span className="text-[11px] font-mono text-muted-foreground truncate">
                        {secondaryAddress}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avalanche
                    {lastUpdatedText ? ` • ${lastUpdatedText}` : ''}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {hasPublicProfile && publicProfileHref && (
              <Button variant="default" size="sm" asChild>
                <Link href={publicProfileHref}>
                  <span className="mr-1.5">View Public Profile</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}

            {hasAddress && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={onCopyAddress}
                      aria-label="Copy address"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy address</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {onRefresh && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={onRefresh}
                      aria-label="Refresh overview"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh overview</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function OverviewPanel({ walletData, profile, address, loading: propLoading, error: propError, onRetry }: OverviewPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  // Get address from route param (primary) or prop (fallback)
  const addressMatch = pathname?.match(/\/dashboard\/(0x[a-fA-F0-9]{40})/)
  const urlAddress = addressMatch ? addressMatch[1].toLowerCase() : null
  const targetAddress = urlAddress || address?.toLowerCase() || ''
  const normalizedAddress = targetAddress.toLowerCase()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const ACTIVITY_LIMIT = 7
  const ASSETS_LIMIT = 7

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
  })

  const handleCopyAddress = async () => {
    if (!normalizedAddress) return
    try {
      await navigator.clipboard.writeText(normalizedAddress)
      toast.success('Adres kopyalandı')
    } catch {
      toast.error('Kopyalama başarısız')
    }
  }

  const handleRefreshOverview = async () => {
    try {
      const [activityResult, assetsResult] = await Promise.all([
        refetchActivity(),
        refetchAssets(),
      ])

      if (onRetry) {
        onRetry()
      }

      const hasError = Boolean(
        (activityResult as any)?.error ||
          (assetsResult as any)?.error,
      )

      if (hasError) {
        toast.error('Genel bakış yenilenemedi')
      } else {
        toast.success('Genel bakış yenilendi')
      }
    } catch (error) {
      console.error('[Overview] Failed to refresh overview', error)
      toast.error('Genel bakış yenilenemedi')
    }
  }

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      toast.success('Hash kopyalandı')
    } catch {
      toast.error('Kopyalama başarısız')
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
  const isRefreshing = isLoading || activityLoading || assetsLoading

  const getLastUpdatedText = (): string | null => {
    let lastUpdatedMs: number | null = null

    if (walletData?.lastSeen) {
      lastUpdatedMs = walletData.lastSeen * 1000
    } else if (activityData?.items && activityData.items.length > 0) {
      lastUpdatedMs = activityData.items[0].timestamp * 1000
    }

    if (!lastUpdatedMs) return null

    return `Last updated ${formatDistanceToNow(new Date(lastUpdatedMs), { addSuffix: true })}`
  }

  const lastUpdatedText = getLastUpdatedText()
  
  // Debug: Log profile claim status
  useEffect(() => {
    if (profile) {
      const isClaimed = isProfileClaimed(profile)
      console.log('[Overview Panel] Profile claim status check:', {
        hasProfile: !!profile,
        status: profile.status,
        claimedAt: profile.claimedAt,
        slug: profile.slug,
        displayName: profile.displayName,
        isClaimed
      })
    }
  }, [profile])

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

  return (
    <PageShell title="Overview" subtitle="Wallet summary and activity">
      <div className="space-y-6">
        <WalletHeader
          address={normalizedAddress}
          profile={profile}
          isLoading={isLoading}
          lastUpdatedText={lastUpdatedText}
          onCopyAddress={handleCopyAddress}
          onRefresh={handleRefreshOverview}
          isRefreshing={isRefreshing}
        />

        {/* Wallet Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-card border border-border/60 shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-7 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : walletData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border border-border/60 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">AVAX Balance</p>
                <p className="text-xl font-semibold tracking-tight">
                  {parseFloat(walletData.nativeBalance).toFixed(4)} AVAX
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border border-border/60 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Transactions</p>
                <p className="text-xl font-semibold tracking-tight">
                  {walletData.txCount.toLocaleString('en-US')}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border border-border/60 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Tokens</p>
                <p className="text-xl font-semibold tracking-tight">
                  {(walletData.tokenBalances?.length || 0).toLocaleString('en-US')}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border border-border/60 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">NFTs</p>
                <p className="text-xl font-semibold tracking-tight">
                  {(walletData.nfts?.length || 0).toLocaleString('en-US')}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div className="text-center py-4">
                <p className="text-xs font-medium mb-1">No data available</p>
                <p className="text-xs text-muted-foreground">Unable to load wallet overview</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity and Assets Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Activity Card */}
          <Card className="bg-card border border-border/60 shadow-sm relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                <CardDescription className="text-xs">Son {ACTIVITY_LIMIT} işlem</CardDescription>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => refetchActivity()}
                      disabled={activityLoading}
                      aria-label="Yenile"
                    >
                      <RefreshCw className={`h-4 w-4 ${activityLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Yenile</TooltipContent>
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
                  <p className="text-sm font-medium mb-1">Aktivite yüklenemedi</p>
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
                                  <p className="text-xs mt-1">Kopyalamak için tıkla</p>
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
                                aria-label="Explorer'da görüntüle"
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
                            <TooltipContent>Explorer'da görüntüle</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )
                  })}
                  {activityData.items.length >= ACTIVITY_LIMIT && (
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background/90 backdrop-blur-sm pointer-events-none" />
                  )}
                  <div className="pt-2 relative z-10">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/${normalizedAddress}?tab=activity`)}
                    >
                      Tümünü Gör
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-1">Henüz aktivite yok</p>
                  <p className="text-xs text-muted-foreground">
                    Bu cüzdan için henüz işlem bulunamadı.
                  </p>
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
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => refetchAssets()}
                      disabled={assetsLoading}
                      aria-label="Yenile"
                    >
                      <RefreshCw className={`h-4 w-4 ${assetsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Yenile</TooltipContent>
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
                  <p className="text-sm font-medium mb-1">Varlıklar yüklenemedi</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchAssets()}
                    className="mt-2"
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Tekrar Dene
                  </Button>
                </div>
              ) : assetsData && ((assetsData.tokens && assetsData.tokens.length > 0) || (assetsData.nfts && assetsData.nfts.length > 0)) ? (
                <div className="space-y-3 relative">
                  {assetsData.tokens?.slice(0, ASSETS_LIMIT).map((token, idx) => {
                    return (
                      <div key={token.address || idx} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {token.logoUrl ? (
                            <img src={token.logoUrl} alt={token.symbol} className="h-10 w-10 rounded-full object-cover" />
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
                      Tümünü Gör
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Coins className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-1">Varlık bulunamadı</p>
                  <p className="text-xs text-muted-foreground">
                    Bu cüzdan için token veya NFT bulunamadı.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
