'use client'

import { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useRouter, useParams, usePathname } from 'next/navigation'
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
import { formatAddress } from '@/lib/utils'
import { 
  getConnectedDashboardHref, 
  getCurrentProfileAddressFromRoute,
  getPublicProfileHref 
} from '@/lib/routing'
import { LayoutDashboard, User, Copy, LogOut, Share2, Settings, Users, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeModal } from '@/components/qr/qr-code-modal'

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

  // My Account actions (always use connected wallet)
  const handleDashboard = () => {
    if (!isConnected || !connectedAddress) {
      toast.error('Connect your wallet to access your dashboard')
      return
    }
    if (dashboardHref) {
      router.push(dashboardHref)
    }
  }

  const handleSettings = () => {
    if (!isConnected || !connectedAddress) {
      toast.error('Connect your wallet to access your dashboard')
      return
    }
    if (dashboardHref) {
      router.push(`${dashboardHref}?tab=settings`)
    }
  }

  const handleSocial = () => {
    if (!isConnected || !connectedAddress) {
      toast.error('Connect your wallet to access your dashboard')
      return
    }
    if (dashboardHref) {
      router.push(`${dashboardHref}?tab=social`)
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

  // Current Profile actions (use current profile from route)
  const handleViewPublicProfile = () => {
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
      toast.error('Copy failed')
    }
  }

  const handleShareProfile = async () => {
    if (!publicProfileHref) return

    const profileUrl = `${window.location.origin}${publicProfileHref}`

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
        // User cancelled or share failed, fall back to clipboard
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error)
        }
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(profileUrl)
      toast.success('Profile link copied')
    } catch (error) {
      toast.error('Copy failed')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="rounded-full">
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
        
        {/* My Account Group - Always uses connected wallet */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            My Account
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={handleDashboard}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSettings}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSocial}>
            <Users className="mr-2 h-4 w-4" />
            <span>Social</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setQrModalOpen(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            <span>My QR Code</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Current Profile Group - Uses current profile from route */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Current Profile
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={handleViewPublicProfile} disabled={!publicProfileHref}>
            <User className="mr-2 h-4 w-4" />
            <span>View Public Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyAddress}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy Address</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareProfile} disabled={!publicProfileHref}>
            <Share2 className="mr-2 h-4 w-4" />
            <span>Share Profile</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
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
