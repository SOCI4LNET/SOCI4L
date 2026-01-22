'use client'

import { useEffect, useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useRouter, useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Loader2, Share2 } from 'lucide-react'
import { formatAddress, isValidAddress } from '@/lib/utils'
import Link from 'next/link'

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
  const { address: connectedAddress, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingSlug, setSavingSlug] = useState(false)
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
  const [slug, setSlug] = useState<string>('')
  
  const targetAddress = params.address as string

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

    if (!isConnected || !connectedAddress) {
      setLoading(false)
      return
    }

    loadData()
  }, [mounted, isConnected, connectedAddress, targetAddress])

  const loadData = async () => {
    if (!targetAddress || !isValidAddress(targetAddress) || !connectedAddress) return

    setLoading(true)
    try {
      // Load profile and wallet data
      const response = await fetch(`/api/wallet?address=${targetAddress}`)
      const data = await response.json()

      if (data.profile) {
        setProfile(data.profile)
        setVisibility(data.profile.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC')
        setSlug(data.profile.slug || '')
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

  const handleSaveVisibility = async () => {
    if (!connectedAddress || !profile) return

    setSaving(true)
    try {
      // Step 1: Get nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) {
        throw new Error('Nonce alınamadı')
      }
      const { nonce } = await nonceResponse.json()

      // Step 2: Sign message
      const message = `Update visibility for ${targetAddress} to ${visibility}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      // Step 3: Update visibility
      const updateResponse = await fetch('/api/profile/visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: targetAddress,
          visibility,
          signature,
        }),
      })

      const result = await updateResponse.json()

      if (!updateResponse.ok) {
        throw new Error(result.error || 'Visibility güncellenemedi')
      }

      // Success - reload data
      await loadData()
      toast.success('Visibility updated successfully')
    } catch (error: any) {
      console.error('Error updating visibility:', error)
      toast.error(error.message || 'Failed to update visibility')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSlug = async () => {
    if (!connectedAddress || !profile) return

    setSavingSlug(true)
    try {
      // Step 1: Get nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) {
        throw new Error('Nonce alınamadı')
      }
      const { nonce } = await nonceResponse.json()

      // Step 2: Sign message
      const message = `Set slug for ${targetAddress} to ${slug || '(empty)'}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      // Step 3: Update slug
      const updateResponse = await fetch('/api/profile/slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: targetAddress,
          slug: slug.trim() || null,
          signature,
        }),
      })

      const result = await updateResponse.json()

      if (!updateResponse.ok) {
        throw new Error(result.error || 'Slug güncellenemedi')
      }

      // Success - reload data
      await loadData()
      toast.success('Custom URL updated successfully')
    } catch (error: any) {
      console.error('Error updating slug:', error)
      toast.error(error.message || 'Failed to update custom URL')
    } finally {
      setSavingSlug(false)
    }
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
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {formatAddress(targetAddress)}
          </p>
        </div>
        <Alert>
          <AlertDescription>
            Please connect your wallet to manage this profile.
          </AlertDescription>
        </Alert>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
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

  // Check profile status
  if (!profile || profile.status !== 'CLAIMED') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {formatAddress(targetAddress)}
          </p>
        </div>
        <Alert>
          <AlertDescription>
            This profile is not claimed yet. Please claim it first.
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Link href={`/p/${targetAddress}`}>
            <Button variant="default">View Profile</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
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
            onClick={() => {
              toast.info('Please switch accounts in your wallet extension')
            }}
          >
            Switch Account in Wallet
          </Button>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
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

  // Owner view - show full dashboard
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {formatAddress(targetAddress)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyProfileLink}
          aria-label="Copy profile link"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Wallet summary and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {walletData ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">AVAX Balance</p>
                    <p className="text-2xl font-bold">{parseFloat(walletData.nativeBalance).toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                    <p className="text-2xl font-bold">{walletData.txCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tokens</p>
                    <p className="text-2xl font-bold">{walletData.tokenBalances?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">NFTs</p>
                    <p className="text-2xl font-bold">{walletData.nfts?.length || 0}</p>
                  </div>
                </div>
              ) : (
                <Skeleton className="h-32 w-full" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Assets</CardTitle>
              <CardDescription>Tokens and NFT holdings</CardDescription>
            </CardHeader>
            <CardContent>
              {walletData && walletData.tokenBalances ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walletData.tokenBalances.map((token, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{token.name}</TableCell>
                        <TableCell>{token.symbol}</TableCell>
                        <TableCell className="text-right font-mono">
                          {parseFloat(token.balance).toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Skeleton className="h-32 w-full" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              {walletData && walletData.transactions ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hash</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walletData.transactions.slice(0, 10).map((tx, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">
                          {formatAddress(tx.hash)}
                        </TableCell>
                        <TableCell>{parseFloat(tx.value).toFixed(4)} AVAX</TableCell>
                        <TableCell>
                          {new Date(tx.timestamp * 1000).toLocaleDateString('tr-TR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Skeleton className="h-32 w-full" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Profile configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Profile Visibility</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Current:</span>
                  <Badge variant={profile.visibility === 'PUBLIC' ? 'default' : 'secondary'}>
                    {profile.visibility}
                  </Badge>
                </div>
                <RadioGroup value={visibility} onValueChange={(value) => setVisibility(value as 'PUBLIC' | 'PRIVATE')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PUBLIC" id="public" />
                    <Label htmlFor="public" className="cursor-pointer">
                      Public - Anyone can view your profile
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PRIVATE" id="private" />
                    <Label htmlFor="private" className="cursor-pointer">
                      Private - Only you can view full details
                    </Label>
                  </div>
                </RadioGroup>
                <Button onClick={handleSaveVisibility} disabled={saving || visibility === profile.visibility}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>

              <div className="space-y-3 pt-6 border-t">
                <Label>Custom URL</Label>
                <div className="space-y-2">
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-profile"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    /p/{slug || 'your-slug'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    3-24 characters, lowercase letters, numbers, and hyphens only
                  </p>
                </div>
                <Button onClick={handleSaveSlug} disabled={savingSlug || slug === (profile.slug || '')}>
                  {savingSlug ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Custom URL'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
