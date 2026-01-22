'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

interface WalletData {
  tokenBalances: Array<{
    contractAddress: string
    name: string
    symbol: string
    balance: string
    decimals: number
  }>
}

interface AssetsPanelProps {
  walletData: WalletData | null
}

export function AssetsPanel({ walletData }: AssetsPanelProps) {
  return (
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
  )
}
