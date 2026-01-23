'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Twitter, Github, Globe, RefreshCw } from 'lucide-react'
import { formatAddress } from '@/lib/utils'
import Link from 'next/link'
import { PageShell } from '@/components/app-shell/page-shell'

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
    <PageShell title="Overview" subtitle="Wallet summary and activity">

      {/* Profile Summary Card */}
      <Card className="bg-card border border-border/60 shadow-sm">
        <CardContent className="p-5">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border shadow-sm">
              <CardContent className="p-4">
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-7 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : walletData ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">AVAX Balance</p>
              <p className="text-xl font-semibold tracking-tight">
                {parseFloat(walletData.nativeBalance).toFixed(4)} AVAX
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">Transactions</p>
              <p className="text-xl font-semibold tracking-tight">{walletData.txCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">Tokens</p>
              <p className="text-xl font-semibold tracking-tight">{walletData.tokenBalances?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">NFTs</p>
              <p className="text-xl font-semibold tracking-tight">{walletData.nfts?.length || 0}</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-card border shadow-sm">
          <CardContent className="p-4">
            <div className="text-center py-4">
              <p className="text-xs font-medium mb-1">No data available</p>
              <p className="text-xs text-muted-foreground">Unable to load wallet overview</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity and Assets Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity Card */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : walletData?.transactions && walletData.transactions.length > 0 ? (
              <div className="space-y-3">
                {walletData.transactions.slice(0, 5).map((tx, idx) => (
                  <div key={tx.hash || idx} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-mono">{tx.hash.slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {formatAddress(tx.from)} → {formatAddress(tx.to)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.timestamp * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm font-medium mb-1">No activity yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Connect a wallet and start exploring.
                </p>
                <Link href={`/p/${address}`}>
                  <Button variant="outline" size="sm">
                    View public profile
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assets Card */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Assets</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : walletData && (walletData.tokenBalances?.length > 0 || walletData.nfts?.length > 0) ? (
              <div className="space-y-3">
                {walletData.tokenBalances?.slice(0, 3).map((token, idx) => (
                  <div key={token.contractAddress || idx} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-semibold">{token.symbol.slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{token.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {parseFloat(token.balance).toFixed(4)} {token.symbol}
                      </p>
                    </div>
                  </div>
                ))}
                {walletData.nfts?.slice(0, 2).map((nft, idx) => (
                  <div key={nft.tokenId || idx} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {nft.image ? (
                        <img src={nft.image} alt={nft.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <span className="text-xs font-semibold">NFT</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{nft.name || `NFT #${nft.tokenId}`}</p>
                      <p className="text-xs text-muted-foreground">Token ID: {nft.tokenId}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm font-medium mb-1">No assets found</p>
                <p className="text-xs text-muted-foreground mb-4">
                  This wallet has no tokens or NFTs to display.
                </p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Refresh
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
