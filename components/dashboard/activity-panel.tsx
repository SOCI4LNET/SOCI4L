"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAccount } from "wagmi"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ActivityTable } from "@/components/activity/ActivityTable"
import { ActivityFiltersBar } from "@/components/activity/ActivityFiltersBar"
import { PageContent } from "@/components/app-shell/page-content"
import { toast } from "sonner"
import { RefreshCw, Activity, ExternalLink } from "lucide-react"
import type { ActivityTransaction } from "@/lib/activity/fetchActivity"

interface ActivityPanelProps {
  walletData?: any // Legacy prop, kept for compatibility
  address?: string // Address to show activity for (from route param or parent)
}

interface ActivityResponse {
  items: ActivityTransaction[]
  total: number
  hasMore: boolean
}

function formatLastUpdated(secondsAgo: number): string {
  if (secondsAgo < 10) return 'Just updated'
  if (secondsAgo < 60) return `Updated ${Math.floor(secondsAgo)}s ago`
  const minutes = Math.floor(secondsAgo / 60)
  if (minutes < 60) return `Updated ${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Updated ${hours}h ago`
  const days = Math.floor(hours / 24)
  return `Updated ${days}d ago`
}

export function ActivityPanel({ walletData: legacyWalletData, address: propAddress }: ActivityPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address: connectedAddress, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  
  // Get address: prop > route param > connected wallet
  // IMPORTANT: Activity page should show transactions for the specific address (route param or prop)
  // This ensures we show the correct wallet's transactions, not a mix
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const addressMatch = pathname.match(/\/dashboard\/(0x[a-fA-F0-9]{40})/)
  const urlAddress = addressMatch ? addressMatch[1].toLowerCase() : null
  // Priority: prop > route param > connected wallet
  const targetAddress = propAddress?.toLowerCase() || urlAddress || connectedAddress?.toLowerCase() || ''

  // Debug: Log which address is being used
  useEffect(() => {
    if (mounted && targetAddress) {
      console.log('[Activity Panel] Address resolved:', {
        resolvedAddress: targetAddress,
        source: propAddress ? 'prop' : urlAddress ? 'route-param' : connectedAddress ? 'connected-wallet' : 'none',
        propAddress,
        urlAddress,
        connectedAddress,
        pathname,
      })
    }
  }, [mounted, targetAddress, propAddress, urlAddress, connectedAddress, pathname])

  // Filter states
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'all'>('all')
  const [type, setType] = useState<'all' | 'transfer' | 'contract' | 'swap'>('all')
  const [direction, setDirection] = useState<'all' | 'incoming' | 'outgoing'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(Date.now())

  const limit = 20

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update current time every 10 seconds for "last updated" display
  useEffect(() => {
    if (!mounted) return
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 10000) // Every 10 seconds
    return () => clearInterval(interval)
  }, [mounted])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [dateRange, type, direction, searchQuery])

  // Fetch activity data
  const { 
    data: activityData, 
    isLoading, 
    error,
    refetch,
  } = useQuery<ActivityResponse>({
    queryKey: ['wallet-activity', targetAddress, dateRange, type, direction, searchQuery, page],
    queryFn: async () => {
      if (!targetAddress) throw new Error('No address')
      
      // Log the address being used for debugging
      console.log('[Activity Panel] Fetching transactions for address:', targetAddress)
      
      const params = new URLSearchParams({
        dateRange,
        type,
        direction,
        limit: limit.toString(),
        offset: (page * limit).toString(),
      })
      
      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const apiUrl = `/api/wallet/${targetAddress}/activity?${params.toString()}`
      console.log('[Activity Panel] API URL:', apiUrl)
      
      const response = await fetch(apiUrl)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Activity Panel] API Error:', errorText)
        throw new Error(`Failed to fetch activity: ${response.status}`)
      }
      const data = await response.json()
      
      // Log the received data for debugging
      console.log('[Activity Panel] Received transactions:', {
        count: data.items?.length || 0,
        address: targetAddress,
        sampleTx: data.items?.[0] ? {
          hash: data.items[0].hash,
          from: data.items[0].from,
          to: data.items[0].to,
          direction: data.items[0].direction,
        } : null,
      })
      
      setLastUpdatedAt(Date.now())
      return data
    },
    enabled: mounted && !!targetAddress,
    staleTime: 30000, // 30 seconds
  })

  const handleRefresh = () => {
    const params = new URLSearchParams({
      dateRange,
      type,
      direction,
      limit: limit.toString(),
      offset: (page * limit).toString(),
      t: Date.now().toString(), // Cache bust
    })
    
    if (searchQuery) {
      params.set('search', searchQuery)
    }

    refetch()
  }

  const lastUpdatedText = lastUpdatedAt 
    ? formatLastUpdated(Math.floor((currentTime - lastUpdatedAt) / 1000))
    : 'Not updated yet'

  if (!mounted) {
    return (
      <PageContent mode="full-width">
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageContent>
    )
  }

  if (!targetAddress) {
    return (
      <PageContent mode="full-width">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <Alert>
                <AlertDescription>
                  Wallet address not found. Please connect a wallet or enter an address.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    )
  }

  // Full-width layout: Activity page spans available width for wide tables
  // No max-width constraint - table can use full available space next to sidebar
  return (
    <PageContent mode="full-width">
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Recent on-chain transactions for this wallet
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {lastUpdatedText}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    aria-label="Refresh activity"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh activity</TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
                      href={targetAddress ? `https://snowtrace.io/address/${targetAddress}` : 'https://snowtrace.io'}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View wallet on Snowtrace</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Filters Bar */}
        <ActivityFiltersBar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          type={type}
          onTypeChange={setType}
          direction={direction}
          onDirectionChange={setDirection}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Transactions List */}
        {isLoading ? (
          <div className="border rounded-lg bg-card p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="border rounded-lg bg-card p-6">
            <Alert variant="destructive">
              <AlertDescription>
                <p className="font-semibold mb-1">Error occurred while loading transactions</p>
                <p className="text-sm mb-3">
                  {error instanceof Error ? error.message : 'An unknown error occurred'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRefresh()}
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : activityData?.items && activityData.items.length > 0 ? (
          <>
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <ActivityTable 
                  transactions={activityData.items} 
                  address={targetAddress}
                  isLoading={isLoading}
                />
              </div>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-end pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || isLoading}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {page + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!activityData.hasMore || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="border rounded-lg bg-card p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <Activity className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium mb-1">No recent transactions detected</p>
                <p className="text-xs text-muted-foreground">
                  This wallet hasn’t interacted with the Avalanche network recently.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                {(searchQuery || dateRange !== 'all' || type !== 'all' || direction !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange('all')
                      setType('all')
                      setDirection('all')
                      setSearchQuery('')
                    }}
                  >
                    Clear filters
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContent>
  )
}
