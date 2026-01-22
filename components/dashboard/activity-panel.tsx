'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAddress } from '@/lib/utils'

interface WalletData {
  transactions: Array<{
    hash: string
    from: string
    to: string
    value: string
    timestamp: number
    blockNumber: number
  }>
}

interface ActivityPanelProps {
  walletData: WalletData | null
}

export function ActivityPanel({ walletData }: ActivityPanelProps) {
  return (
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
  )
}
