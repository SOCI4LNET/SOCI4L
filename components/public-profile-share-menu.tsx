'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Share2, Twitter, Copy, Download, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { isValidAddress } from '@/lib/utils'
import { getPublicProfileHref } from '@/lib/routing'

interface PublicProfileShareMenuProps {
  address: string
  slug?: string | null
}

export function PublicProfileShareMenu({ address, slug }: PublicProfileShareMenuProps) {
  const [mounted, setMounted] = useState(false)
  const [supportsShare, setSupportsShare] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      setSupportsShare('share' in navigator)
    }
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon-sm" disabled>
        <Share2 className="h-4 w-4" />
      </Button>
    )
  }

  const getProfileUrl = () => {
    if (typeof window === 'undefined') return ''
    const baseUrl = window.location.origin
    if (slug) {
      return `${baseUrl}/p/${slug}`
    }
    // Use address if it's valid, otherwise it might be a slug (which is also valid for URL)
    if (address) {
      return `${baseUrl}/p/${address}`
    }
    return ''
  }

  const handleShareOnX = () => {
    const profileUrl = getProfileUrl()
    if (!profileUrl) return

    // Use NEXT_PUBLIC_APP_URL or fallback to window.origin
    const baseUrl = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)
      : ''
    
    // Build final URL (replace localhost with production URL if needed)
    const finalUrl = profileUrl.replace(window.location.origin, baseUrl)
    
    // Improved share text with blank line before link
    const shareText = 'Just found this Avalanche wallet profile on SOCI4L.\n\nExplore it here:'
    const text = encodeURIComponent(shareText)
    const url = encodeURIComponent(finalUrl)
    const intentUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`

    if (typeof window !== 'undefined') {
      window.open(intentUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleCopyLink = async () => {
    const profileUrl = getProfileUrl()
    if (!profileUrl) return

    try {
      await navigator.clipboard.writeText(profileUrl)
      toast.success('Link copied')
    } catch (error) {
      toast.error('Copy failed')
    }
  }

  const handleCopyAddress = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      toast.success('Address copied')
    } catch (error) {
      toast.error('Copy failed')
    }
  }

  const handleSystemShare = async () => {
    const profileUrl = getProfileUrl()
    if (!profileUrl || typeof window === 'undefined' || !navigator.share) return

    try {
      await navigator.share({
        title: 'Avalanche Profile',
        text: 'View this profile',
        url: profileUrl,
      })
      toast.success('Shared')
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error('Share canceled')
      }
    }
  }

  // Address is valid if it's a valid Ethereum address or if we have a slug (slug means profile exists)
  const isValid = address && (isValidAddress(address) || !!slug)

  const handleDownloadQR = () => {
    // QR modal will be opened from parent component
    // This is just a placeholder - actual QR download handled in QR modal
    toast.info('QR code available in profile header')
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={!isValid}
                className="h-8 w-8"
                aria-label="Share"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShareOnX}>
                <Twitter className="mr-2 h-4 w-4" />
                <span>Share on X</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy profile link</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadQR}>
                <Download className="mr-2 h-4 w-4" />
                <span>Download QR</span>
              </DropdownMenuItem>
              {supportsShare && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSystemShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share…</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>Share profile</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
