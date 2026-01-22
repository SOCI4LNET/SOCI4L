'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAddress, isValidAddress } from '@/lib/utils'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

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
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [profileStatus, setProfileStatus] = useState<'UNCLAIMED' | 'CLAIMED+PUBLIC' | 'CLAIMED+PRIVATE'>('UNCLAIMED')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!isValidAddress(params.id)) {
        setError('Geçersiz cüzdan adresi')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/wallet?address=${params.id}`)
        const data = await response.json()

        if (data.error) {
          setError(data.error)
        } else {
          setWalletData(data.walletData)
          setProfileStatus(data.profileStatus)
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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallet Profile</h1>
            <p className="font-mono text-sm text-muted-foreground mt-1">
              {formatAddress(params.id)}
            </p>
          </div>
          {getStatusBadge()}
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
      ) : walletData ? (
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
      ) : null}
    </div>
  )
}
