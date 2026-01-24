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
} from 'lucide-react'
import { formatAddress, isValidAddress } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { PageShell } from '@/components/app-shell/page-shell'
import { ClaimProfileButton } from '@/components/claim-profile-button'
import { QRCodeModal } from '@/components/qr/qr-code-modal'
import { getPublicProfileHref } from '@/lib/routing'
import { isProfileClaimed } from '@/lib/profile/isProfileClaimed'

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
  const { address: connectedAddress, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

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

  // Fetch activity data
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
      const response = await fetch(`/api/wallet/${normalizedAddress}/activity?limit=5`)
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
      toast.success('Link copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  const handleShareTwitter = () => {
    if (!connectedAddress) return
    const url = getShareUrl(connectedAddress, summaryData?.profile?.slug)
    const text = encodeURIComponent(`Check out my Avalanche profile!`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank')
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

  const getPrimaryCTA = () => {
    // Guard: if address is missing, show connect wallet
    if (!isConnected || !connectedAddress) {
      return (
        <Button
          onClick={() => connect({ connector: connectors[0] })}
          variant="default"
          size="sm"
          disabled={isConnecting}
          className="bg-accent-primary text-black hover:bg-accent-primary/90"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Wallet to Claim'
          )}
        </Button>
      )
    }

    // While loading, do not show the Claim button
    if (summaryLoading) {
      return null
    }

    const normalizedConnected = connectedAddress.toLowerCase()
    // Claim status must come from profile record only - using single source of truth
    const profile = summaryData?.profile
    const isClaimed = isProfileClaimed(profile)

    // If profile is claimed, show "View Public Profile" button
    if (isClaimed) {
      const publicProfileHref = summaryData?.profile?.slug 
        ? `/p/${summaryData.profile.slug}` 
        : `/p/${normalizedConnected}`
      
      return (
        <Button
          onClick={() => router.push(publicProfileHref)}
          variant="default"
          size="sm"
          asChild
          className="bg-accent-primary text-black hover:bg-accent-primary/90"
        >
          <Link href={publicProfileHref}>
            View Public Profile
          </Link>
        </Button>
      )
    }

    // If not claimed, show single "Claim Profile" CTA
    return <ClaimProfileButton address={normalizedConnected} />
  }

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

  const normalizedAddress = connectedAddress?.toLowerCase() || ''
  const publicProfileHref = summaryData?.profile?.slug 
    ? `/p/${summaryData.profile.slug}` 
    : `/p/${normalizedAddress}`

  return (
    <PageShell title="Dashboard" subtitle="Overview">
      {/* Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">Avalanche C-Chain</Badge>
              {summaryLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <>
                  {(() => {
                    const profile = summaryData?.profile
                    const isClaimed = isProfileClaimed(profile)
                    return (
                      <Badge 
                        variant={isClaimed ? 'default' : 'outline'}
                        className={isClaimed ? 'bg-accent-primary-muted text-accent-primary border-accent-primary/30' : ''}
                      >
                        Profile Status: {isClaimed ? 'Claimed' : 'Unclaimed'}
                      </Badge>
                    )
                  })()}
                </>
              )}
              {summaryLoading ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <Badge 
                  variant={summaryData?.visibility === 'PUBLIC' ? 'default' : 'secondary'}
                  className={summaryData?.visibility === 'PUBLIC' ? 'bg-accent-primary-muted text-accent-primary border-accent-primary/30' : ''}
                >
                  {summaryData?.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getPrimaryCTA()}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                      aria-label="View public profile"
                    >
                      <Link href={publicProfileHref}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View public profile</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
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
                  <DropdownMenuItem onClick={handleShareTwitter}>
                    <Twitter className="mr-2 h-4 w-4" />
                    Share on X
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQrModalOpen(true)}
                      aria-label="Show QR code"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Show QR code</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* AVAX Balance */}
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors hover:border-accent-primary/30 hover:ring-1 hover:ring-accent-primary-muted"
          onClick={() => router.push(`/dashboard/${normalizedAddress}?tab=assets`)}
        >
          <CardContent className="p-4">
            {summaryLoading ? (
              <>
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-6 w-24" />
              </>
            ) : summaryError ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">AVAX Balance</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-destructive">Error</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      refetchSummary()
                    }}
                    aria-label="Retry"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-1">AVAX Balance</p>
                <p className="text-lg font-semibold">
                  {parseFloat(summaryData?.avaxBalance || '0').toFixed(4)} AVAX
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors hover:border-accent-primary/30 hover:ring-1 hover:ring-accent-primary-muted"
          onClick={() => router.push(`/dashboard/${normalizedAddress}?tab=activity`)}
        >
          <CardContent className="p-4">
            {summaryLoading ? (
              <>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-6 w-16" />
              </>
            ) : summaryError ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Transactions</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-destructive">Error</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      refetchSummary()
                    }}
                    aria-label="Retry"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-1">Transactions</p>
                <p className="text-lg font-semibold">{summaryData?.txCount || 0}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tokens */}
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors hover:border-accent-primary/30 hover:ring-1 hover:ring-accent-primary-muted"
          onClick={() => router.push(`/dashboard/${normalizedAddress}?tab=assets&assetTab=tokens`)}
        >
          <CardContent className="p-4">
            {summaryLoading ? (
              <>
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-6 w-16" />
              </>
            ) : summaryError ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Tokens</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-destructive">Error</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      refetchSummary()
                    }}
                    aria-label="Retry"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-1">Tokens</p>
                <p className="text-lg font-semibold">{summaryData?.tokenCount || 0}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* NFTs */}
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors hover:border-accent-primary/30 hover:ring-1 hover:ring-accent-primary-muted"
          onClick={() => router.push(`/dashboard/${normalizedAddress}?tab=assets&assetTab=nfts`)}
        >
          <CardContent className="p-4">
            {summaryLoading ? (
              <>
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-6 w-16" />
              </>
            ) : summaryError ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">NFTs</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-destructive">Error</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      refetchSummary()
                    }}
                    aria-label="Retry"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-1">NFTs</p>
                <p className="text-lg font-semibold">{summaryData?.nftCount || 0}</p>
              </>
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
              <CardDescription className="text-xs">Last 5 transactions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => refetchActivity()}
                      disabled={activityLoading}
                      aria-label="Refresh"
                    >
                      <RefreshCw className={`h-4 w-4 ${activityLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
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
              <div className="space-y-3">
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
                <div className="pt-2">
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
                <p className="text-sm font-medium mb-1">No recent activity found</p>
                <p className="text-xs text-muted-foreground mb-4">
                  {isConnected ? 'No transactions detected yet' : 'Connect a wallet to see activity'}
                </p>
                {isConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchActivity()}
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Refresh
                  </Button>
                )}
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
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => refetchAssets()}
                      disabled={assetsLoading}
                      aria-label="Refresh"
                    >
                      <RefreshCw className={`h-4 w-4 ${assetsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
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
              <div className="space-y-3">
                {(assetsData.topTokens || []).map((token, idx) => (
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
                <div className="pt-2">
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
                <p className="text-sm font-medium mb-1">No tokens or NFTs detected</p>
                <p className="text-xs text-muted-foreground mb-4">
                  This wallet has no tokens or NFTs to display
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
