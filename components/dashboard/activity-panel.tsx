'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAddress } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface WalletData {
  transactions?: Array<{
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
  const isLoading = walletData === null
  const transactions = walletData?.transactions || []
  const hasTransactions = transactions.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Transaction history</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex-1 space-y-2 min-w-0">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16 ml-4" />
                <Skeleton className="h-8 w-8 ml-2" />
              </div>
            ))}
          </div>
        ) : hasTransactions ? (
          <div className="space-y-2">
            {transactions.slice(0, 10).map((tx, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono truncate">{formatAddress(tx.hash)}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {parseFloat(tx.value).toFixed(4)} AVAX
                    </p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.timestamp * 1000).toLocaleString('tr-TR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  asChild
                  aria-label="View transaction on explorer"
                >
                  <a
                    href={`https://snowtrace.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-sm font-medium mb-1">No activity yet</p>
                <p className="text-sm text-muted-foreground">This wallet has no transaction history</p>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
