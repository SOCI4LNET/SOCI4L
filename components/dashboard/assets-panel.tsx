'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAddress } from '@/lib/utils'

interface WalletData {
  tokenBalances?: Array<{
    contractAddress: string
    name: string
    symbol: string
    balance: string
    decimals: number
  }>
  nfts?: Array<{
    contractAddress: string
    tokenId: string
    name?: string
    image?: string
  }>
}

interface AssetsPanelProps {
  walletData: WalletData | null
}

export function AssetsPanel({ walletData }: AssetsPanelProps) {
  const isLoading = walletData === null
  const tokens = walletData?.tokenBalances || []
  const nfts = walletData?.nfts || []
  const hasTokens = tokens.length > 0
  const hasNfts = nfts.length > 0
  const hasAssets = hasTokens || hasNfts

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Assets</CardTitle>
            <CardDescription>Tokens and NFT holdings</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : hasAssets ? (
          <div className="space-y-6">
            {hasTokens && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Tokens</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map((token, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{token.name}</TableCell>
                        <TableCell className="text-muted-foreground">{token.symbol}</TableCell>
                        <TableCell className="text-right font-mono">
                          {parseFloat(token.balance).toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {hasNfts && (
              <div>
                <h3 className="text-sm font-semibold mb-3">NFTs</h3>
                <div className="space-y-2">
                  {nfts.map((nft, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{nft.name || 'Unnamed NFT'}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {formatAddress(nft.contractAddress)} #{nft.tokenId}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-sm font-medium mb-1">No assets found</p>
                <p className="text-sm text-muted-foreground">This wallet has no tokens or NFTs</p>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
