'use client'

import Link from 'next/link'

import { RefreshCw, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface AssetsHeaderProps {
  lastUpdatedText: string
  isLoading: boolean
  onRefresh: () => void
  explorerHref: string
}

export function AssetsHeader({
  lastUpdatedText,
  isLoading,
  onRefresh,
  explorerHref,
}: AssetsHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 pb-6">
      {/* Left: Title + Subtitle */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tokens and NFTs held by this wallet
        </p>
      </div>

      {/* Right: Status + Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {lastUpdatedText}
        </span>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-9 w-9"
                aria-label="Refresh assets"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh assets</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-9 w-9"
                aria-label="View on explorer"
              >
                <Link href={explorerHref} target="_blank" rel="noopener">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View assets on Snowtrace</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
