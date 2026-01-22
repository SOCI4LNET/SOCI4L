'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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

interface OverviewPanelProps {
  walletData: WalletData | null
}

export function OverviewPanel({ walletData }: OverviewPanelProps) {
  return (
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
  )
}
