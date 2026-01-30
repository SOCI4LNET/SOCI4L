'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { PageShell } from "@/components/app-shell/page-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle } from "lucide-react"
import { setCachedLogos, getCacheKey } from "@/lib/logo-cache"
import type { ActivityTransaction } from "@/lib/activity/fetchActivity"
import { getPublicProfileHref } from "@/lib/routing"
import { getProfileViewCount } from "@/lib/analytics"
import { isProfileClaimed } from "@/lib/profile/isProfileClaimed"
import { useAccount } from "wagmi"
import {
  OverviewPanelContent,
  WalletData,
  ProfileData,
  QuickStats
} from './overview-panel-content'

interface OverviewPanelProps {
  walletData: WalletData | null
  profile: ProfileData | null
  address: string
  loading?: boolean
  error?: Error | null
  onRetry?: () => void
  onClaimSuccess?: () => void
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
  const [isReadinessDismissed, setIsReadinessDismissed] = useState(false)

  // Get address from route param (primary) or prop (fallback)
  const addressMatch = pathname?.match(/\/dashboard\/(0x[a-fA-F0-9]{40})/)
  const urlAddress = addressMatch ? addressMatch[1].toLowerCase() : null
  const targetAddress = urlAddress || address?.toLowerCase() || ''
  const normalizedAddress = targetAddress.toLowerCase()

  // Check if the profile belongs to the connected wallet
  const isOwnProfile = !!(connectedAddress && normalizedAddress === connectedAddress.toLowerCase())

  useEffect(() => {
    setMounted(true)
    const dismissed = localStorage.getItem(`readiness_dismissed_${normalizedAddress}`)
    if (dismissed === 'true') {
      setIsReadinessDismissed(true)
    }
  }, [normalizedAddress])

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
            setQuickStats((prev) => ({
              ...prev,
              totalLinks: 0,
            }))
          }
        } catch (linksError) {
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
      if (!targetAddress) throw new Error('No address')
      const normalizedAddress = targetAddress.toLowerCase()
      const response = await fetch(`/api/wallet/${normalizedAddress}/activity?limit=${ACTIVITY_LIMIT}`)
      if (!response.ok) throw new Error(`test`)
      return response.json()
    },
    enabled: mounted && !!targetAddress,
    retry: 1,
  })

  // Fetch assets data
  const {
    data: assetsData,
    isLoading: assetsLoading,
    error: assetsError,
    refetch: refetchAssets
  } = useQuery<any>({
    queryKey: ['wallet-assets-preview', targetAddress],
    queryFn: async () => {
      if (!targetAddress) throw new Error('No address')
      const normalizedAddress = targetAddress.toLowerCase()
      const response = await fetch(`/api/wallet/${normalizedAddress}/assets?tab=all&limit=${ASSETS_LIMIT}`)
      if (!response.ok) throw new Error(`test`)
      return response.json()
    },
    enabled: mounted && !!targetAddress,
    staleTime: 60000,
  })

  // Cache logos when assets data is loaded
  useEffect(() => {
    if (!assetsData?.tokens || !mounted) return

    const logosToCache: Record<string, string | null> = {}
    for (const token of assetsData.tokens) {
      if (token.logoUrl) {
        logosToCache[getCacheKey(token.address, token.symbol)] = token.logoUrl
      }
    }

    if (Object.keys(logosToCache).length > 0) {
      setCachedLogos(logosToCache)
    }
  }, [assetsData, mounted])

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
                <Button variant="default" size="sm" onClick={onRetry}>
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
  const publicProfileHref = normalizedAddress ? getPublicProfileHref(normalizedAddress, profile?.slug) : null

  return (
    <OverviewPanelContent
      walletData={walletData}
      profile={profile}
      address={normalizedAddress}
      isOwnProfile={isOwnProfile}
      stats={quickStats}
      activity={{
        items: activityData?.items || [],
        isLoading: activityLoading,
        error: activityError as Error | null,
        refetch: refetchActivity
      }}
      assets={{
        tokens: assetsData?.tokens || [],
        nfts: assetsData?.nfts || [],
        isLoading: assetsLoading
      }}
      isClaimed={isClaimed}
      publicProfileHref={publicProfileHref}
      onClaimSuccess={onClaimSuccess}
      isLoading={isLoading}
      showReadiness={mounted && !isReadinessDismissed && isOwnProfile}
      onDismissReadiness={() => {
        setIsReadinessDismissed(true)
        localStorage.setItem(`readiness_dismissed_${normalizedAddress}`, 'true')
      }}
    />
  )
}
