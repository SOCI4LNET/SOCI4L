'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Share2, Twitter, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { isValidAddress } from '@/lib/utils'

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

    // Remove localhost in production, use NEXT_PUBLIC_SITE_URL if available
    const siteUrl = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)
      : ''
    const finalUrl = profileUrl.replace(window.location.origin, siteUrl)
    
    const text = encodeURIComponent('Found an Avalanche profile worth checking out.\n\n')
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={!isValid}
          aria-label="Share"
          title="Share"
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
          <span>Copy Link</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Address</span>
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
  )
}
