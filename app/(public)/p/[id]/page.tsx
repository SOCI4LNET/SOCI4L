'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAddress, isValidAddress } from '@/lib/utils'
import Link from 'next/link'
import { ExternalLink, Twitter, Linkedin, Github, Globe, MessageCircle, Send, Mail } from 'lucide-react'
import { ClaimProfileButton } from '@/components/claim-profile-button'
import { PublicProfileShareMenu } from '@/components/public-profile-share-menu'
import { FollowToggle, FollowStats } from '@/components/follow-toggle'
import { QRCodeModal } from '@/components/qr/qr-code-modal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { QrCode } from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
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

export default function ProfilePage({ params }: PageProps) {
  const router = useRouter()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [profileStatus, setProfileStatus] = useState<'UNCLAIMED' | 'CLAIMED+PUBLIC' | 'CLAIMED+PRIVATE'>('UNCLAIMED')
  const [profile, setProfile] = useState<{ 
    address: string
    slug: string | null
    displayName?: string | null
    bio?: string | null
    socialLinks?: Array<{ id?: string; platform?: string; type?: string; url: string; label?: string }> | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Check if id is an address (starts with 0x) or a slug
        const isAddress = params.id.startsWith('0x') && isValidAddress(params.id)
        
        let response: Response
        if (isAddress) {
          // Normalize address to lowercase for consistent API calls
          const normalizedAddress = params.id.toLowerCase()
          response = await fetch(`/api/wallet?address=${normalizedAddress}`, {
            cache: 'no-store',
          })
        } else {
          response = await fetch(`/api/wallet?slug=${params.id}`, {
            cache: 'no-store',
          })
        }

        const data = await response.json()

        if (data.error) {
          if (response.status === 404 && !isAddress) {
            setError('Profile not found')
          } else {
            setError(data.error)
          }
        } else {
          setWalletData(data.walletData)
          setProfileStatus(data.profileStatus)
          if (data.profile) {
            setProfile({
              address: data.profile.address,
              slug: data.profile.slug,
              displayName: data.profile.displayName,
              bio: data.profile.bio,
              socialLinks: data.profile.socialLinks,
            })
          }
        }
      } catch (err) {
        setError('Veri yüklenirken bir hata oluştu')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const getStatusBadge = () => {
    switch (profileStatus) {
      case 'UNCLAIMED':
        return <Badge variant="outline">Unclaimed</Badge>
      case 'CLAIMED+PUBLIC':
        return <Badge variant="default">Claimed - Public</Badge>
      case 'CLAIMED+PRIVATE':
        return <Badge variant="secondary">Claimed - Private</Badge>
      default:
        return <Badge variant="outline">Unclaimed</Badge>
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-destructive">{error}</p>
          <Link href="/" className="text-muted-foreground hover:text-foreground mt-4 inline-block">
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    )
  }

  const handleClaimSuccess = async () => {
    // Get the resolved address (from profile or params)
    // Normalize to lowercase for consistency
    const resolvedAddress = profile?.address?.toLowerCase() || (params.id.startsWith('0x') ? params.id.toLowerCase() : null)
    
    if (resolvedAddress) {
      // Refresh router cache first
      router.refresh()
      
      // Refetch data to get updated profile status
      const normalizedAddress = resolvedAddress.toLowerCase()
      const response = await fetch(`/api/wallet?address=${normalizedAddress}`, {
        cache: 'no-store',
      })
      const data = await response.json()
      
      if (data.profile) {
        setProfile({
          address: data.profile.address,
          slug: data.profile.slug,
          displayName: data.profile.displayName,
          bio: data.profile.bio,
          socialLinks: data.profile.socialLinks,
        })
        // Update status based on fresh data
        if (data.profileStatus) {
          setProfileStatus(data.profileStatus)
        }
      }
    } else {
      // Fallback: reload page
      window.location.reload()
    }
  }


  // Show private state if profile is CLAIMED and PRIVATE
  const isPrivate = profileStatus === 'CLAIMED+PRIVATE'
  const isClaimed = profileStatus === 'CLAIMED+PUBLIC' || profileStatus === 'CLAIMED+PRIVATE'
  const displayName = profile?.displayName || (profile?.address ? formatAddress(profile.address) : (params.id.startsWith('0x') ? formatAddress(params.id) : params.id))

  const getSocialIcon = (platform: string) => {
    const normalizedPlatform = platform.toLowerCase()
    switch (normalizedPlatform) {
      case 'x':
        return <Twitter className="h-3.5 w-3.5" />
      case 'instagram':
        return <Globe className="h-3.5 w-3.5" />
      case 'youtube':
        return <Globe className="h-3.5 w-3.5" />
      case 'linkedin':
        return <Linkedin className="h-3.5 w-3.5" />
      case 'github':
        return <Github className="h-3.5 w-3.5" />
      case 'website':
        return <Globe className="h-3.5 w-3.5" />
      default:
        return <ExternalLink className="h-3.5 w-3.5" />
    }
  }

  const getSocialLabel = (link: { platform?: string; type?: string; url: string; label?: string }) => {
    if (link.label) return link.label
    const platform = link.platform || link.type || 'website'
    switch (platform.toLowerCase()) {
      case 'x':
        return 'X'
      case 'instagram':
        return 'Instagram'
      case 'youtube':
        return 'YouTube'
      case 'linkedin':
        return 'LinkedIn'
      case 'github':
        return 'GitHub'
      case 'website':
        return 'Website'
      default:
        return platform
    }
  }

  const getSocialUrl = (link: { platform?: string; type?: string; url: string }) => {
    return link.url
  }

  // Get resolved address for follow components
  const resolvedAddress = profile?.address || (params.id.startsWith('0x') ? params.id : null)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{isClaimed ? displayName : 'Wallet Profile'}</h1>
            {isClaimed && profile?.address && displayName !== formatAddress(profile.address) && (
              <p className="font-mono text-sm text-muted-foreground mt-1">
                {formatAddress(profile.address)}
              </p>
            )}
            {!isClaimed && (
              <p className="font-mono text-sm text-muted-foreground mt-1">
                {params.id.startsWith('0x') ? formatAddress(params.id) : params.id}
              </p>
            )}
            {resolvedAddress && isValidAddress(resolvedAddress) && (
              <div className="mt-2">
                <FollowStats address={resolvedAddress} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {resolvedAddress && isValidAddress(resolvedAddress) && (
              <FollowToggle address={resolvedAddress} />
            )}
            {resolvedAddress && isValidAddress(resolvedAddress) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setQrModalOpen(true)}
                      aria-label="QR Code"
                      className="h-7 w-7"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>QR Code</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <PublicProfileShareMenu 
              address={profile?.address || params.id} 
              slug={profile?.slug}
            />
            {profileStatus === 'UNCLAIMED' && profile?.address && (
              <ClaimProfileButton address={profile.address} onSuccess={handleClaimSuccess} />
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Wallet overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Recent transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Assets</CardTitle>
              <CardDescription>Tokens and NFTs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        </div>
      ) : isPrivate ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-lg font-semibold mb-2">This profile is private</p>
              <p className="text-muted-foreground">
                The owner has set this profile to private. Asset and activity details are not visible.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : walletData ? (
        <div className="space-y-6">
          {/* Profile Info Card - only show if claimed and public */}
          {isClaimed && !isPrivate && (profile?.bio || (profile?.socialLinks && profile.socialLinks.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground">{profile.bio}</p>
                  </div>
                )}
                {profile?.socialLinks && profile.socialLinks.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground">Social Links</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.socialLinks.map((link, idx) => (
                        <Button
                          key={link.id || idx}
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-7"
                        >
                          <a
                            href={getSocialUrl(link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5"
                          >
                            {getSocialIcon(link.platform || link.type || 'website')}
                            <span className="text-xs">{getSocialLabel(link)}</span>
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-3">
            {/* Summary Column */}
            <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Wallet overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">AVAX Balance</p>
                <p className="text-2xl font-bold">{parseFloat(walletData.nativeBalance).toFixed(4)} AVAX</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
                <p className="text-xl font-bold">{walletData.txCount}</p>
              </div>
              {walletData.firstSeen && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">First Seen</p>
                  <p className="text-sm">{new Date(walletData.firstSeen).toLocaleDateString('tr-TR')}</p>
                </div>
              )}
              {walletData.lastSeen && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Seen</p>
                  <p className="text-sm">{new Date(walletData.lastSeen).toLocaleDateString('tr-TR')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Column */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Recent transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {walletData.transactions && walletData.transactions.length > 0 ? (
                walletData.transactions.slice(0, 10).map((tx, idx) => (
                  <div key={idx} className="space-y-1 border-b pb-2 last:border-0">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs">{formatAddress(tx.hash)}</p>
                      <a
                        href={`https://snowtrace.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.timestamp * 1000).toLocaleString('tr-TR')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No transactions found</p>
              )}
            </CardContent>
          </Card>

          {/* Assets Column */}
          <Card>
            <CardHeader>
              <CardTitle>Assets</CardTitle>
              <CardDescription>Tokens and NFTs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tokens</p>
                {walletData.tokenBalances && walletData.tokenBalances.length > 0 ? (
                  walletData.tokenBalances.slice(0, 5).map((token, idx) => (
                    <div key={idx} className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-sm font-medium">{token.symbol}</p>
                        <p className="text-xs text-muted-foreground">{token.name}</p>
                      </div>
                      <p className="text-sm font-mono">{parseFloat(token.balance).toFixed(4)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No tokens found</p>
                )}
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">NFTs</p>
                {walletData.nfts && walletData.nfts.length > 0 ? (
                  walletData.nfts.slice(0, 5).map((nft, idx) => (
                    <div key={idx} className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-sm font-medium">{nft.name || 'Unnamed NFT'}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {formatAddress(nft.contractAddress)} #{nft.tokenId}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No NFTs found</p>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      ) : null}
      
      {/* QR Code Modal for current profile */}
      {resolvedAddress && isValidAddress(resolvedAddress) && (
        <QRCodeModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          profile={{
            address: resolvedAddress,
            slug: profile?.slug || null,
            displayName: profile?.displayName || null,
            avatarUrl: `https://effigy.im/a/${resolvedAddress}.svg`,
          }}
        />
      )}
    </div>
  )
}
