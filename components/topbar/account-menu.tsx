'use client'

import { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Copy, Share2, QrCode, LogOut, LayoutDashboard, User, ExternalLink } from 'lucide-react'
import { formatAddress } from '@/lib/utils'
import { toast } from 'sonner'
import { getConnectedDashboardHref, getPublicProfileHref } from '@/lib/routing'
import { QRCodeModal } from '@/components/qr/qr-code-modal'

export function AccountMenu() {
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState<{ slug?: string | null; displayName?: string | null } | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const { address: connectedAddress, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch profile data for connected address
  useEffect(() => {
    if (!mounted || !isConnected || !connectedAddress) {
      setProfile(null)
      return
    }

    const fetchProfile = async () => {
      try {
        const normalizedAddress = connectedAddress.toLowerCase()
        const response = await fetch(`/api/wallet?address=${normalizedAddress}`, {
          cache: 'no-store',
        })
        const data = await response.json()
        
        if (data.profile) {
          setProfile({
            slug: data.profile.slug,
            displayName: data.profile.displayName,
          })
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
      }
    }

    fetchProfile()
  }, [mounted, isConnected, connectedAddress])

  if (!mounted) {
    return <div className="h-8 w-8" />
  }

  if (!isConnected || !connectedAddress) {
    return null
  }

  const normalizedAddress = connectedAddress.toLowerCase()
  const dashboardHref = getConnectedDashboardHref(connectedAddress)
  const publicProfileHref = getPublicProfileHref(normalizedAddress, profile?.slug)
  const avatarUrl = `https://effigy.im/a/${normalizedAddress}.svg`
  const fallbackText = normalizedAddress.slice(2, 5).toUpperCase()

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(connectedAddress)
      toast.success('Address copied')
    } catch (error) {
      toast.error('Failed to copy address')
    }
  }

  const handleShare = async () => {
    // Add source=copy parameter for attribution
    const profileUrl = publicProfileHref
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}${publicProfileHref}?source=copy`
      : null

    if (!profileUrl) {
      toast.error('Profile URL not available')
      return
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Avalanche Profile',
          text: `Check out this Avalanche profile`,
          url: profileUrl,
        })
        return
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error)
        }
      }
    }

    try {
      await navigator.clipboard.writeText(profileUrl)
      toast.success('Link copied')
    } catch (error) {
      toast.error('Copy failed')
    }
  }

  const handleDashboard = () => {
    router.push(dashboardHref)
  }

  const handlePublicProfile = () => {
    if (publicProfileHref) {
      router.push(publicProfileHref)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    toast.success('Wallet disconnected')
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          {/* Address display with copy/share */}
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md border bg-background">
            <span className="text-sm font-mono">{formatAddress(connectedAddress, 4)}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCopyAddress}
                  className="h-6 w-6"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy address</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleShare}
                  className="h-6 w-6"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share profile</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={formatAddress(connectedAddress)} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {fallbackText}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleDashboard}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePublicProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>Public Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyAddress}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy Address</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                <span>Share</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setQrModalOpen(true)}>
                <QrCode className="mr-2 h-4 w-4" />
                <span>QR Code</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDisconnect} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* QR Code Modal */}
      {isConnected && connectedAddress && (
        <QRCodeModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          profile={{
            address: connectedAddress,
            slug: profile?.slug || null,
            displayName: profile?.displayName || null,
            avatarUrl: avatarUrl,
          }}
        />
      )}
    </>
  )
}
