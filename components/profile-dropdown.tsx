'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { useAccount, useDisconnect } from 'wagmi'
import { toast } from 'sonner'
import { formatAddress } from '@/lib/utils'
import { getConnectedDashboardHref, getCurrentProfileAddressFromRoute, getPublicProfileHref } from '@/lib/routing'

import { LayoutDashboard, User, Copy, LogOut, Share2, QrCode } from 'lucide-react'

import { QRCodeModal } from '@/components/qr/qr-code-modal'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export function ProfileDropdown() {
  const [mounted, setMounted] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [profile, setProfile] = useState<{ slug?: string | null; displayName?: string | null } | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const { address: connectedAddress, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch profile data if on dashboard page
  useEffect(() => {
    if (!mounted || !isConnected || !connectedAddress) {
      setProfile(null)
      return
    }

    const fetchProfile = async () => {
      // Only fetch if we're on a dashboard page
      if (pathname?.startsWith('/dashboard/') && params?.address) {
        try {
          const address = params.address as string
          const normalizedAddress = address.toLowerCase()
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
      } else {
        setProfile(null)
      }
    }

    fetchProfile()
  }, [mounted, isConnected, connectedAddress, pathname, params])

  if (!mounted) {
    return null
  }

  if (!isConnected || !connectedAddress) {
    return null
  }

  // Get addresses using helper functions
  const normalizedConnectedAddress = connectedAddress.toLowerCase()
  const currentProfileAddress = getCurrentProfileAddressFromRoute(pathname, params || {})

  // Dashboard href always uses connected wallet (never current profile)
  const dashboardHref = getConnectedDashboardHref(connectedAddress)

  // Public profile href uses current profile if available, otherwise connected wallet
  const profileAddressForView = currentProfileAddress || normalizedConnectedAddress
  const publicProfileHref = profileAddressForView ? getPublicProfileHref(profileAddressForView, profile?.slug) : null

  // Generate avatar URL using effigy.im
  const avatarUrl = `https://effigy.im/a/${normalizedConnectedAddress}.svg`

  // Get first 2-3 characters for fallback
  const fallbackText = connectedAddress.slice(2, 5).toUpperCase()

  const handleDashboard = () => {
    if (!isConnected || !connectedAddress) {
      toast.error('Connect your wallet to access your dashboard')
      return
    }
    // Always navigate to connected wallet dashboard (never current profile)
    if (dashboardHref) {
      router.push(dashboardHref)
    }
  }

  const handlePublicProfile = () => {
    if (publicProfileHref) {
      router.push(publicProfileHref)
    }
  }

  const handleCopyAddress = async () => {
    // Copy current profile address if on profile page, otherwise connected wallet
    const addressToCopy = currentProfileAddress || connectedAddress
    if (!addressToCopy) return

    try {
      await navigator.clipboard.writeText(addressToCopy)
      toast.success('Address copied')
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const handleShare = async () => {
    if (!publicProfileHref) {
      toast.error('Profile URL not available')
      return
    }

    // Add source=copy parameter for attribution
    const profileUrl = `${window.location.origin}${publicProfileHref}?source=copy`

    // Try Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Avalanche Profile',
          text: `Check out this Avalanche profile`,
          url: profileUrl,
        })
        return
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return
        }
        console.error('Share failed:', error)
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(profileUrl)
      toast.success('Profile link copied')
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const handleDisconnect = () => {
    disconnect()
    // Route to safe public page - use current profile if available, otherwise home
    if (currentProfileAddress) {
      router.push(`/p/${currentProfileAddress}`)
    } else {
      router.push('/')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
            {!imageError && (
              <AvatarImage
                src={avatarUrl}
                alt={formatAddress(connectedAddress)}
                onError={() => setImageError(true)}
              />
            )}
            {imageError && (
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                {fallbackText}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Wallet</p>
            <p className="text-xs leading-none text-muted-foreground font-mono">
              {formatAddress(connectedAddress)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDashboard}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePublicProfile} disabled={!publicProfileHref}>
          <User className="mr-2 h-4 w-4" />
          <span>Public Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy address</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare} disabled={!publicProfileHref}>
          <Share2 className="mr-2 h-4 w-4" />
          <span>Share profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setQrModalOpen(true)}>
          <QrCode className="mr-2 h-4 w-4" />
          <span>Show QR code</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* QR Code Modal for connected wallet */}
      {isConnected && connectedAddress && (
        <QRCodeModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          profile={{
            address: connectedAddress,
            slug: profile?.slug || null,
            displayName: profile?.displayName || null,
            avatarUrl: `https://effigy.im/a/${connectedAddress.toLowerCase()}.svg`,
          }}
        />
      )}
    </DropdownMenu>
  )
}
