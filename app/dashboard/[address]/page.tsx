'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Wallet, Loader2, Copy } from 'lucide-react'
import { formatAddress, isValidAddress } from '@/lib/utils'
import Link from 'next/link'
import { ClaimProfileButton } from '@/components/claim-profile-button'
import { OverviewPanel } from '@/components/dashboard/overview-panel'
import { AssetsPanel } from '@/components/dashboard/assets-panel'
import { ActivityPanel } from '@/components/dashboard/activity-panel'
import { SettingsPanel } from '@/components/dashboard/settings-panel'
import { SocialPanel } from '@/components/dashboard/social-panel'

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
  const validTabs = ['overview', 'assets', 'activity', 'social', 'settings']
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
        
        setProfile({
          ...data.profile,
          displayName: data.profile.displayName || null,
          bio: data.profile.bio || null,
          socialLinks: normalizedLinks,
        })
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

  const handleSettingsUpdate = async () => {
    // Reload data from DB to get fresh state
    await loadData()
    // Refresh router cache to ensure all components see updated data
    router.refresh()
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

  // Check profile status - ONLY render "Profile Not Claimed" when:
  // profile is null OR profile.status === "UNCLAIMED"
  // If profile.status === "CLAIMED", render the owner dashboard instead
  if (!profile || profile.status === 'UNCLAIMED') {
    const normalizedAddress = targetAddress.toLowerCase()
    const normalizedConnectedAddress = connectedAddress?.toLowerCase()
    
    // Check for address mismatch when wallet is connected
    const hasMismatch = isConnected && normalizedConnectedAddress && normalizedConnectedAddress !== normalizedAddress

    const handleCopyProfileAddress = async () => {
      try {
        await navigator.clipboard.writeText(targetAddress)
        toast.success('Copied')
      } catch (error) {
        toast.error('Copy failed')
      }
    }

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
            {hasMismatch ? (
              <>
                <Alert variant="destructive">
                  <AlertDescription>
                    <p className="font-semibold mb-1">Connected wallet does not match this profile</p>
                    <p className="text-sm">
                      To manage or claim this profile, switch your wallet to {formatAddress(targetAddress)}.
                    </p>
                  </AlertDescription>
                </Alert>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push(`/dashboard/${normalizedConnectedAddress}`)}
                  >
                    Go to My Dashboard
                  </Button>
                  <Link href={`/p/${normalizedAddress}`}>
                    <Button variant="outline" size="sm">View Public Profile</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleCopyProfileAddress}
                    aria-label="Copy profile address"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <ClaimProfileButton address={normalizedAddress} onSuccess={handleClaimSuccess} />
                <div className="flex items-center gap-2">
                  <Link href={`/p/${normalizedAddress}`}>
                    <Button variant="outline" size="sm">View Public Profile</Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">Back to Dashboard</Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check ownership
  const isOwner = profile.ownerAddress?.toLowerCase() === connectedAddress?.toLowerCase()

  if (!isOwner) {
    const normalizedConnectedAddress = connectedAddress?.toLowerCase()
    const normalizedTargetAddress = targetAddress.toLowerCase()

    const handleCopyProfileAddress = async () => {
      try {
        await navigator.clipboard.writeText(targetAddress)
        toast.success('Copied')
      } catch (error) {
        toast.error('Copy failed')
      }
    }

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
            <CardDescription>This profile is owned by a different wallet address</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                <p className="font-semibold mb-1">Connected wallet does not match this profile</p>
                <p className="text-sm">
                  To manage this profile, switch your wallet to {formatAddress(profile.ownerAddress || targetAddress)}.
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
              <Link href={`/p/${normalizedTargetAddress}`}>
                <Button variant="outline" size="sm">View Public Profile</Button>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCopyProfileAddress}
                aria-label="Copy profile address"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }


  // Owner view - show full dashboard with sidebar
  const normalizedAddress = targetAddress.toLowerCase()

  const renderPanel = () => {
    if (loading) {
      return <Skeleton className="h-64 w-full" />
    }

    switch (activeTab) {
      case 'overview':
        return <OverviewPanel walletData={walletData} profile={profile ? { displayName: profile.displayName, bio: profile.bio, socialLinks: profile.socialLinks } : null} address={normalizedAddress} />
      case 'assets':
        return <AssetsPanel walletData={walletData} />
      case 'activity':
        return <ActivityPanel walletData={walletData} />
      case 'social':
        return <SocialPanel address={normalizedAddress} />
      case 'settings':
        return profile ? (
          <SettingsPanel profile={profile} targetAddress={targetAddress} onUpdate={handleSettingsUpdate} />
        ) : (
          <Skeleton className="h-64 w-full" />
        )
      default:
        return <OverviewPanel walletData={walletData} profile={profile ? { displayName: profile.displayName, bio: profile.bio, socialLinks: profile.socialLinks } : null} address={normalizedAddress} />
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {renderPanel()}
    </div>
  )
}
