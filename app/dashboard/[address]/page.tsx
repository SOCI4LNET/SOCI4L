'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useRouter, useParams, useSearchParams, usePathname } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Wallet, Loader2 } from 'lucide-react'
import { formatAddress, isValidAddress } from '@/lib/utils'
import Link from 'next/link'
import { ClaimProfileButton } from '@/components/claim-profile-button'
import dynamic from 'next/dynamic'

// Lazy load dashboard panels to improve initial bundle size
const OverviewPanel = dynamic(() => import('@/components/dashboard/overview-panel').then(mod => mod.OverviewPanel), {
  loading: () => <div className="space-y-6"><Skeleton className="h-[200px] w-full" /><Skeleton className="h-[400px] w-full" /></div>
})
const AssetsPanel = dynamic(() => import('@/components/dashboard/assets-panel').then(mod => mod.AssetsPanel), {
  loading: () => <Skeleton className="h-[600px] w-full" />
})
const ActivityPanel = dynamic(() => import('@/components/dashboard/activity-panel').then(mod => mod.ActivityPanel), {
  loading: () => <Skeleton className="h-[600px] w-full" />
})
const SettingsPanel = dynamic(() => import('@/components/dashboard/settings-panel').then(mod => mod.SettingsPanel), {
  loading: () => <Skeleton className="h-[600px] w-full" />
})
const SocialPanel = dynamic(() => import('@/components/dashboard/social-panel').then(mod => mod.SocialPanel), {
  loading: () => <Skeleton className="h-[600px] w-full" />
})
const BuilderPanel = dynamic(() => import('@/components/dashboard/builder-panel').then(mod => mod.BuilderPanel), {
  loading: () => <Skeleton className="h-[600px] w-full" />
})
const LinksPanel = dynamic(() => import('@/components/dashboard/links-panel').then(mod => mod.LinksPanel), {
  loading: () => <Skeleton className="h-[600px] w-full" />
})
const InsightsPanel = dynamic(() => import('@/components/dashboard/insights-panel').then(mod => mod.InsightsPanel), {
  loading: () => <Skeleton className="h-[600px] w-full" />
})
const SafetyPanel = dynamic(() => import('@/components/dashboard/safety-panel').then(mod => mod.SafetyPanel), {
  loading: () => <Skeleton className="h-[600px] w-full" />
})
const BillingPanel = dynamic(() => import('@/components/dashboard/billing-panel').then(mod => mod.BillingPanel), {
  loading: () => <Skeleton className="h-[600px] w-full" />
})
import { PageShell } from '@/components/app-shell/page-shell'
import { sanitizeQueryParams } from '@/lib/query-params'
import { isProfileClaimed } from '@/lib/profile/isProfileClaimed'

interface Profile {
  id: string
  address: string
  slug: string | null
  ownerAddress: string | null
  status: string
  visibility: string
  claimedAt: string | null
  displayName?: string | null
  bio?: string | null
  socialLinks?: Array<{ type: string; url: string; label?: string }> | null
  appearance?: any
  premiumExpiresAt?: string | null
  premiumLastTxHash?: string | null
}

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

export default function DashboardAddressPage() {
  const [mounted, setMounted] = useState(false)
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { address: connectedAddress, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [views7d, setViews7d] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const targetAddress = params.address as string
  const currentTab = searchParams.get('tab') || 'overview'

  // Validate tab value
  const validTabs = ['overview', 'assets', 'activity', 'social', 'settings', 'builder', 'links', 'insights', 'safety', 'billing']
  const activeTab = validTabs.includes(currentTab) ? currentTab : 'overview'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sanitize query params when Settings tab is active
  // Remove irrelevant params (e.g., subtab=following from Social tab)
  useEffect(() => {
    if (!mounted || activeTab !== 'settings') return

    const params = new URLSearchParams(searchParams.toString())
    const sanitized = sanitizeQueryParams(params, 'settings')
    sanitized.set('tab', 'settings')

    if (params.toString() !== sanitized.toString()) {
      router.replace(`${pathname}?${sanitized.toString()}`, { scroll: false })
    }
  }, [mounted, activeTab, searchParams, pathname, router])

  // Update page title based on active tab and mental model
  useEffect(() => {
    if (!mounted) return

    const dashboardTabs = ['overview', 'assets', 'activity', 'social']
    const studioTabs = ['builder', 'links', 'insights']
    const accountTabs = ['settings', 'safety']

    let layer = 'Dashboard'
    if (studioTabs.includes(activeTab)) layer = 'Studio'
    else if (accountTabs.includes(activeTab)) layer = 'Account'

    // Capitalize tab name
    const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1)

    document.title = `${layer} · ${tabName} | SOCI4L`
  }, [mounted, activeTab])

  // Check for account switching after profile is loaded
  useEffect(() => {
    if (!mounted || !isConnected || !connectedAddress || !profile) return

    const isOwner = profile.ownerAddress?.toLowerCase() === connectedAddress.toLowerCase()
    const targetIsOwner = profile.ownerAddress?.toLowerCase() === targetAddress.toLowerCase()

    // If we were viewing an owned profile but connected address changed
    if (targetIsOwner && !isOwner) {
      toast.info('Account changed. Select the profile you want to manage.')
      router.push('/dashboard')
    }
  }, [mounted, isConnected, connectedAddress, profile?.ownerAddress, targetAddress, router])

  // Check if current user is admin
  useEffect(() => {
    if (!mounted || !isConnected || !connectedAddress) return

    async function checkAdmin() {
      try {
        const response = await fetch(`/api/profile/${connectedAddress}`)
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.profile?.role === 'ADMIN')
        }
      } catch (error) {
        console.error('[Dashboard] Failed to check admin status:', error)
      }
    }

    checkAdmin()
  }, [mounted, isConnected, connectedAddress])

  useEffect(() => {
    if (!mounted) return

    // Validate address
    if (!targetAddress || !isValidAddress(targetAddress)) {
      setLoading(false)
      return
    }

    // Load data even if not connected (to show claim button)
    loadData()
  }, [mounted, targetAddress])

  const loadData = async () => {
    if (!targetAddress || !isValidAddress(targetAddress)) {
      setLoading(false)
      setError(null)
      return
    }

    // const normalizedAddress = targetAddress.toLowerCase() // normalizedAddress declared below in fetch
    const normalizedAddress = targetAddress.toLowerCase()

    // Use Logger instead of console.log
    const { Logger } = await import('@/lib/logger')
    Logger.info('[Overview] Starting data fetch for address:', normalizedAddress)

    setLoading(true)
    setError(null)

    // Timeout safeguard: 12 seconds
    const timeoutId = setTimeout(() => {
      const timeoutError = new Error('Request timed out')
      console.error('[Overview] Request timeout after 12s:', timeoutError)
      setError(timeoutError)
      setLoading(false)
    }, 12000)

    try {
      // Load profile and wallet data (with cache bust timestamp for claim updates)
      const cacheBust = Date.now()
      const response = await fetch(`/api/wallet?address=${normalizedAddress}&_t=${cacheBust}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || 'Failed to fetch wallet data' }
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[Overview] Data fetch successful:', {
        hasProfile: !!data.profile,
        hasWalletData: !!data.walletData
      })

      // Always set profile state (null if not found)
      if (data.profile) {
        // Parse socialLinks if it's a string (from DB)
        let parsedSocialLinks = data.profile.socialLinks
        if (typeof parsedSocialLinks === 'string') {
          try {
            parsedSocialLinks = JSON.parse(parsedSocialLinks)
          } catch {
            parsedSocialLinks = null
          }
        }

        // Ensure all links have id and platform field
        const normalizedLinks = parsedSocialLinks && Array.isArray(parsedSocialLinks)
          ? parsedSocialLinks.map((link: any) => ({
            id: link.id || crypto.randomUUID(),
            platform: link.platform || link.type || 'website',
            url: link.url || '',
            label: link.label || '',
          }))
          : null

        // Check if current state is claimed - if so, preserve claim status even if API returns stale data
        setProfile((prev) => {
          const currentIsClaimed = isProfileClaimed(prev)
          const newIsClaimed = isProfileClaimed(data.profile)

          // If current state is claimed but new data says unclaimed, preserve current state
          // This prevents claim state from being lost due to cache/stale data
          if (currentIsClaimed && !newIsClaimed) {
            console.log('[Overview] Preserving claimed state - API returned stale data')
            return prev // Keep current claimed state
          }

          // Otherwise, update with new data
          return {
            ...data.profile,
            id: data.profile.id,
            address: data.profile.address,
            slug: data.profile.slug,
            ownerAddress: data.profile.ownerAddress,
            status: data.profile.status,
            visibility: data.profile.visibility,
            claimedAt: data.profile.claimedAt,
            displayName: data.profile.displayName || null,
            bio: data.profile.bio || null,
            socialLinks: normalizedLinks,
            appearance: data.appearance || null,
          }
        })
        console.log('[Overview] Profile state updated:', {
          status: data.profile.status,
          claimedAt: data.profile.claimedAt,
          displayName: data.profile.displayName,
          slug: data.profile.slug,
          isClaimed: isProfileClaimed(data.profile)
        })
      } else {
        // Only set to null if current state is not claimed
        // This prevents losing claim state if API temporarily returns null
        setProfile((prev) => {
          const currentIsClaimed = isProfileClaimed(prev)
          if (currentIsClaimed) {
            console.log('[Overview] Preserving claimed state - API returned null but state is claimed')
            return prev // Keep current claimed state
          }
          return null
        })
      }

      if (data.walletData) {
        setWalletData(data.walletData)
      } else {
        // If no walletData, set to null explicitly
        setWalletData(null)
      }

      if (typeof data.views7d === 'number') {
        setViews7d(data.views7d)
      }

      if (typeof data.views7d === 'number') {
        setViews7d(data.views7d)
      }

      console.log('[Overview] State resolved - loading: false, error: null')
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      console.error('[Overview] Error loading data:', errorObj)
      setError(errorObj)
      // Don't clear walletData/profile on error - keep previous state if available
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
      console.log('[Overview] Fetch completed - loading set to false')
    }
  }

  const handleClaimSuccess = async (claimResponseProfile?: { status: string; claimedAt: string | Date | null; slug: string | null; displayName: string | null }) => {
    // Normalize address
    const normalizedAddress = targetAddress.toLowerCase()
    console.log('[Claim Success] Updating profile state after claim...', claimResponseProfile)

    // If we have profile data from claim response, update state immediately
    // This ensures UI updates instantly without waiting for API call
    if (claimResponseProfile) {
      console.log('[Claim Success] Updating profile state from claim response')
      setProfile((prev) => {
        const updatedProfile = !prev ? {
          // If no previous profile, create new one from claim response
          id: '', // Will be set by loadData()
          address: normalizedAddress,
          slug: claimResponseProfile.slug,
          ownerAddress: normalizedAddress, // Claim response doesn't include this, but we know it's the current address
          status: claimResponseProfile.status,
          visibility: 'PUBLIC' as const, // Default for claimed profiles
          claimedAt: typeof claimResponseProfile.claimedAt === 'string'
            ? claimResponseProfile.claimedAt
            : claimResponseProfile.claimedAt?.toISOString() || new Date().toISOString(),
          displayName: claimResponseProfile.displayName,
          bio: null,
          socialLinks: null,
        } : {
          // Update existing profile with claim data
          ...prev,
          status: claimResponseProfile.status,
          claimedAt: typeof claimResponseProfile.claimedAt === 'string'
            ? claimResponseProfile.claimedAt
            : claimResponseProfile.claimedAt?.toISOString() || prev.claimedAt || new Date().toISOString(),
          slug: claimResponseProfile.slug || prev.slug,
          displayName: claimResponseProfile.displayName || prev.displayName,
        }

        console.log('[Claim Success] Profile state updated immediately:', {
          status: updatedProfile.status,
          claimedAt: updatedProfile.claimedAt,
          slug: updatedProfile.slug,
          displayName: updatedProfile.displayName,
          isClaimed: isProfileClaimed(updatedProfile)
        })

        return updatedProfile
      })
    }

    // Don't call loadData() immediately - it might fetch stale data from cache
    // Instead, rely on the state update above and let the user refresh manually if needed
    // Or call loadData() after a longer delay to ensure DB write is fully propagated

    // Refresh router cache to ensure all components see updated data
    router.refresh()

    // Optionally reload data after a delay (but preserve claimed state if already set)
    setTimeout(async () => {
      console.log('[Claim Success] Reloading profile data after delay to get complete data...')
      await loadData()
    }, 2000) // 2 second delay to ensure DB write is fully propagated

    console.log('[Claim Success] Profile state updated immediately, UI should reflect claimed status')
  }

  const handleSettingsUpdate = async () => {
    // Reload data from DB to get fresh state
    await loadData()
    // Refresh router cache to ensure all components see updated data
    router.refresh()
  }


  // Prevent hydration mismatch
  // Note: We don't show a loading state here to avoid layout shift
  // Each panel handles its own loading state with proper layout wrappers
  if (!mounted) {
    return null
  }

  // Validate address
  if (!targetAddress || !isValidAddress(targetAddress)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Invalid wallet address. Please provide a valid Ethereum address.
          </AlertDescription>
        </Alert>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  if (!isConnected) {
    const normalizedAddress = targetAddress.toLowerCase()
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {formatAddress(targetAddress)}
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Wallet Connection Required</CardTitle>
            <CardDescription>Connect your wallet to manage this profile</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {!profile || profile.status !== 'CLAIMED' ? (
              <ClaimProfileButton address={normalizedAddress} onSuccess={handleClaimSuccess} />
            ) : (
              <>
                <Alert>
                  <AlertDescription>
                    Please connect your wallet to manage this profile.
                  </AlertDescription>
                </Alert>
                {connectors.length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => connect({ connector: connectors[0] })}
                    disabled={isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Dashboard access is based on wallet connection, not on profile claim
  // If wallet is connected and address matches, show dashboard regardless of claim status
  const normalizedAddress = targetAddress.toLowerCase()
  const normalizedConnectedAddress = connectedAddress?.toLowerCase()
  const addressMatches = isConnected && normalizedConnectedAddress === normalizedAddress

  // If wallet is not connected or address doesn't match, show connection/access message
  // UNLESS user is admin (admins can view any dashboard)
  if (!isConnected || (!addressMatches && !isAdmin)) {
    if (!isConnected) {
      // Already handled above, but keep for safety
      return null
    }

    // Address mismatch - show access message (unless admin)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {formatAddress(targetAddress)}
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>Connect the matching wallet to access this dashboard</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Alert>
              <AlertDescription>
                <p className="font-semibold mb-1">Connected wallet does not match this address</p>
                <p className="text-sm">
                  To access this dashboard, switch your wallet to {formatAddress(targetAddress)}.
                </p>
              </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2">
              {normalizedConnectedAddress && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => router.push(`/dashboard/${normalizedConnectedAddress}`)}
                >
                  Go to My Dashboard
                </Button>
              )}
              <Link href={`/p/${normalizedAddress}`}>
                <Button variant="outline" size="sm">View Public Profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check ownership for claimed profiles (for settings access)
  const isOwner = profile?.ownerAddress?.toLowerCase() === normalizedConnectedAddress

  // Dashboard access is based on wallet connection, not on profile claim
  // If wallet is connected and address matches, show dashboard regardless of claim status
  // Profile claim status only affects settings access (must be owner to edit claimed profiles)

  const renderPanel = () => {
    switch (activeTab) {
      case 'overview':
        // Constrained layout: Overview page uses PageShell with constrained mode (max-width ~1200px, centered)
        return <OverviewPanel
          walletData={walletData}
          profile={profile ? {
            displayName: profile.displayName,
            bio: profile.bio,
            slug: profile.slug,
            status: profile.status,
            claimedAt: profile.claimedAt,
            socialLinks: profile.socialLinks
          } : null}
          address={normalizedAddress}
          loading={loading}
          error={error}
          onRetry={loadData}
          onClaimSuccess={handleClaimSuccess}
          initialViews7d={views7d}
        />
      case 'assets':
        // Full-width layout: Assets page spans available width for wide tables (no max-width constraint)
        return <AssetsPanel walletData={walletData} address={normalizedAddress} />
      case 'activity':
        // Full-width layout: Activity page spans available width for wide tables (no max-width constraint)
        return <ActivityPanel walletData={walletData} address={normalizedAddress} />
      case 'social':
        // Constrained layout: Social page uses PageShell with constrained mode (max-width ~1200px, centered)
        return <SocialPanel address={normalizedAddress} />
      case 'builder':
        // Constrained layout: Builder is a profile-focused experience
        return <BuilderPanel address={normalizedAddress} />
      case 'links':
        // Constrained layout: Links management is content-focused
        return <LinksPanel />
      case 'insights':
        // Constrained layout: Insights focuses on analytics
        return <InsightsPanel address={normalizedAddress} />
      case 'settings':
        // Full-width layout: Settings page spans available width (same as Assets)
        // Always use PageShell wrapper to prevent layout shift on initial load
        if (loading || !profile) {
          return (
            <PageShell title="Settings" subtitle="Profile configuration" mode="full-width">
              <Skeleton className="h-64 w-full" />
            </PageShell>
          )
        }
        return (
          <SettingsPanel profile={profile} targetAddress={targetAddress} onUpdate={handleSettingsUpdate} />
        )
      case 'safety':
        // Constrained layout: Safety settings
        return <SafetyPanel />
      case 'billing':
        // Full-width layout: Billing
        return (
          <PageShell title="Billing" subtitle="Manage your Premium subscription" mode="full-width">
            <BillingPanel profile={profile} walletData={walletData} address={normalizedAddress} />
          </PageShell>
        )
      default:
        // Constrained layout: Default to Overview with PageShell constrained mode
        return <OverviewPanel
          walletData={walletData}
          profile={profile ? {
            displayName: profile.displayName,
            bio: profile.bio,
            slug: profile.slug,
            status: profile.status,
            claimedAt: profile.claimedAt,
            socialLinks: profile.socialLinks
          } : null}
          address={normalizedAddress}
          loading={loading}
          error={error}
          onRetry={loadData}
          onClaimSuccess={handleClaimSuccess}
        />
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {renderPanel()}
    </div>
  )
}
