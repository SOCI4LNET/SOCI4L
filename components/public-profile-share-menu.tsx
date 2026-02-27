'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'
import { isValidAddress, formatAddress } from '@/lib/utils'

import { Share2, Copy, QrCode } from 'lucide-react'

import { XIcon } from '@/components/icons/x-icon'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'


interface PublicProfileShareMenuProps {
  address: string
  slug?: string | null
  onOpenQR?: () => void
}

export function PublicProfileShareMenu({ address, slug, onOpenQR }: PublicProfileShareMenuProps) {
  const { address: connectedAddress } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [supportsShare, setSupportsShare] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      setSupportsShare('share' in navigator)
    }
  }, [])

  // Check if the profile belongs to the connected wallet
  const isOwnProfile = connectedAddress && address && address.toLowerCase() === connectedAddress.toLowerCase()

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Share2 className="h-4 w-4" />
      </Button>
    )
  }

  const getProfileUrl = (includeSource: boolean = false) => {
    if (typeof window === 'undefined') return ''
    const baseUrl = window.location.origin
    let url = ''
    if (slug) {
      url = `${baseUrl}/p/${slug}`
    } else if (address) {
      // Use address if it's valid, otherwise it might be a slug (which is also valid for URL)
      url = `${baseUrl}/p/${address}`
    }
    // Add source=copy parameter for copied link attribution
    if (url && includeSource) {
      url = `${url}?source=copy`
    }
    return url
  }

  const handleShareOnX = () => {
    const profileUrl = getProfileUrl(true) // Include source=copy for attribution
    if (!profileUrl) return

    // Use NEXT_PUBLIC_APP_URL or fallback to window.origin
    const baseUrl =
      typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
        : ''

    // Build final URL (replace localhost with production URL if needed)
    const finalUrl = profileUrl.replace(window.location.origin, baseUrl)

    // Share copy with line breaks - link on its own line
    let shareText: string
    if (isOwnProfile) {
      shareText =
        'Just claimed my SOCI4L profile on Avalanche.\n\n' +
        'Track my on-chain identity and links in one place.\n\n' +
        finalUrl
    } else {
      const profileName = slug || formatAddress(address, 4)
      shareText =
        `Check out this SOCI4L profile on Avalanche: ${profileName}\n\n` +
        'Track on-chain identity and links in one place.\n\n' +
        finalUrl
    }

    const text = encodeURIComponent(shareText)
    const intentUrl = `https://twitter.com/intent/tweet?text=${text}`

    if (typeof window !== 'undefined') {
      window.open(intentUrl, '_blank', 'noopener')
    }
  }

  const handleCopyLink = async () => {
    const profileUrl = getProfileUrl(true) // Include source=copy for attribution
    if (!profileUrl) return

    try {
      await navigator.clipboard.writeText(profileUrl)
      toast.success('Profile link copied')
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const handleCopyAddress = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      toast.success('Address copied')
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const handleSystemShare = async () => {
    const profileUrl = getProfileUrl(true) // Include source=copy for attribution
    if (!profileUrl || typeof window === 'undefined' || !navigator.share) return

    try {
      let shareTitle: string
      let shareText: string
      if (isOwnProfile) {
        shareTitle = 'My Avalanche Profile'
        shareText = 'Check out my SOCI4L profile on Avalanche. Track my on-chain identity and links in one place.'
      } else {
        const profileName = slug || formatAddress(address, 4)
        shareTitle = 'Avalanche Profile'
        shareText = `Check out this SOCI4L profile on Avalanche: ${profileName}. Track on-chain identity and links in one place.`
      }
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: profileUrl,
      })
      toast.success('Shared')
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error('Share cancelled')
      }
    }
  }

  // Address is valid if it's a valid Ethereum address or if we have a slug (slug means profile exists)
  const isValid = address && (isValidAddress(address) || !!slug)

  const handleOpenQR = () => {
    if (onOpenQR) {
      onOpenQR()
    } else {
      toast.info('QR code available in profile header')
    }
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
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy profile link</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareOnX}>
                <XIcon className="mr-2 h-4 w-4" />
                <span>Share on X</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenQR}>
                <QrCode className="mr-2 h-4 w-4" />
                <span>Show QR code</span>
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
