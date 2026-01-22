'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Copy, Twitter, Github, Globe } from 'lucide-react'
import { formatAddress, isValidAddress } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

interface ProfileData {
  displayName?: string | null
  bio?: string | null
  socialLinks?: Array<{ type: string; url: string; label?: string }> | null
}

interface WalletData {
  nativeBalance: string
  txCount: number
  tokenBalances?: Array<any>
  nfts?: Array<any>
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [addressInput, setAddressInput] = useState('')
  const { address: connectedAddress, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [hasClaimedProfile, setHasClaimedProfile] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !isConnected || !connectedAddress) {
      setLoading(false)
      return
    }

    // Fetch profile and wallet data
    const fetchData = async () => {
      try {
        const normalizedAddress = connectedAddress.toLowerCase()
        const response = await fetch(`/api/wallet?address=${normalizedAddress}`, {
          cache: 'no-store',
        })
        const data = await response.json()
        
        if (data.profile) {
          setProfile({
            displayName: data.profile.displayName,
            bio: data.profile.bio,
            socialLinks: data.profile.socialLinks,
          })
          if (data.profile.status === 'CLAIMED') {
            setHasClaimedProfile(true)
          }
        }
        
        if (data.walletData) {
          setWalletData({
            nativeBalance: data.walletData.nativeBalance,
            txCount: data.walletData.txCount,
            tokenBalances: data.walletData.tokenBalances,
            nfts: data.walletData.nfts,
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [mounted, isConnected, connectedAddress])

  const handleAddressSubmit = () => {
    if (!addressInput.trim()) return
    
    const trimmedAddress = addressInput.trim()
    if (isValidAddress(trimmedAddress)) {
      // Normalize address to lowercase
      const normalizedAddress = trimmedAddress.toLowerCase()
      router.push(`/dashboard/${normalizedAddress}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddressSubmit()
    }
  }

  const handleCopyAddress = async () => {
    if (!connectedAddress) return
    
    try {
      await navigator.clipboard.writeText(connectedAddress)
      toast.success('Copied')
    } catch (error) {
      toast.error('Copy failed')
    }
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

  if (!mounted) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!isConnected ? (
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
                className="w-full"
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
      ) : (
        <>
          {/* Dashboard Header */}
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                {formatAddress(connectedAddress || '', 4)}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleCopyAddress}
                aria-label="Copy address"
                title="Copy address"
                className="h-7 w-7"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : hasClaimedProfile ? (
              <Link href={`/dashboard/${connectedAddress?.toLowerCase()}`}>
                <Button variant="default" size="sm">Manage Profile</Button>
              </Link>
            ) : (
              <Link href={`/dashboard/${connectedAddress?.toLowerCase()}`}>
                <Button variant="outline" size="sm">Claim Profile</Button>
              </Link>
            )}
          </div>

          {/* Profile Summary Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={connectedAddress ? `https://effigy.im/a/${connectedAddress}.svg` : undefined}
                    alt={profile?.displayName || formatAddress(connectedAddress || '')}
                  />
                  <AvatarFallback className="text-xs">
                    {connectedAddress ? connectedAddress.slice(2, 4).toUpperCase() : '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  ) : profile?.displayName ? (
                    <>
                      <h2 className="text-sm font-semibold mb-1">{profile.displayName}</h2>
                      {profile.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                          {profile.bio}
                        </p>
                      )}
                      {profile.socialLinks && profile.socialLinks.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          {profile.socialLinks.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title={link.label || link.type}
                            >
                              {getSocialIcon(link.type)}
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {formatAddress(connectedAddress || '')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Profile not claimed yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Stats */}
          {walletData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">AVAX Balance</p>
                  <p className="text-sm font-semibold">
                    {parseFloat(walletData.nativeBalance).toFixed(4)} AVAX
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Transactions</p>
                  <p className="text-sm font-semibold">{walletData.txCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Tokens</p>
                  <p className="text-sm font-semibold">{walletData.tokenBalances?.length || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">NFTs</p>
                  <p className="text-sm font-semibold">{walletData.nfts?.length || 0}</p>
                </CardContent>
              </Card>
            </div>
          )}

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

          {/* Info about account switching */}
          <Alert className="py-2">
            <AlertDescription className="text-xs">
              <span className="font-medium">Multiple Accounts?</span> Switch accounts in your wallet extension, then click "Manage Profile" above or enter the address manually.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  )
}
