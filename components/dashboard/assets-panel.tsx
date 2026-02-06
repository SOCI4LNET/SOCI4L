'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  RefreshCw,
  Search,
  Copy,
  ExternalLink,
  Eye,
  Share2,
  QrCode,
  Coins,
  Image as ImageIcon,
  ArrowUpDown,
  ChevronDown,
  Loader2,
  Layers,
} from 'lucide-react'
import { formatAddress } from '@/lib/utils'
import { toast } from 'sonner'
import { QRCodeModal } from '@/components/qr/qr-code-modal'
import { getPublicProfileHref } from '@/lib/routing'
import { AssetsHeader } from '@/components/assets/AssetsHeader'
import { AssetsHero } from '@/components/assets/AssetsHero'
import { AssetsControlsBar } from '@/components/assets/AssetsControlsBar'
import { Separator } from '@/components/ui/separator'
import { PageContent } from '@/components/app-shell/page-content'
import Link from 'next/link'
import { getCachedLogo, setCachedLogo, setCachedLogos, getCacheKey } from '@/lib/logo-cache'

interface AssetsPanelProps {
  walletData: any // Legacy prop, will be replaced with address-based fetching
  address?: string // Optional address prop from parent
}

interface TokenData {
  address: string | null // null for native token
  symbol: string
  name: string
  decimals: number
  balanceRaw: string
  balanceFormatted: string
  priceUsd?: number
  valueUsd?: number
  logoUrl?: string
  isNative?: boolean
}

interface NFTData {
  contract: string
  tokenId: string
  name?: string
  collectionName?: string
  imageUrl?: string
  floorUsd?: number
  traitsCount?: number
  chain: string
}

interface AssetsResponse {
  tokens?: TokenData[]
  native?: TokenData
  nfts?: NFTData[]
  nextCursor?: string
}

interface AssetsSummary {
  tokenCount: number
  nftCount: number
  totalValueUsd?: number
}

type SortOption = 'value-desc' | 'value-asc' | 'balance-desc' | 'balance-asc' | 'alphabetical'
type NFTSortOption = 'recent' | 'collection-az'

function getExplorerLink(type: 'token' | 'nft', address: string, tokenId?: string): string {
  if (type === 'token') {
    return `https://snowtrace.io/token/${address}`
  }
  return `https://snowtrace.io/token/${address}?a=${tokenId}`
}

function getShareUrl(address: string, slug?: string | null): string {
  if (typeof window === 'undefined') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const profilePath = getPublicProfileHref(address, slug)
    // Add source=copy parameter for attribution
    return `${appUrl}${profilePath}?source=copy`
  }
  const baseUrl = window.location.origin
  const profilePath = getPublicProfileHref(address, slug)
  // Add source=copy parameter for attribution
  return `${baseUrl}${profilePath}?source=copy`
}

export function AssetsPanel({ walletData: legacyWalletData, address: propAddress }: AssetsPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address: connectedAddress, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'tokens' | 'nfts'>('tokens')
  const [searchQuery, setSearchQuery] = useState('')
  const [tokenSort, setTokenSort] = useState<SortOption>('balance-desc')
  const [nftSort, setNftSort] = useState<NFTSortOption>('recent')
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [tokensCursor, setTokensCursor] = useState('0')
  const [nftsCursor, setNftsCursor] = useState('0')
  const [tokensLastUpdatedAt, setTokensLastUpdatedAt] = useState<number | null>(null)
  const [nftsLastUpdatedAt, setNftsLastUpdatedAt] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Get address from prop, URL params, or connected wallet
  // IMPORTANT: Always prioritize route param address for this page
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const addressMatch = pathname.match(/\/dashboard\/(0x[a-fA-F0-9]{40})/)
  const urlAddress = addressMatch ? addressMatch[1].toLowerCase() : null
  // Priority: route param > prop > connected wallet
  const targetAddress = urlAddress || propAddress?.toLowerCase() || connectedAddress?.toLowerCase() || ''

  // Debug logging
  useEffect(() => {
    if (mounted && targetAddress) {
      if (mounted && targetAddress) {
        import('@/lib/logger').then(({ Logger }) => {
          Logger.info('[Assets Panel] Address resolved:', {
            resolvedAddress: targetAddress,
            source: urlAddress ? 'route-param' : propAddress ? 'prop' : connectedAddress ? 'connected-wallet' : 'none',
            urlAddress,
            propAddress,
            connectedAddress,
            pathname,
          })
        })
      }
    }
  }, [mounted, targetAddress, urlAddress, propAddress, connectedAddress, pathname])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync tab with URL query param
  useEffect(() => {
    const assetTabParam = searchParams.get('assetTab')
    if (assetTabParam === 'tokens' || assetTabParam === 'nfts') {
      setActiveTab(assetTabParam)
    }
  }, [searchParams])

  // Fetch assets summary
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery<AssetsSummary>({
    queryKey: ['assets-summary', targetAddress],
    queryFn: async () => {
      if (!targetAddress) {
        console.error('[Assets Panel] No target address for summary fetch')
        throw new Error('No address')
      }

      // Use Logger for summary fetch
      const { Logger } = await import('@/lib/logger')

      Logger.info('[Assets Panel] Fetching summary:', {
        address: targetAddress,
        chainId: 43114,
      })

      const response = await fetch(`/api/wallet/${targetAddress}/assets/summary`)

      Logger.info('[Assets Panel] Summary API response:', {
        status: response.status,
        ok: response.ok,
        address: targetAddress,
      })

      if (!response.ok) {
        const errorText = await response.text()
        Logger.error('[Assets Panel] Summary API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(`Failed to fetch summary: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      Logger.info('[Assets Panel] Summary data received:', {
        tokenCount: data.tokenCount,
        nftCount: data.nftCount,
        totalValueUsd: data.totalValueUsd,
      })

      return data
    },
    enabled: mounted && !!targetAddress,
    // Summary can be cached for 60 seconds
    staleTime: 60 * 1000, // 60 seconds
    refetchOnWindowFocus: false,
  })

  // Fetch tokens
  const {
    data: tokensData,
    isLoading: tokensLoading,
    error: tokensError,
    refetch: refetchTokens,
    dataUpdatedAt: tokensUpdatedAt,
  } = useQuery<AssetsResponse>({
    queryKey: ['assets-tokens', targetAddress, tokensCursor],
    queryFn: async () => {
      const { Logger } = await import('@/lib/logger')
      if (!targetAddress) {
        Logger.error('[Assets Panel] No target address for tokens fetch')
        throw new Error('No address')
      }

      Logger.info('[Assets Panel] Fetching tokens:', {
        address: targetAddress,
        cursor: tokensCursor,
        chainId: 43114,
      })

      const response = await fetch(
        `/api/wallet/${targetAddress}/assets?tab=tokens&limit=20&cursor=${tokensCursor}`
      )

      Logger.info('[Assets Panel] Tokens API response:', {
        status: response.status,
        ok: response.ok,
        address: targetAddress,
      })

      if (!response.ok) {
        const errorText = await response.text()
        Logger.error('[Assets Panel] Tokens API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(`Failed to fetch tokens: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      Logger.info('[Assets Panel] Tokens data received:', {
        tokenCount: data.tokens?.length || 0,
        hasNative: !!data.native,
        nativeBalance: data.native?.balanceFormatted,
        nextCursor: data.nextCursor,
        tokens: data.tokens?.map((t: any) => ({
          symbol: t.symbol,
          balance: t.balanceFormatted,
          address: t.address,
        })) || [],
        debug: (data as any)._debug,
      })

      // Log warning if no tokens but native balance exists
      if ((!data.tokens || data.tokens.length === 0) && data.native && parseFloat(data.native.balanceFormatted) > 0) {
        Logger.warn('[Assets Panel] No tokens found but native balance exists:', data.native.balanceFormatted)
      }

      return data
    },
    enabled: mounted && !!targetAddress && activeTab === 'tokens',
    // Cache tokens for 30 seconds (balances change less frequently)
    staleTime: 30 * 1000, // 30 seconds
    // Don't refetch on window focus if data is fresh
    refetchOnWindowFocus: false,
    // Background refetch every 1 minute to keep data fresh
    refetchInterval: 60 * 1000, // 1 minute
  })

  // Fetch NFTs
  const {
    data: nftsData,
    isLoading: nftsLoading,
    error: nftsError,
    refetch: refetchNFTs,
    dataUpdatedAt: nftsUpdatedAt,
  } = useQuery<AssetsResponse>({
    queryKey: ['assets-nfts', targetAddress, nftsCursor],
    queryFn: async () => {
      const { Logger } = await import('@/lib/logger')
      if (!targetAddress) {
        Logger.error('[Assets Panel] No target address for NFTs fetch')
        throw new Error('No address')
      }

      Logger.info('[Assets Panel] Fetching NFTs:', {
        address: targetAddress,
        cursor: nftsCursor,
        chainId: 43114,
      })

      const response = await fetch(
        `/api/wallet/${targetAddress}/assets?tab=nfts&limit=20&cursor=${nftsCursor}`
      )

      Logger.info('[Assets Panel] NFTs API response:', {
        status: response.status,
        ok: response.ok,
        address: targetAddress,
      })

      if (!response.ok) {
        const errorText = await response.text()
        Logger.error('[Assets Panel] NFTs API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(`Failed to fetch NFTs: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      Logger.info('[Assets Panel] NFTs data received:', {
        nftCount: data.nfts?.length || 0,
        nextCursor: data.nextCursor,
        hasNfts: !!data.nfts,
        nftsArray: data.nfts,
        fullResponse: data,
      })

      // Log warning if API returned success but no NFTs
      if (data.nfts && Array.isArray(data.nfts) && data.nfts.length === 0) {
        Logger.warn('[Assets Panel] API returned empty NFT array. This could mean:')
        Logger.warn('  1. Wallet has no NFTs on Avalanche C-Chain')
        Logger.warn('  2. OpenSea API failed silently (check server logs)')
        Logger.warn('  3. RPC fallback returned empty (RPC does not support NFT discovery)')
      }

      return data
    },
    enabled: mounted && !!targetAddress && activeTab === 'nfts',
    // Cache NFTs for 15 seconds (for better responsiveness after purchase)
    staleTime: 15 * 1000, // 15 seconds
    // Don't refetch on window focus if data is fresh
    refetchOnWindowFocus: false,
    // Background refetch every 1 minute to keep data fresh
    refetchInterval: 60 * 1000, // 1 minute
  })

  // Fetch profile for share/QR
  const { data: profileData } = useQuery<{ slug?: string | null }>({
    queryKey: ['profile', targetAddress],
    queryFn: async () => {
      if (!targetAddress) return null
      const response = await fetch(`/api/wallet?address=${targetAddress}`)
      if (!response.ok) return null
      const data = await response.json()
      return data.profile || null
    },
    enabled: mounted && !!targetAddress,
    // Profile data changes rarely, cache for 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  // Update current time for relative time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Update lastUpdatedAt when data is successfully fetched
  useEffect(() => {
    if (tokensData && !tokensLoading && !tokensError) {
      setTokensLastUpdatedAt(Date.now())
    }
  }, [tokensData, tokensLoading, tokensError])

  // Cache logos when tokens data is loaded
  useEffect(() => {
    if (!tokensData?.tokens || !mounted) return

    // Cache all logo URLs from API response
    const logosToCache: Record<string, string | null> = {}

    for (const token of tokensData.tokens) {
      const cacheKey = getCacheKey(token.address, token.symbol)
      if (token.logoUrl) {
        logosToCache[cacheKey] = token.logoUrl
      }
    }

    // Also cache native token logo if available
    if (tokensData.native?.logoUrl) {
      const nativeCacheKey = getCacheKey(null, tokensData.native.symbol)
      logosToCache[nativeCacheKey] = tokensData.native.logoUrl
    }

    if (Object.keys(logosToCache).length > 0) {
      // Use setCachedLogos for batch update
      setCachedLogos(logosToCache)
    }
  }, [tokensData, mounted])

  useEffect(() => {
    if (nftsData && !nftsLoading && !nftsError) {
      setNftsLastUpdatedAt(Date.now())
    }
  }, [nftsData, nftsLoading, nftsError])

  const handleTabChange = (value: string) => {
    if (value === 'tokens' || value === 'nfts') {
      setActiveTab(value)
      router.push(`/dashboard/${targetAddress}?tab=assets&assetTab=${value}`, { scroll: false })
    }
  }

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      toast.success('Address copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleCopyLink = async () => {
    if (!targetAddress) return
    const url = getShareUrl(targetAddress, profileData?.slug)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleShareTwitter = () => {
    if (!targetAddress) return
    const url = getShareUrl(targetAddress, profileData?.slug)
    const text = encodeURIComponent(`Check out my Avalanche assets!`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank')
  }

  const handleRefresh = async () => {
    try {
      if (activeTab === 'tokens') {
        const result = await refetchTokens()
        if (result.data && !result.error) {
          setTokensLastUpdatedAt(Date.now())
          toast.success('Tokens refreshed')
        } else if (result.error) {
          toast.error('Failed to refresh tokens')
        }
      } else {
        const result = await refetchNFTs()
        if (result.data && !result.error) {
          setNftsLastUpdatedAt(Date.now())
          toast.success('NFTs refreshed')
        } else if (result.error) {
          toast.error('Failed to refresh NFTs')
        }
      }
    } catch (error) {
      toast.error('Failed to refresh assets')
    }
  }

  const formatTimeAgo = (timestamp: number | null): string => {
    if (!timestamp) return 'Not updated yet'
    const seconds = Math.floor((currentTime - timestamp) / 1000)
    if (seconds < 5) return 'just now'
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  // Filter and sort tokens
  const filteredAndSortedTokens = useMemo(() => {
    if (!tokensData?.tokens) return []
    let filtered = tokensData.tokens

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (token) =>
          (token.symbol && token.symbol.toLowerCase().includes(query)) ||
          (token.name && token.name.toLowerCase().includes(query)) ||
          (token.address && token.address.toLowerCase().includes(query))
      )
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (tokenSort) {
        case 'value-desc':
          return (b.valueUsd || 0) - (a.valueUsd || 0)
        case 'value-asc':
          return (a.valueUsd || 0) - (b.valueUsd || 0)
        case 'balance-desc':
          return parseFloat(b.balanceRaw) - parseFloat(a.balanceRaw)
        case 'balance-asc':
          return parseFloat(a.balanceRaw) - parseFloat(b.balanceRaw)
        case 'alphabetical':
          return a.symbol.localeCompare(b.symbol)
        default:
          return 0
      }
    })

    return sorted
  }, [tokensData?.tokens, searchQuery, tokenSort])

  // Filter and sort NFTs
  const filteredAndSortedNFTs = useMemo(() => {
    if (!nftsData?.nfts) return []
    let filtered = nftsData.nfts

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (nft) =>
          (nft.name && nft.name.toLowerCase().includes(query)) ||
          (nft.collectionName && nft.collectionName.toLowerCase().includes(query)) ||
          (nft.tokenId && nft.tokenId.toLowerCase().includes(query)) ||
          (nft.contract && nft.contract.toLowerCase().includes(query))
      )
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (nftSort) {
        case 'recent':
          // Default order (most recent first based on cursor position)
          return 0
        case 'collection-az':
          const aCollection = a.collectionName || a.name || ''
          const bCollection = b.collectionName || b.name || ''
          return aCollection.localeCompare(bCollection)
        default:
          return 0
      }
    })

    return sorted
  }, [nftsData?.nfts, searchQuery, nftSort])

  const publicProfileHref = profileData?.slug
    ? `/p/${profileData.slug}`
    : `/p/${targetAddress}`
  const explorerHref = targetAddress
    ? `https://snowtrace.io/address/${targetAddress}`
    : 'https://snowtrace.io'

  const lastUpdatedAt = activeTab === 'tokens' ? tokensLastUpdatedAt : nftsLastUpdatedAt
  const isLoading = activeTab === 'tokens' ? tokensLoading : nftsLoading
  const error = activeTab === 'tokens' ? tokensError : nftsError

  const hasApiKeyError = false

  if (!mounted || !targetAddress) {
    return (
      <PageContent mode="full-width">
        <Skeleton className="h-64 w-full" />
      </PageContent>
    )
  }

  const lastUpdatedText = lastUpdatedAt
    ? `Updated ${formatTimeAgo(lastUpdatedAt)}`
    : 'Not updated yet'

  // Full-width layout: Assets page spans available width for wide tables
  // No max-width constraint - table can use full available space next to sidebar
  return (
    <PageContent mode="full-width">
      {/* Error Alert */}
      {(error && !hasApiKeyError) && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold mb-1">Failed to Load Assets</p>
                <p className="text-sm">
                  {error instanceof Error
                    ? error.message.includes('rate limit') || error.message.includes('429')
                      ? 'API rate limit exceeded. Please try again in a few moments.'
                      : 'There was an error fetching assets. Please check the console for details.'
                    : 'An unknown error occurred.'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Header: Title + Actions */}
        <AssetsHeader
          lastUpdatedText={lastUpdatedText}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          explorerHref={explorerHref}
        />

        {/* Portfolio Hero */}
        <AssetsHero
          totalValueUsd={summary?.totalValueUsd}
          tokenCount={summary?.tokenCount}
          nftCount={summary?.nftCount}
          isLoading={summaryLoading}
        />

        {/* Controls Bar: Tabs + Search + Sort */}
        <Card>
          <CardContent className="p-5 pb-4">
            <AssetsControlsBar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              tokenSort={tokenSort}
              onTokenSortChange={setTokenSort}
              nftSort={nftSort}
              onNFTSortChange={setNftSort}
              tokenCount={summary?.tokenCount}
              nftCount={summary?.nftCount}
            />
          </CardContent>
        </Card>

        {/* Content: Tabs Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Tokens Tab */}
          <TabsContent value="tokens" className="mt-0">

            {/* Tokens Table */}
            {isLoading ? (
              <Card className="w-full">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3 flex-1">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="w-full">
                <CardContent className="p-6">
                  <Alert variant="destructive">
                    <AlertDescription className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span>Failed to load tokens. Please try again.</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetchTokens()}
                          className="ml-4"
                        >
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Retry
                        </Button>
                      </div>
                      {process.env.NODE_ENV === 'development' && error instanceof Error && (
                        <div className="text-xs font-mono bg-destructive/10 p-2 rounded">
                          {error.message}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : filteredAndSortedTokens.length > 0 ? (
              <Card className="w-full">
                <CardContent className="p-0">
                  <div className="overflow-x-auto w-full">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Token</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                          <TableHead className="hidden md:table-cell">Contract</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedTokens.map((token, index) => {
                          const isNative = token.isNative || token.address === null
                          const displayAddress = token.address || `native-${index}`

                          // Format balance with sensible precision (5-6 sig figs)
                          const formatBalance = (balance: string): string => {
                            const num = parseFloat(balance)
                            if (num === 0) return '0'
                            if (num >= 1) {
                              return num.toLocaleString('en-US', { maximumFractionDigits: 6, minimumFractionDigits: 0 })
                            }
                            // For small numbers, show up to 6 decimal places
                            return num.toLocaleString('en-US', { maximumFractionDigits: 6, minimumFractionDigits: 0 })
                          }

                          // Format USD value
                          const formatUSDValue = (value?: number): string => {
                            if (!value || value === 0) return '—'
                            return new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(value)
                          }

                          // Get logo URL with cache fallback
                          const getLogoUrl = (): string | null => {
                            // First check API response
                            if (token.logoUrl) {
                              // If it's a relative path (starts with /), use as is
                              if (token.logoUrl.startsWith('/')) {
                                return token.logoUrl
                              }
                              // If it's an external URL, use it
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
                          const firstLetter = token.symbol.charAt(0).toUpperCase()

                          return (
                            <TableRow key={displayAddress} className="hover:bg-accent/50">
                              <TableCell>
                                <div className="flex items-center gap-3">
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
                                        onError={(e) => {
                                          // Mark as "no logo found" in cache to avoid retrying
                                          const cacheKey = getCacheKey(token.address, token.symbol)
                                          setCachedLogo(cacheKey, null)

                                          // Fallback to first letter if image fails to load
                                          const target = e.target as HTMLImageElement
                                          target.style.display = 'none'
                                          const parent = target.parentElement
                                          if (parent) {
                                            parent.innerHTML = `<span class="text-sm font-semibold">${firstLetter}</span>`
                                          }
                                        }}
                                      />
                                    ) : (
                                      <span className="text-sm font-semibold text-muted-foreground">{firstLetter}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium truncate">{token.symbol}</p>
                                    <p className="text-xs text-muted-foreground truncate">{token.name}</p>
                                    {/* Mobile: Show contract address below */}
                                    {!isNative && token.address && (
                                      <p className="text-xs text-muted-foreground font-mono md:hidden mt-0.5">
                                        {formatAddress(token.address, 4)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatBalance(token.balanceFormatted)}
                              </TableCell>
                              <TableCell className="text-right">
                                {token.valueUsd !== undefined && token.valueUsd > 0 ? (
                                  <span className="font-medium">{formatUSDValue(token.valueUsd)}</span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {isNative ? (
                                  <Badge variant="secondary" className="text-xs">
                                    Native
                                  </Badge>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs">{formatAddress(token.address!, 4)}</span>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleCopyAddress(token.address!)}
                                            className="h-6 w-6"
                                            aria-label="Copy address"
                                          >
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Copy address</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                        className="h-8 w-8"
                                        aria-label="View on explorer"
                                      >
                                        <a
                                          href={isNative ? explorerHref : getExplorerLink('token', token.address!)}
                                          target="_blank"
                                          rel="noopener"
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                        </a>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View on explorer</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8">
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <Coins className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium mb-1">No tokens detected</p>
                      <p className="text-xs text-muted-foreground">
                        {searchQuery
                          ? 'No tokens match your search'
                          : tokensData?.tokens && tokensData.tokens.length === 0
                            ? 'This wallet has no tokens to display'
                            : 'Loading tokens...'}
                      </p>
                    </div>
                    {!isLoading && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetchTokens()}
                          disabled={isLoading}
                        >
                          <RefreshCw className={`mr-2 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={publicProfileHref}>View Public Profile</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Load More */}
            {tokensData?.nextCursor && filteredAndSortedTokens.length > 0 && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTokensCursor(tokensData.nextCursor || '0')}
                >
                  Load More
                </Button>
              </div>
            )}
          </TabsContent>

          {/* NFTs Tab */}
          <TabsContent value="nfts" className="mt-0">
            {/* NFTs Grid */}
            {isLoading ? (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i} className="w-full">
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-48 w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="w-full">
                <CardContent className="p-6">
                  <Alert variant="destructive">
                    <AlertDescription className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span>Failed to load NFTs. Please try again.</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetchNFTs()}
                          className="ml-4"
                        >
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Retry
                        </Button>
                      </div>
                      {process.env.NODE_ENV === 'development' && error instanceof Error && (
                        <div className="text-xs font-mono bg-destructive/10 p-2 rounded">
                          {error.message}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : filteredAndSortedNFTs.length > 0 ? (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAndSortedNFTs.map((nft) => (
                  <Card key={`${nft.contract}-${nft.tokenId}`} className="overflow-hidden">
                    <div className="aspect-square relative bg-muted">
                      {nft.imageUrl ? (
                        <img
                          src={nft.imageUrl}
                          alt={nft.name || `NFT #${nft.tokenId}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <div>
                        <p className="text-sm font-medium truncate">
                          {nft.name || `NFT #${formatAddress(nft.tokenId, 4)}`}
                        </p>
                        {nft.collectionName && (
                          <p className="text-xs text-muted-foreground truncate">
                            {nft.collectionName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          #{formatAddress(nft.tokenId, 4)}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopyAddress(nft.contract)}
                                  className="h-7 w-7"
                                  aria-label="Copy contract"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy contract</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                  className="h-7 w-7"
                                  aria-label="View on explorer"
                                >
                                  <a
                                    href={getExplorerLink('nft', nft.contract, nft.tokenId)}
                                    target="_blank"
                                    rel="noopener"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View on explorer</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                  className="h-7 w-7"
                                  aria-label="View collection"
                                >
                                  <a
                                    href={getExplorerLink('token', nft.contract)}
                                    target="_blank"
                                    rel="noopener"
                                  >
                                    <Layers className="h-3 w-3" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View collection</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="w-full">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium mb-1">
                        This wallet does not hold any NFTs yet.
                      </p>
                      {searchQuery && (
                        <p className="text-xs text-muted-foreground">
                          No NFTs match your search.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchNFTs()}
                      >
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Load More */}
            {nftsData?.nextCursor && filteredAndSortedNFTs.length > 0 && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNftsCursor(nftsData.nextCursor || '0')}
                >
                  Load More
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* QR Code Modal */}
      {targetAddress && (
        <QRCodeModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          profile={{
            address: targetAddress,
            slug: profileData?.slug || null,
            displayName: null,
          }}
        />
      )}
    </PageContent>
  )
}
