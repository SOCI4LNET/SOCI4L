'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'
import { getCachedLogo, setCachedLogo, setCachedLogos, getCacheKey } from '@/lib/logo-cache'

import { RefreshCw, Coins, Search } from 'lucide-react'
import Image from 'next/image'

import { AssetsHeader } from '@/components/assets/AssetsHeader'
import { PageContent } from '@/components/app-shell/page-content'
import dynamic from 'next/dynamic'

const AssetsHero = dynamic(
  () => import('@/components/assets/AssetsHero').then((mod) => mod.AssetsHero),
  {
    loading: () => <div className="h-64 w-full animate-pulse bg-muted/20 rounded-xl mb-6" />,
    ssr: false,
  }
)

const TokenSidebar = dynamic(
  () => import('@/components/assets/TokenSidebar').then((mod) => mod.TokenSidebar),
  {
    loading: () => (
      <div className="h-[200px] border border-border/50 rounded-xl flex animate-pulse bg-card/10" />
    ),
    ssr: false,
  }
)
import { Input } from '@/components/ui/input'
import { QRCodeModal } from '@/components/qr/qr-code-modal'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AssetsPanelProps {
  walletData: any
  address?: string
}

interface TokenData {
  address: string | null
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

interface AssetsResponse {
  tokens?: TokenData[]
  native?: TokenData
  nextCursor?: string
}

interface AssetsSummary {
  tokenCount: number
  nftCount: number
  totalValueUsd?: number
}

function getExplorerLink(type: 'token' | 'nft', address: string, tokenId?: string): string {
  if (type === 'token') {
    return `https://snowtrace.io/token/${address}`
  }
  return `https://snowtrace.io/token/${address}?a=${tokenId}`
}

export function AssetsPanel({ walletData: legacyWalletData, address: propAddress }: AssetsPanelProps) {
  const { address: connectedAddress } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [tokensCursor, setTokensCursor] = useState('0')
  const [tokensLastUpdatedAt, setTokensLastUpdatedAt] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [qrModalOpen, setQrModalOpen] = useState(false)

  // Sidebar State
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null)

  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const addressMatch = pathname.match(/\/dashboard\/(0x[a-fA-F0-9]{40})/)
  const urlAddress = addressMatch ? addressMatch[1].toLowerCase() : null
  const targetAddress = urlAddress || propAddress?.toLowerCase() || connectedAddress?.toLowerCase() || ''

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: summary, isLoading: summaryLoading } = useQuery<AssetsSummary>({
    queryKey: ['assets-summary', targetAddress],
    queryFn: async () => {
      if (!targetAddress) throw new Error('No address')
      const response = await fetch(`/api/wallet/${targetAddress}/assets/summary`)
      if (!response.ok) throw new Error(`Failed to fetch summary: ${response.statusText}`)
      return await response.json()
    },
    enabled: mounted && !!targetAddress,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const {
    data: tokensData,
    isLoading: tokensLoading,
    error: tokensError,
    refetch: refetchTokens,
  } = useQuery<AssetsResponse>({
    queryKey: ['assets-tokens', targetAddress, tokensCursor],
    queryFn: async () => {
      if (!targetAddress) throw new Error('No address')
      const response = await fetch(`/api/wallet/${targetAddress}/assets?tab=tokens&limit=20&cursor=${tokensCursor}`)
      if (!response.ok) throw new Error(`Failed to fetch tokens`)
      return await response.json()
    },
    enabled: mounted && !!targetAddress,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 60 * 1000,
  })

  // Profile data for public link
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
  })

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (tokensData && !tokensLoading && !tokensError) {
      setTokensLastUpdatedAt(Date.now())
    }
  }, [tokensData, tokensLoading, tokensError])

  useEffect(() => {
    if (!tokensData?.tokens || !mounted) return
    const logosToCache: Record<string, string | null> = {}
    for (const token of tokensData.tokens) {
      if (token.logoUrl) logosToCache[getCacheKey(token.address, token.symbol)] = token.logoUrl
    }
    if (tokensData.native?.logoUrl) {
      logosToCache[getCacheKey(null, tokensData.native.symbol)] = tokensData.native.logoUrl
    }
    if (Object.keys(logosToCache).length > 0) setCachedLogos(logosToCache)
  }, [tokensData, mounted])

  const handleRefresh = async () => {
    try {
      const result = await refetchTokens()
      if (result.data && !result.error) {
        setTokensLastUpdatedAt(Date.now())
        toast.success('Tokens refreshed')
      } else if (result.error) {
        toast.error('Failed to refresh tokens')
      }
    } catch {
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

  const filteredAndSortedTokens = useMemo(() => {
    if (!tokensData?.tokens) return []
    let filtered = tokensData.tokens

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (token) =>
          (token.symbol && token.symbol.toLowerCase().includes(query)) ||
          (token.name && token.name.toLowerCase().includes(query)) ||
          (token.address && token.address.toLowerCase().includes(query))
      )
    }

    // Default Sort by Value
    return [...filtered].sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0))
  }, [tokensData?.tokens, searchQuery])

  const explorerHref = targetAddress
    ? `https://snowtrace.io/address/${targetAddress}`
    : 'https://snowtrace.io'

  if (!mounted || !targetAddress) {
    return (
      <PageContent mode="full-width">
        <Skeleton className="h-64 w-full" />
      </PageContent>
    )
  }

  const lastUpdatedText = tokensLastUpdatedAt
    ? `Updated ${formatTimeAgo(tokensLastUpdatedAt)}`
    : 'Not updated yet'

  return (
    <PageContent mode="full-width">
      {tokensError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold mb-1">Failed to Load Assets</p>
                <p className="text-sm">There was an error fetching assets.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={tokensLoading}>
                <RefreshCw className={`mr-2 h-3 w-3 ${tokensLoading ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col lg:flex-row items-start relative pb-20 justify-between">

        {/* Main Content Area */}
        <div className="flex-1 w-full min-w-0 space-y-4 lg:pr-6">
          <AssetsHeader
            lastUpdatedText={lastUpdatedText}
            isLoading={tokensLoading}
            onRefresh={handleRefresh}
            explorerHref={explorerHref}
          />

          <AssetsHero
            totalValueUsd={summary?.totalValueUsd}
            isLoading={summaryLoading}
            tokens={tokensData?.tokens}
          />

          {/* List Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <h3 className="text-xl font-bold">Tokens</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 h-9"
              />
            </div>
          </div>

          {/* Token List */}
          {tokensLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : filteredAndSortedTokens.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filteredAndSortedTokens.map((token, index) => {
                const isSelected = selectedToken?.address === token.address && selectedToken?.symbol === token.symbol

                const formatBalance = (balance: string) => {
                  const num = parseFloat(balance)
                  if (num === 0) return '0'
                  return num.toLocaleString('en-US', { maximumFractionDigits: 6, minimumFractionDigits: 0 })
                }

                const formatUSDValue = (value?: number) => {
                  if (!value || value === 0) return '—'
                  return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(value)
                }

                const logoUrl = token.logoUrl || getCachedLogo(getCacheKey(token.address, token.symbol))
                const firstLetter = token.symbol.charAt(0).toUpperCase()

                return (
                  <button
                    key={`${token.address || 'native'}-${index}`}
                    onClick={() => setSelectedToken(token)}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 text-left border ${isSelected
                      ? 'bg-accent/10 border-accent-foreground/20 ring-1 ring-accent-foreground/10 shadow-sm scale-[1.01]'
                      : 'bg-transparent border-border/10 hover:bg-accent/5 hover:border-border/30'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/50 relative">
                        {logoUrl ? (
                          <Image
                            src={logoUrl}
                            alt={token.symbol}
                            fill
                            sizes="40px"
                            className="object-cover"
                            onLoad={() => setCachedLogo(getCacheKey(token.address, token.symbol), logoUrl)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <span className="text-sm font-semibold">{firstLetter}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[15px]">{token.symbol}</p>
                        <p className="text-xs text-muted-foreground">{token.name}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-[15px]">{formatUSDValue(token.valueUsd)}</p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {formatBalance(token.balanceFormatted)} {token.symbol}
                      </p>
                    </div>
                  </button>
                )
              })}

              {tokensData?.nextCursor && (
                <Button variant="outline" className="mt-4 w-full" onClick={() => setTokensCursor(tokensData.nextCursor || '0')}>
                  Load More
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-3">
                <Coins className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">No tokens found.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar Placeholder (Always renders boundary on desktop, empty or full) */}
        <div className="w-full lg:w-[350px] shrink-0 sticky top-20">
          {selectedToken ? (
            <TokenSidebar
              token={selectedToken}
              totalValueUsd={summary?.totalValueUsd}
              onClose={() => setSelectedToken(null)}
              explorerLink={selectedToken.isNative ? explorerHref : getExplorerLink('token', selectedToken.address!)}
            />
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center h-[200px] border border-dashed border-border/50 rounded-xl text-muted-foreground bg-card/10 p-6 text-center">
              <p className="text-sm">Select a token to view detailed information</p>
            </div>
          )}
        </div>

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
