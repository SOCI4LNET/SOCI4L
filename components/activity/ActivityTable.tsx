'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { formatAddress } from '@/lib/utils'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import type { ActivityTransaction } from '@/lib/activity/fetchActivity'
import { ActivityDetailSheet } from './ActivityDetailSheet'

interface ActivityTableProps {
  transactions: ActivityTransaction[]
  address: string
  isLoading?: boolean
}

export function ActivityTable({ transactions, address, isLoading }: ActivityTableProps) {
  const [selectedTx, setSelectedTx] = useState<ActivityTransaction | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} kopyalandı`)
    } catch {
      toast.error('Kopyalama başarısız')
    }
  }

  const handleRowClick = (tx: ActivityTransaction) => {
    setSelectedTx(tx)
    setSheetOpen(true)
  }

  const getStatusIcon = (status: ActivityTransaction['status']) => {
    if (status === 'success') {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    } else if (status === 'failed') {
      return <XCircle className="h-4 w-4 text-red-500" />
    } else {
      return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getDirectionIcon = (direction: ActivityTransaction['direction']) => {
    if (direction === 'outgoing') {
      return <ArrowUpRight className="h-4 w-4 text-red-500" />
    } else {
      return <ArrowDownRight className="h-4 w-4 text-green-500" />
    }
  }

  // Desktop Table View
  const DesktopTable = () => (
    <div className="hidden md:block w-full">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-[60px]">Status</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead>Hash</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Token</TableHead>
            <TableHead className="text-right">Fee</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                İşlem bulunamadı
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => (
              <TableRow 
                key={tx.hash} 
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => handleRowClick(tx)}
              >
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {getStatusIcon(tx.status)}
                      </TooltipTrigger>
                      <TooltipContent>
                        {tx.status === 'success' ? 'Başarılı' : tx.status === 'failed' ? 'Başarısız' : 'Beklemede'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {tx.type === 'transfer' ? 'Transfer' : tx.type === 'contract' ? 'Kontrat' : 'Swap'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-mono text-xs">
                          {formatAddress(tx.hash, 6)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono text-xs">{tx.hash}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-mono text-xs">
                          {formatAddress(tx.from, 4)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono text-xs">{tx.from}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-mono text-xs">
                          {formatAddress(tx.to, 4)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono text-xs">{tx.to}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right">
                  {parseFloat(tx.nativeValueAvax) > 0 ? (
                    <span className="text-sm font-medium">
                      {parseFloat(tx.nativeValueAvax).toFixed(4)} AVAX
                    </span>
                  ) : tx.tokenTransfers.length > 0 ? (
                    <span className="text-sm font-medium">
                      {parseFloat(tx.tokenTransfers[0].amount).toFixed(4)} {tx.tokenTransfers[0].symbol}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {tx.tokenTransfers.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium">{tx.tokenTransfers[0].symbol}</span>
                      {tx.tokenTransfers.length > 1 && (
                        <Badge variant="outline" className="text-xs">
                          +{tx.tokenTransfers.length - 1}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">AVAX</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-xs text-muted-foreground">
                    {parseFloat(tx.feeAvax).toFixed(6)} AVAX
                  </span>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(tx.timestamp * 1000), { addSuffix: true })}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {new Date(tx.timestamp * 1000).toLocaleString('tr-TR')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCopy(tx.hash, 'Hash')}
                            aria-label="Copy hash"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy hash</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                            aria-label="Open in explorer"
                          >
                            <a
                              href={tx.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Open in explorer</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )

  // Mobile Card View
  const MobileCards = () => (
    <div className="md:hidden space-y-3">
      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            İşlem bulunamadı
          </CardContent>
        </Card>
      ) : (
        transactions.map((tx) => (
          <Card 
            key={tx.hash}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => handleRowClick(tx)}
          >
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(tx.status)}
                  {getDirectionIcon(tx.direction)}
                  <Badge variant="secondary" className="text-xs">
                    {tx.type === 'transfer' ? 'Transfer' : tx.type === 'contract' ? 'Kontrat' : 'Swap'}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(tx.timestamp * 1000), { addSuffix: true })}
                </span>
              </div>

              {/* Hash */}
              <div>
                <span className="text-xs text-muted-foreground">Hash</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs flex-1 truncate">
                    {formatAddress(tx.hash, 6)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(tx.hash, 'Hash')
                    }}
                    aria-label="Hash kopyala"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <span className="text-xs text-muted-foreground">Miktar</span>
                <p className="text-sm font-medium mt-1">
                  {parseFloat(tx.nativeValueAvax) > 0 ? (
                    `${parseFloat(tx.nativeValueAvax).toFixed(4)} AVAX`
                  ) : tx.tokenTransfers.length > 0 ? (
                    `${parseFloat(tx.tokenTransfers[0].amount).toFixed(4)} ${tx.tokenTransfers[0].symbol}`
                  ) : (
                    '-'
                  )}
                </p>
              </div>

              {/* Token Info */}
              {tx.tokenTransfers.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Token</span>
                  <p className="text-xs font-medium mt-1">
                    {tx.tokenTransfers[0].symbol}
                    {tx.tokenTransfers.length > 1 && ` (+${tx.tokenTransfers.length - 1} daha)`}
                  </p>
                </div>
              )}

              {/* Fee */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">Ücret</span>
                <span className="text-xs font-medium">{parseFloat(tx.feeAvax).toFixed(6)} AVAX</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <a
                    href={tx.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    Explorer
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  return (
    <>
      <DesktopTable />
      <MobileCards />
      <ActivityDetailSheet
        transaction={selectedTx}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        address={address}
      />
    </>
  )
}
