'use client'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RefreshCw, Eye, Share2, QrCode, Copy } from 'lucide-react'
import Link from 'next/link'

interface AssetsHeaderProps {
  lastUpdatedText: string
  isLoading: boolean
  onRefresh: () => void
  publicProfileHref: string
  onShareTwitter: () => void
  onCopyLink: () => void
  onShowQR: () => void
}

export function AssetsHeader({
  lastUpdatedText,
  isLoading,
  onRefresh,
  publicProfileHref,
  onShareTwitter,
  onCopyLink,
  onShowQR,
}: AssetsHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 pb-6">
      {/* Left: Title + Subtitle */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
        <p className="text-sm text-muted-foreground mt-1">Tokens and NFT holdings</p>
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
                aria-label="View public profile"
              >
                <Link href={publicProfileHref}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View public profile</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    aria-label="Share profile"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onShareTwitter}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share on X
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onCopyLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent>Share profile</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onShowQR}
                className="h-9 w-9"
                aria-label="Show QR code"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show QR code</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
