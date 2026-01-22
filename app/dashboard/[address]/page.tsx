'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Share2, Wallet, Loader2 } from 'lucide-react'
import { formatAddress, isValidAddress } from '@/lib/utils'
import Link from 'next/link'
import { ClaimProfileButton } from '@/components/claim-profile-button'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { OverviewPanel } from '@/components/dashboard/overview-panel'
import { AssetsPanel } from '@/components/dashboard/assets-panel'
import { ActivityPanel } from '@/components/dashboard/activity-panel'
import { SettingsPanel } from '@/components/dashboard/settings-panel'

interface Profile {
  id: string
  address: string
  slug: string | null
  ownerAddress: string | null
  status: string
  visibility: string
  claimedAt: string | null
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
  const searchParams = useSearchParams()
  const { address: connectedAddress, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  
  const targetAddress = params.address as string
  const currentTab = searchParams.get('tab') || 'overview'
  
  // Validate tab value
  const validTabs = ['overview', 'assets', 'activity', 'settings']
  const activeTab = validTabs.includes(currentTab) ? currentTab : 'overview'

  useEffect(() => {
    setMounted(true)
  }, [])

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
    if (!targetAddress || !isValidAddress(targetAddress)) return

    setLoading(true)
    try {
      // Normalize address to lowercase for consistent API calls
      const normalizedAddress = targetAddress.toLowerCase()
      // Load profile and wallet data
      const response = await fetch(`/api/wallet?address=${normalizedAddress}`, {
        cache: 'no-store',
      })
      const data = await response.json()

      // Always set profile state (null if not found)
      if (data.profile) {
        setProfile(data.profile)
      } else {
        // Explicitly set to null if no profile exists
        setProfile(null)
      }

      if (data.walletData) {
        setWalletData(data.walletData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimSuccess = async () => {
    // Normalize address
    const normalizedAddress = targetAddress.toLowerCase()
    // Reload data from DB to get fresh state
    await loadData()
    // Refresh router cache
    router.refresh()
    // Navigate to dashboard with normalized address
    router.replace(`/dashboard/${normalizedAddress}`)
  }


  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
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
            <div className="flex gap-2">
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">Back to Dashboard</Button>
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

  // Check profile status - ONLY render "Profile Not Claimed" when:
  // profile is null OR profile.status === "UNCLAIMED"
  // If profile.status === "CLAIMED", render the owner dashboard instead
  if (!profile || profile.status === 'UNCLAIMED') {
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
            <CardTitle>Profile Not Claimed</CardTitle>
            <CardDescription>This profile is not claimed yet. Please claim it first to manage it.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <ClaimProfileButton address={normalizedAddress} onSuccess={handleClaimSuccess} />
            <div className="flex gap-2">
              <Link href={`/p/${normalizedAddress}`}>
                <Button variant="outline" size="sm">View Public Profile</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check ownership
  const isOwner = profile.ownerAddress?.toLowerCase() === connectedAddress?.toLowerCase()

  if (!isOwner) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {formatAddress(targetAddress)}
          </p>
        </div>
        <Alert variant="destructive">
          <AlertDescription className="space-y-2">
            <p>
              You are connected as <span className="font-mono">{formatAddress(connectedAddress || '')}</span>.
            </p>
            <p>
              This profile is owned by <span className="font-mono">{formatAddress(profile.ownerAddress || '')}</span>.
            </p>
            <p className="mt-2">
              Please switch to the correct account in your wallet or select a different profile to manage.
            </p>
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              toast.info('Please switch accounts in your wallet extension')
            }}
          >
            Switch Account in Wallet
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleCopyProfileLink = async () => {
    if (!profile) return

    const profileUrl = profile.slug 
      ? `${window.location.origin}/p/${profile.slug}`
      : `${window.location.origin}/p/${targetAddress}`

    try {
      await navigator.clipboard.writeText(profileUrl)
      toast.success('Link copied')
    } catch (error) {
      toast.error('Copy failed')
    }
  }

  // Owner view - show full dashboard with sidebar
  const normalizedAddress = targetAddress.toLowerCase()

  const renderPanel = () => {
    if (loading) {
      return <Skeleton className="h-64 w-full" />
    }

    switch (activeTab) {
      case 'overview':
        return <OverviewPanel walletData={walletData} />
      case 'assets':
        return <AssetsPanel walletData={walletData} />
      case 'activity':
        return <ActivityPanel walletData={walletData} />
      case 'settings':
        return profile ? (
          <SettingsPanel profile={profile} targetAddress={targetAddress} onUpdate={loadData} />
        ) : (
          <Skeleton className="h-64 w-full" />
        )
      default:
        return <OverviewPanel walletData={walletData} />
    }
  }

  return (
    <SidebarProvider>
      <DashboardSidebar address={normalizedAddress} />
      <SidebarInset>
        <div className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <div className="flex items-center justify-between flex-1">
            <div>
              <h1 className="text-xl font-semibold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {formatAddress(targetAddress)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopyProfileLink}
              aria-label="Copy profile link"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {renderPanel()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
