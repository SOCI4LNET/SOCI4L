'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Copy, ExternalLink, CheckCircle2, XCircle, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatAddress } from '@/lib/utils'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { formatEther } from 'viem'
import type { ActivityTransaction } from '@/lib/activity/fetchActivity'

interface ActivityDetailSheetProps {
  transaction: ActivityTransaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  address: string // Connected/viewing address
}

export function ActivityDetailSheet({ transaction, open, onOpenChange, address }: ActivityDetailSheetProps) {
  if (!transaction) return null

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied`)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const getStatusIcon = () => {
    if (transaction.status === 'success') {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    } else if (transaction.status === 'failed') {
      return <XCircle className="h-4 w-4 text-red-500" />
    } else {
      return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusLabel = () => {
    if (transaction.status === 'success') return 'Success'
    else if (transaction.status === 'failed') return 'Failed'
    else return 'Pending'
  }

  const isOutgoing = transaction.direction === 'outgoing'
  const directionIcon = isOutgoing ? (
    <ArrowUpRight className="h-4 w-4 text-red-500" />
  ) : (
    <ArrowDownRight className="h-4 w-4 text-green-500" />
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Transaction Details</SheetTitle>
          <SheetDescription>
            {formatDistanceToNow(new Date(transaction.timestamp * 1000), { addSuffix: true })}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusLabel()}</span>
            </div>
            <Badge variant={transaction.status === 'success' ? 'default' : 'destructive'}>
              {transaction.type === 'transfer' ? 'Transfer' : transaction.type === 'contract' ? 'Kontrat' : 'Swap'}
            </Badge>
          </div>

          <Separator />

          {/* Hash */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Hash</span>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleCopy(transaction.hash, 'Hash')}
                        aria-label="Hash kopyala"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Kopyala</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm font-mono break-all cursor-pointer" onClick={() => handleCopy(transaction.hash, 'Hash')}>
                    {transaction.hash}
                  </p>
                </TooltipTrigger>
                <TooltipContent>Click to copy</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Block Number */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Block Number</span>
            <p className="text-sm font-medium">{transaction.blockNumber.toLocaleString()}</p>
          </div>

          {/* Timestamp */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Time</span>
            <p className="text-sm font-medium">
              {new Date(transaction.timestamp * 1000).toLocaleString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </p>
          </div>

          <Separator />

          {/* Direction */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {directionIcon}
              <span className="text-sm text-muted-foreground">Direction</span>
            </div>
            <p className="text-sm font-medium">
              {isOutgoing ? 'Outgoing' : 'Incoming'}
            </p>
          </div>

          {/* From */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">From</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopy(transaction.from, 'Address')}
                      aria-label="Copy sender address"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm font-mono break-all cursor-pointer" onClick={() => handleCopy(transaction.from, 'Address')}>
                    {formatAddress(transaction.from, 8)}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">{transaction.from}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* To */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">To</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopy(transaction.to, 'Address')}
                      aria-label="Copy recipient address"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm font-mono break-all cursor-pointer" onClick={() => handleCopy(transaction.to, 'Address')}>
                    {formatAddress(transaction.to, 8)}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">{transaction.to}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Separator />

          {/* Native Value */}
          {parseFloat(transaction.nativeValueAvax) > 0 && (
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">AVAX Value</span>
              <p className="text-sm font-medium">{parseFloat(transaction.nativeValueAvax).toFixed(6)} AVAX</p>
            </div>
          )}

          {/* Fee */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Transaction Fee</span>
            <p className="text-sm font-medium">{parseFloat(transaction.feeAvax).toFixed(6)} AVAX</p>
          </div>

          {/* Gas Info */}
          {transaction.gasUsed && (
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Gas Used</span>
              <p className="text-sm font-medium">{parseInt(transaction.gasUsed).toLocaleString()}</p>
            </div>
          )}

          {transaction.gasPrice && (
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Gas Price</span>
              <p className="text-sm font-medium">{parseFloat(transaction.gasPrice).toFixed(9)} AVAX</p>
            </div>
          )}

          {/* Method */}
          {transaction.method && (
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Method</span>
              <p className="text-sm font-medium font-mono">{transaction.method}</p>
            </div>
          )}

          {/* Token Transfers */}
          {transaction.tokenTransfers.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <span className="text-sm font-medium">Token Transfers</span>
                {transaction.tokenTransfers.map((transfer, idx) => (
                  <div key={idx} className="p-3 border rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{transfer.symbol}</p>
                        <p className="text-xs text-muted-foreground">{transfer.name}</p>
                      </div>
                      <p className="text-sm font-medium">{parseFloat(transfer.amount).toFixed(6)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Contract</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p 
                              className="text-xs font-mono truncate cursor-pointer" 
                              onClick={() => handleCopy(transfer.contract, 'Contract address')}
                            >
                              {formatAddress(transfer.contract, 6)}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono text-xs">{transfer.contract}</p>
                            <p className="text-xs mt-1">Click to copy</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              asChild
            >
              <a
                href={transaction.explorerUrl}
                target="_blank"
                rel="noopener"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in Explorer
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
