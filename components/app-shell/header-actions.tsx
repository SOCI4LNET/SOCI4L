'use client'

import { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { formatAddress } from '@/lib/utils'
import { getConnectedDashboardHref, getPublicProfileHref } from '@/lib/routing'
import { useServerAuth } from '@/hooks/use-server-auth'

import { Copy, Share2, QrCode, LogOut, LayoutDashboard, User, Settings, Sparkles, Link2, BarChart2, Sun, Moon, Laptop, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, } from '@/components/ui/dropdown-menu'
import { QRCodeModal } from '@/components/qr/qr-code-modal'
import { WalletConnectButtons } from '@/components/wallet-connect-buttons'
import { NotificationsDropdown } from '@/components/topbar/notifications-dropdown'

export function HeaderActions() {
  const [mounted, setMounted] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [profile, setProfile] = useState<{ slug?: string | null; displayName?: string | null } | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const { setTheme, theme } = useTheme()
  const [isAdmin, setIsAdmin] = useState(false)

  // Wagmi hooks - will be safe once component mounts (client-side only)
  // These hooks internally check for browser APIs, but we guard usage with mounted state
  const { address: connectedAddress, isConnected } = useAccount()
  const { disconnect, disconnectAsync } = useDisconnect()
  const router = useRouter()
  const pathname = usePathname()
  const { ensureSession } = useServerAuth()

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

    // Admin check
    const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || '')
      .split(',')
      .map((addr) => addr.trim().toLowerCase())
      .filter(Boolean)
    setIsAdmin(connectedAddress ? ADMIN_ADDRESSES.includes(connectedAddress.toLowerCase()) : false)
  }, [mounted, isConnected, connectedAddress])

  // Handle wallet not connected - show Connect Wallet button
  if (!mounted || !isConnected || !connectedAddress) {
    return (
      <WalletConnectButtons
        variant="default"
        size="sm"
      />
    )
  }

  const normalizedConnectedAddress = connectedAddress.toLowerCase()

  // Dashboard href ALWAYS uses connected wallet (never current profile) - fixes routing bug
  const dashboardHref = getConnectedDashboardHref(connectedAddress)

  // Public profile href uses connected wallet (for avatar dropdown context)
  const publicProfileHref = normalizedConnectedAddress ? getPublicProfileHref(normalizedConnectedAddress, profile?.slug) : null

  // Generate avatar URL using effigy.im
  const avatarUrl = `https://effigy.im/a/${normalizedConnectedAddress}.svg`

  // Get first 2-3 characters for fallback
  const fallbackText = connectedAddress.slice(2, 5).toUpperCase()

  const handleCopyAddress = async () => {
    // Always copy connected wallet address (for avatar dropdown context)
    if (!connectedAddress) return

    try {
      await navigator.clipboard.writeText(connectedAddress)
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
      toast.error('Failed to copy')
    }
  }

  const handleDashboard = () => {
    if (!isConnected || !connectedAddress) {
      toast.error('Connect your wallet to access dashboard')
      return
    }
    if (dashboardHref) {
      router.push(dashboardHref)
    }
  }

  const handlePublicProfile = () => {
    if (publicProfileHref) {
      router.push(publicProfileHref)
    }
  }

  const handleSettings = () => {
    if (!isConnected || !connectedAddress) {
      toast.error('Connect your wallet to access settings')
      return
    }
    const dashboardHref = getConnectedDashboardHref(connectedAddress)
    if (dashboardHref) {
      router.push(`${dashboardHref}?tab=settings`)
    }
  }

  const handleBuilder = () => {
    if (!isConnected || !connectedAddress) {
      toast.error('Connect your wallet to access builder')
      return
    }
    const dashboardHref = getConnectedDashboardHref(connectedAddress)
    if (dashboardHref) {
      router.push(`${dashboardHref}?tab=builder`)
    }
  }

  const handleLinks = () => {
    if (!isConnected || !connectedAddress) {
      toast.error('Connect your wallet to access links')
      return
    }
    const dashboardHref = getConnectedDashboardHref(connectedAddress)
    if (dashboardHref) {
      router.push(`${dashboardHref}?tab=links`)
    }
  }

  const handleInsights = () => {
    if (!isConnected || !connectedAddress) {
      toast.error('Connect your wallet to access insights')
      return
    }
    const dashboardHref = getConnectedDashboardHref(connectedAddress)
    if (dashboardHref) {
      router.push(`${dashboardHref}?tab=insights`)
    }
  }

  const handleMasterConsole = async () => {
    if (!isAdmin) return
    const success = await ensureSession()
    if (success) {
      router.push('/master-console')
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectAsync()

      // Manually clear Wagmi storage to prevent auto-reconnect
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('wagmi.recentConnectorId')
        window.localStorage.removeItem('wagmi.store')
        window.localStorage.removeItem('wagmi.connected')
      }
    } catch (error) {
      console.error('Disconnect failed:', error)
      disconnect() // Fallback to regular disconnect
    }
    router.push('/')
  }

  return (
    <>
      <TooltipProvider>
        {/* Global Header Actions (Desktop) */}
        {!pathname?.startsWith('/master-console') && (
          <div className="hidden md:flex items-center gap-2 h-[38px] px-[10px] rounded-md border border-border bg-background text-foreground mr-1">
            <span className="text-sm font-mono mr-1">{formatAddress(connectedAddress, 4)}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 min-h-6 min-w-6 rounded-[6px] border border-border bg-muted/60 text-foreground hover:bg-muted"
                  onClick={handleCopyAddress}
                >
                  <Copy className="h-[14px] w-[14px]" strokeWidth={1} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy Address</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 min-h-6 min-w-6 rounded-[6px] border border-border bg-muted/60 text-foreground hover:bg-muted"
                  onClick={handleShare}
                  disabled={!publicProfileHref}
                >
                  <Share2 className="h-[14px] w-[14px]" strokeWidth={1} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share Profile</TooltipContent>
            </Tooltip>
          </div>
        )}

        {isConnected && connectedAddress && (
          <NotificationsDropdown address={connectedAddress} />
        )}

        {/* Avatar dropdown - all actions inside */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 min-h-8 min-w-8 rounded-full shrink-0">
              <Avatar className="h-8 w-8 min-h-8 min-w-8 shrink-0">
                {!imageError && (
                  <AvatarImage
                    src={avatarUrl}
                    alt={formatAddress(connectedAddress)}
                    onError={() => setImageError(true)}
                  />
                )}
                {imageError && (
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
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
                  {formatAddress(connectedAddress, 4)}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* My Account & Actions Sections */}
            {!pathname?.startsWith('/master-console') ? (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleDashboard}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={handleMasterConsole} className="text-primary focus:text-primary">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>Master Console</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handlePublicProfile} disabled={!publicProfileHref}>
                    <User className="mr-2 h-4 w-4" />
                    <span>View Profile</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Studio</DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleLinks}>
                    <Link2 className="mr-2 h-4 w-4" />
                    <span>Links</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBuilder}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Builder</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleInsights}>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    <span>Insights</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Appearance</DropdownMenuLabel>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="ml-2">Theme</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setTheme("light")}>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Light</span>
                        {theme === "light" && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("dark")}>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Dark</span>
                        {theme === "dark" && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("system")}>
                        <Laptop className="mr-2 h-4 w-4" />
                        <span>System</span>
                        {theme === "system" && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleCopyAddress}>
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Copy Address</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare} disabled={!publicProfileHref}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setQrModalOpen(true)}>
                    <QrCode className="mr-2 h-4 w-4" />
                    <span>QR Code</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) : (
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleCopyAddress}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Copy Address</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}

            <DropdownMenuSeparator />

            {/* Disconnect Section */}
            <DropdownMenuItem onClick={handleDisconnect} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>

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
