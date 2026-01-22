'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { isValidAddress } from '@/lib/utils'
import { toast } from 'sonner'
import { Wallet, Coins, User, Shield } from 'lucide-react'

type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

interface WalletData {
  address: string
  nativeBalance: string
  txCount: number
}

interface ProfileData {
  status: string
  visibility?: string
}

export default function HomePage() {
  const [address, setAddress] = useState('')
  const [submittedAddress, setSubmittedAddress] = useState<string | null>(null)
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSearch = async () => {
    if (!address.trim()) return
    
    const trimmedAddress = address.trim()
    if (!isValidAddress(trimmedAddress)) {
      toast.error('Geçersiz cüzdan adresi')
      return
    }

    // Normalize address to lowercase
    const normalizedAddress = trimmedAddress.toLowerCase()
    setSubmittedAddress(normalizedAddress)
    setStatus('loading')
    setError(null)
    setWalletData(null)
    setProfileData(null)

    try {
      const response = await fetch(`/api/wallet?address=${normalizedAddress}`, {
        cache: 'no-store',
      })
      const data = await response.json()

      if (data.error) {
        setStatus('error')
        setError(data.error)
      } else {
        setStatus('success')
        setWalletData(data.walletData)
        setProfileData(data.profile)
      }
    } catch (err) {
      setStatus('error')
      setError('Veri yüklenirken bir hata oluştu')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleRetry = () => {
    if (submittedAddress) {
      handleSearch()
    }
  }

  const handleExampleClick = async (exampleAddress: string) => {
    setAddress(exampleAddress)
    const normalizedAddress = exampleAddress.toLowerCase()
    setSubmittedAddress(normalizedAddress)
    setStatus('loading')
    setError(null)
    setWalletData(null)
    setProfileData(null)
    
    try {
      const response = await fetch(`/api/wallet?address=${normalizedAddress}`, {
        cache: 'no-store',
      })
      const data = await response.json()
      
      if (data.error) {
        setStatus('error')
        setError(data.error)
      } else {
        setStatus('success')
        setWalletData(data.walletData)
        setProfileData(data.profile)
      }
    } catch (err) {
      setStatus('error')
      setError('Veri yüklenirken bir hata oluştu')
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold">Avalanche Profile Hub</h1>
        <p className="text-sm text-muted-foreground">
          Search and view Avalanche wallet profiles
        </p>
      </div>

      <Card className="transition-all duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-base font-semibold">Search Wallet Address</CardTitle>
          <CardDescription className="text-xs">
            Enter an Avalanche C-Chain wallet address to view its profile
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-2">
            <Input
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
            <Button 
              onClick={handleSearch} 
              size="sm" 
              variant="secondary"
              className="transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">Quick Summary</CardTitle>
            <CardDescription className="text-xs">Wallet overview</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {status === 'idle' ? (
              <p className="text-sm text-muted-foreground">Search an address to see summary</p>
            ) : status === 'loading' ? (
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : status === 'error' ? (
              <Alert variant="destructive" className="py-2">
                <AlertDescription>
                  <p className="text-xs">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="mt-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            ) : walletData ? (
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">AVAX Balance</p>
                  <p className="text-sm font-semibold">{parseFloat(walletData.nativeBalance).toFixed(4)} AVAX</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Total Transactions</p>
                  <p className="text-sm font-semibold">{walletData.txCount}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/p/${submittedAddress}`)}
                  className="w-full mt-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  View Full Profile
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
            <CardDescription className="text-xs">Claim information</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {status === 'idle' ? (
              <p className="text-sm text-muted-foreground">Search an address to see claim status</p>
            ) : status === 'loading' ? (
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ) : status === 'error' ? (
              <Alert variant="destructive" className="py-2">
                <AlertDescription>
                  <p className="text-xs">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="mt-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            ) : profileData ? (
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                  <p className="text-sm font-semibold">
                    {profileData.status === 'CLAIMED' ? 'Claimed' : 'Unclaimed'}
                  </p>
                </div>
                {profileData.visibility && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Visibility</p>
                    <p className="text-xs">{profileData.visibility}</p>
                  </div>
                )}
                {profileData.status === 'UNCLAIMED' && submittedAddress && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/${submittedAddress}`)}
                    className="w-full mt-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Claim Profile
                  </Button>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">What you can see</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="transition-all duration-200 will-change-transform hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-muted/20 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Wallet Overview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground leading-snug">
                View balance, transaction history, and on-chain activity for any Avalanche wallet.
              </p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 will-change-transform hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-muted/20 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Assets</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground leading-snug">
                Browse tokens and NFTs held by the wallet address.
              </p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-200 will-change-transform hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-muted/20 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Claimable Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground leading-snug">
                Claim and customize your wallet profile with display name, bio, and social links.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Examples Section */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Try:</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExampleClick('0x8ab0cf264df99d83525e9e11c7e4db01558ae1b1')}
          className="transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Active
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExampleClick('0x26d3d5bb4da58309f3bd71714ad2317a2f31ec4d')}
          className="transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          NFT holder
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExampleClick('0x0000000000000000000000000000000000000000')}
          className="transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          New wallet
        </Button>
      </div>

      {/* Privacy Note */}
      <Alert className="mt-6">
        <Shield className="h-4 w-4" />
        <AlertTitle className="text-xs font-medium">Privacy</AlertTitle>
        <AlertDescription className="text-xs">
          No identity linking. Onchain data only. Behavioral labeling allowed, no real-world identity.
        </AlertDescription>
      </Alert>
    </div>
  )
}
