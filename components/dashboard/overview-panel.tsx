'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Twitter, Github, Globe } from 'lucide-react'
import { formatAddress } from '@/lib/utils'

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

interface ProfileData {
  displayName?: string | null
  bio?: string | null
  socialLinks?: Array<{ id?: string; platform?: string; type?: string; url: string; label?: string }> | null
}

interface OverviewPanelProps {
  walletData: WalletData | null
  profile: ProfileData | null
  address: string
}

const getSocialIcon = (platform?: string, type?: string) => {
  const normalized = (platform || type || 'website').toLowerCase()
  if (normalized.includes('twitter') || normalized.includes('x')) {
    return <Twitter className="h-3.5 w-3.5" />
  } else if (normalized.includes('github')) {
    return <Github className="h-3.5 w-3.5" />
  } else {
    return <Globe className="h-3.5 w-3.5" />
  }
}

export function OverviewPanel({ walletData, profile, address }: OverviewPanelProps) {
  const isLoading = walletData === null

  return (
    <div className="space-y-4">
      {/* Profile Summary Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={address ? `https://effigy.im/a/${address}.svg` : undefined}
                alt={profile?.displayName || formatAddress(address)}
              />
              <AvatarFallback className="text-xs">
                {address ? address.slice(2, 4).toUpperCase() : '??'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {isLoading ? (
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
                          key={link.id || idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title={link.label || link.platform || link.type || 'Link'}
                        >
                          {getSocialIcon(link.platform, link.type)}
                        </a>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {formatAddress(address)}
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
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : walletData ? (
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
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="text-center py-4">
              <p className="text-xs font-medium mb-1">No data available</p>
              <p className="text-xs text-muted-foreground">Unable to load wallet overview</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
