'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { formatAddress } from '@/lib/utils'
import type { ActivityTransaction } from '@/lib/activity/fetchActivity'
import { ActivityDetailSheet } from './ActivityDetailSheet'

import { ExternalLink, CheckCircle2, XCircle, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'


interface ActivityTableProps {
  transactions: ActivityTransaction[]
  address: string
  isLoading?: boolean
}

export function ActivityTable({ transactions, address }: ActivityTableProps) {
  const [selectedTx, setSelectedTx] = useState<ActivityTransaction | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

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

  const getTypeLabel = (tx: ActivityTransaction, walletAddress: string) => {
    if (tx.type === 'contract') return 'Contract Interaction'
    if (tx.type === 'swap') return 'Swap'
    const isOutgoing = tx.from.toLowerCase() === walletAddress.toLowerCase()
    return isOutgoing ? 'Send' : 'Receive'
  }

  const getCounterparty = (tx: ActivityTransaction, walletAddress: string) => {
    const isOutgoing = tx.from.toLowerCase() === walletAddress.toLowerCase()
    const counterparty = isOutgoing ? tx.to : tx.from
    return counterparty ? formatAddress(counterparty, 4) : '-'
  }

  // Desktop Table View
  const DesktopTable = () => (
    <div className="hidden md:block w-full">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-[60px]">Status</TableHead>
            <TableHead className="w-[140px]">Type</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="w-[70px] text-right">Explorer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No recent transactions found.
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
                        {tx.status === 'success' ? 'Success' : tx.status === 'failed' ? 'Failed' : 'Pending'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {getTypeLabel(tx, address)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-mono text-xs">
                          {getCounterparty(tx, address)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono text-xs">
                          {tx.from.toLowerCase() === address.toLowerCase()
                            ? `To: ${tx.to}`
                            : `From: ${tx.from}`}
                        </p>
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
                            rel="noopener"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Open in explorer</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
            No recent transactions found.
          </CardContent>
        </Card>
      ) : (
        transactions.map((tx) => {
          const typeLabel = getTypeLabel(tx, address)
          const counterparty = getCounterparty(tx, address)
          const amountLabel =
            parseFloat(tx.nativeValueAvax) > 0
              ? `${parseFloat(tx.nativeValueAvax).toFixed(4)} AVAX`
              : tx.tokenTransfers.length > 0
              ? `${parseFloat(tx.tokenTransfers[0].amount).toFixed(4)} ${
                  tx.tokenTransfers[0].symbol
                }`
              : '-'

          return (
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
                      {typeLabel}
                    </Badge>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(tx.timestamp * 1000), {
                            addSuffix: true,
                          })}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {new Date(tx.timestamp * 1000).toLocaleString('tr-TR')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Counterparty */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="truncate">{counterparty}</span>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between text-sm">
                  <span>{amountLabel}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(tx.explorerUrl, '_blank', 'noopener')
                    }}
                    aria-label="Open in explorer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })
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
