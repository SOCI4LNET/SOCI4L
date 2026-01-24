'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatAddress, isValidAddress } from '@/lib/utils'
import Link from 'next/link'
import { ExternalLink, Twitter, Linkedin, Github, Globe, MessageCircle, Send, Mail, QrCode, Link2, Activity, Copy, ArrowRight } from 'lucide-react'
import { ClaimProfileButton } from '@/components/claim-profile-button'
import { PublicProfileShareMenu } from '@/components/public-profile-share-menu'
import { FollowToggle, FollowStats } from '@/components/follow-toggle'
import { QRCodeModal } from '@/components/qr/qr-code-modal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { trackProfileView, trackLinkClick, getSourceFromUrl } from '@/lib/analytics'
import { type ProfileLink } from '@/lib/profile-links'
import {
  type ProfileLayoutConfig,
  type ProfileLayoutBlock,
  getDefaultProfileLayout,
  normalizeLayoutConfig,
} from '@/lib/profile-layout'
import {
  type ProfileAppearanceConfig,
  getDefaultAppearanceConfig,
  normalizeAppearanceConfig,
  getThemeContainerClasses,
  getThemeCardClasses,
  getThemeHeaderClasses,
  getThemeTextClasses,
} from '@/lib/profile-appearance'

interface PageProps {
  params: {
    id: string
  }
}

interface WalletData {
  address: string
  nativeBalance: string
  tokenBalances: Array<{
    contractAddress: string
    name: string
    symbol: string
    balance: string
    decimals: number
  }>
  nfts: Array<{
    contractAddress: string
    tokenId: string
    name?: string
    image?: string
  }>
  transactions: Array<{
    hash: string
    from: string
    to: string
    value: string
    timestamp: number
    blockNumber: number
  }>
  txCount: number
  firstSeen?: number
  lastSeen?: number
}

export default function ProfilePage({ params }: PageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [profileStatus, setProfileStatus] = useState<'UNCLAIMED' | 'CLAIMED+PUBLIC' | 'CLAIMED+PRIVATE'>('UNCLAIMED')
  const [profile, setProfile] = useState<{ 
    address: string
    slug: string | null
    displayName?: string | null
    bio?: string | null
    socialLinks?: Array<{ id?: string; platform?: string; type?: string; url: string; label?: string }> | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([])
  // useRef guard to prevent double tracking (React Strict Mode + hydration safe)
  // Stores the profile ID that was already tracked to detect profile changes
  const trackedProfileIdRef = useRef<string | null>(null)
  // Initialize as null to prevent rendering legacy layout on first paint
  // Will be set from API response or default after data loads
  const [layoutConfig, setLayoutConfig] = useState<ProfileLayoutConfig | null>(null)
  const [appearanceConfig, setAppearanceConfig] = useState<ProfileAppearanceConfig | null>(null)
  const linksBlockRef = useRef<HTMLDivElement>(null)

  const addressFromProfile = profile?.address && isValidAddress(profile.address)
    ? profile.address.toLowerCase()
    : null

  const addressFromParam =
    params.id.startsWith('0x') && isValidAddress(params.id) ? params.id.toLowerCase() : null

  const stableProfileId = addressFromProfile || addressFromParam || null

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Check if id is an address (starts with 0x) or a slug
        const isAddress = params.id.startsWith('0x') && isValidAddress(params.id)
        
        let response: Response
        // Add cache bust timestamp to ensure fresh data
        const cacheBust = Date.now()
        if (isAddress) {
          // Normalize address to lowercase for consistent API calls
          const normalizedAddress = params.id.toLowerCase()
          response = await fetch(`/api/wallet?address=${normalizedAddress}&_t=${cacheBust}`, {
            cache: 'no-store',
          })
        } else {
          response = await fetch(`/api/wallet?slug=${params.id}&_t=${cacheBust}`, {
            cache: 'no-store',
          })
        }

        const data = await response.json()
        console.log('[PublicProfile] API response data:', {
          hasLayout: !!data.layout,
          hasAppearance: !!data.appearance,
          layout: data.layout,
          appearance: data.appearance,
        })

        if (data.error) {
          if (response.status === 404 && !isAddress) {
            setError('Profile not found')
          } else {
            setError(data.error)
          }
          // Set default configs on error to prevent null state
          setLayoutConfig(getDefaultProfileLayout())
          setAppearanceConfig(getDefaultAppearanceConfig())
        } else {
          console.log('[PublicProfile] Wallet data loaded:', {
            hasTokenBalances: !!data.walletData?.tokenBalances,
            tokenBalancesCount: data.walletData?.tokenBalances?.length || 0,
            hasNfts: !!data.walletData?.nfts,
            nftsCount: data.walletData?.nfts?.length || 0,
            hasTransactions: !!data.walletData?.transactions,
            transactionsCount: data.walletData?.transactions?.length || 0,
          })
          setWalletData(data.walletData)
          setProfileStatus(data.profileStatus)
          if (data.profile) {
            setProfile({
              address: data.profile.address,
              slug: data.profile.slug,
              displayName: data.profile.displayName,
              bio: data.profile.bio,
              socialLinks: data.profile.socialLinks,
            })
          }
          // Load links from API response (Option A - preferred)
          if (data.links && Array.isArray(data.links)) {
            const enabledLinks = data.links
              .filter((link: any) => link.enabled)
              .sort((a: any, b: any) => {
                if (a.order !== b.order) {
                  return a.order - b.order
                }
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              })
              .map((link: any) => ({
                id: link.id,
                title: link.title || '',
                url: link.url,
                enabled: link.enabled,
                order: link.order || 0,
                createdAt: link.createdAt || new Date().toISOString(),
                updatedAt: link.updatedAt || new Date().toISOString(),
              }))
            setProfileLinks(enabledLinks)
          }

          // Load layout config from API response
          if (data.layout) {
            // Normalize layout config to ensure consistency
            const normalizedLayout = normalizeLayoutConfig(data.layout)
            console.log('[PublicProfile] Layout config loaded:', normalizedLayout)
            setLayoutConfig(normalizedLayout)
          } else {
            // Use default if no layout config (prevents null state)
            console.warn('[PublicProfile] No layout config in API response, using default')
            setLayoutConfig(getDefaultProfileLayout())
          }

          // Load appearance config from API response
          if (data.appearance) {
            const normalizedAppearance = normalizeAppearanceConfig(data.appearance)
            console.log('[PublicProfile] Appearance config loaded:', normalizedAppearance)
            setAppearanceConfig(normalizedAppearance)
          } else {
            // Use default if no appearance config (prevents null state)
            console.warn('[PublicProfile] No appearance config in API response, using default')
            setAppearanceConfig(getDefaultAppearanceConfig())
          }
        }
      } catch (err) {
        setError('Veri yüklenirken bir hata oluştu')
        console.error(err)
        // Set default configs on error to prevent null state
        setLayoutConfig(getDefaultProfileLayout())
        setAppearanceConfig(getDefaultAppearanceConfig())
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  // Layout config is loaded from /api/wallet response above

  // Track profile view (MVP - local analytics)
  // useRef guard prevents double tracking in React Strict Mode / hydration
  // Tracks per profile ID to handle slug -> address transitions
  useEffect(() => {
    // Guard: only track on client
    if (typeof window === 'undefined') return
    
    // Guard: need stable profile ID
    if (!stableProfileId) {
      // Reset guard if profile ID is not available yet
      trackedProfileIdRef.current = null
      return
    }
    
    // Guard: already tracked for this profile ID in this render cycle (React Strict Mode protection)
    if (trackedProfileIdRef.current === stableProfileId) {
      return
    }

    // Track view with source attribution from URL query params
    const source = getSourceFromUrl(searchParams)
    trackProfileView(stableProfileId, source)
    
    // Mark as tracked for this profile ID to prevent double invoke
    trackedProfileIdRef.current = stableProfileId
  }, [stableProfileId, searchParams])

  const getStatusBadge = () => {
    const baseClass = 'text-[11px] px-2 py-0 font-normal'
    switch (profileStatus) {
      case 'UNCLAIMED':
        return (
          <Badge variant="outline" className={baseClass}>
            Unclaimed
          </Badge>
        )
      case 'CLAIMED+PUBLIC':
        return (
          <Badge variant="secondary" className={baseClass}>
            Claimed
          </Badge>
        )
      case 'CLAIMED+PRIVATE':
        return (
          <Badge variant="secondary" className={baseClass}>
            Private
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className={baseClass}>
            Unclaimed
          </Badge>
        )
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-destructive">{error}</p>
          <Link href="/" className="text-muted-foreground hover:text-foreground mt-4 inline-block">
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    )
  }

  const handleClaimSuccess = async () => {
    // Get the resolved address (from profile or params)
    // Normalize to lowercase for consistency
    const resolvedAddress = profile?.address?.toLowerCase() || (params.id.startsWith('0x') ? params.id.toLowerCase() : null)
    
    if (resolvedAddress) {
      // Refresh router cache first
      router.refresh()
      
      // Refetch data to get updated profile status
      const normalizedAddress = resolvedAddress.toLowerCase()
      const response = await fetch(`/api/wallet?address=${normalizedAddress}`, {
        cache: 'no-store',
      })
      const data = await response.json()
      
      if (data.profile) {
        setProfile({
          address: data.profile.address,
          slug: data.profile.slug,
          displayName: data.profile.displayName,
          bio: data.profile.bio,
          socialLinks: data.profile.socialLinks,
        })
        // Update status based on fresh data
        if (data.profileStatus) {
          setProfileStatus(data.profileStatus)
        }
      }
    } else {
      // Fallback: reload page
      window.location.reload()
    }
  }

  const handleCopyAddress = async () => {
    if (!resolvedAddress) return
    try {
      await navigator.clipboard.writeText(resolvedAddress)
      toast.success('Address copied')
    } catch {
      toast.error('Copy failed')
    }
  }


  // Show private state if profile is CLAIMED and PRIVATE
  const isPrivate = profileStatus === 'CLAIMED+PRIVATE'
  const isClaimed = profileStatus === 'CLAIMED+PUBLIC' || profileStatus === 'CLAIMED+PRIVATE'
  const resolvedAddress = profile?.address || (params.id.startsWith('0x') ? params.id : null)
  const shortAddress = resolvedAddress
    ? formatAddress(resolvedAddress)
    : params.id.startsWith('0x')
    ? formatAddress(params.id)
    : params.id
  const primaryDisplayName = profile?.displayName || shortAddress

  const getSocialIcon = (platform: string) => {
    const normalizedPlatform = platform.toLowerCase()
    switch (normalizedPlatform) {
      case 'x':
        return <Twitter className="h-3.5 w-3.5" />
      case 'instagram':
        return <Globe className="h-3.5 w-3.5" />
      case 'youtube':
        return <Globe className="h-3.5 w-3.5" />
      case 'linkedin':
        return <Linkedin className="h-3.5 w-3.5" />
      case 'github':
        return <Github className="h-3.5 w-3.5" />
      case 'website':
        return <Globe className="h-3.5 w-3.5" />
      default:
        return <ExternalLink className="h-3.5 w-3.5" />
    }
  }

  const getSocialLabel = (link: { platform?: string; type?: string; url: string; label?: string }) => {
    if (link.label) return link.label
    const platform = link.platform || link.type || 'website'
    switch (platform.toLowerCase()) {
      case 'x':
        return 'X'
      case 'instagram':
        return 'Instagram'
      case 'youtube':
        return 'YouTube'
      case 'linkedin':
        return 'LinkedIn'
      case 'github':
        return 'GitHub'
      case 'website':
        return 'Website'
      default:
        return platform
    }
  }

  const getSocialUrl = (link: { platform?: string; type?: string; url: string; id?: string }) => {
    // Social links should go directly to their URL, not through redirect
    // The id field is for internal tracking, not for redirect routing
    return link.url
  }

  const enabledProfileLinks = profileLinks.filter((link) => link.enabled)

  // Use default configs if not loaded yet (for initial render calculations)
  const effectiveLayoutConfig = layoutConfig || getDefaultProfileLayout()
  const effectiveAppearanceConfig = appearanceConfig || getDefaultAppearanceConfig()

  // Get visible blocks sorted by grid position (row, then col)
  const visibleBlocks: ProfileLayoutBlock[] = effectiveLayoutConfig.blocks
    .filter((block) => block.enabled)
    .slice()
    .sort((a, b) => {
      const rowA = a.row ?? 0
      const rowB = b.row ?? 0
      if (rowA !== rowB) return rowA - rowB
      const colA = a.col ?? 0
      const colB = b.col ?? 0
      return colA - colB
    })
  
  // Row packing logic: Group blocks by row and determine computed span
  // If a row has only 1 block, render it as full-width regardless of stored span
  const blocksByRow = new Map<number, ProfileLayoutBlock[]>()
  for (const block of visibleBlocks) {
    const row = block.row ?? 0
    if (!blocksByRow.has(row)) {
      blocksByRow.set(row, [])
    }
    blocksByRow.get(row)!.push(block)
  }
  
  // Compute span for each block based on row packing
  const blocksWithComputedSpan = visibleBlocks.map((block) => {
    const row = block.row ?? 0
    const rowBlocks = blocksByRow.get(row) || []
    const blockCount = rowBlocks.length
    
    // Auto-span rule: if row has only 1 block, make it full-width
    const computedSpan = blockCount === 1 ? 'full' : (block.span || 'half')
    
    return {
      ...block,
      computedSpan,
    }
  })
  
  // Debug: Log visible blocks and appearance config (only if loaded)
  if (layoutConfig && appearanceConfig) {
    console.log('[PublicProfile] Visible blocks:', visibleBlocks)
    console.log('[PublicProfile] Appearance theme:', effectiveAppearanceConfig.theme)
  }

  const headerClasses = getThemeHeaderClasses(effectiveAppearanceConfig.theme)
  const titleClasses = getThemeTextClasses(effectiveAppearanceConfig.theme, 'title')
  const avatarSize = effectiveAppearanceConfig.theme === 'spotlight' ? 'h-16 w-16' : 'h-12 w-12'

  return (
    <div className="space-y-6">

      {loading ? (
        // Skeleton matching new 12-column grid layout structure
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
          <Card className="md:col-span-6 w-full">
            <CardHeader>
              <CardTitle>Links</CardTitle>
              <CardDescription>Loading links...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card className="md:col-span-6 w-full">
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Loading transactions...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card className="md:col-span-12 w-full">
            <CardHeader>
              <CardTitle>Assets</CardTitle>
              <CardDescription>Loading assets...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        </div>
      ) : isPrivate ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-lg font-semibold mb-2">This profile is private</p>
              <p className="text-muted-foreground">
                The owner has set this profile to private. Asset and activity details are not visible.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : walletData ? (
        <div className="space-y-6">
          {/* Profile Info Card - show for all profiles (claimed or unclaimed) */}
          {(isClaimed || !isPrivate) && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Left: Avatar + Name + Badge */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <Avatar className={avatarSize}>
                      {resolvedAddress ? (
                        <>
                          <AvatarImage
                            src={`https://effigy.im/a/${resolvedAddress.toLowerCase()}.svg`}
                            alt={primaryDisplayName}
                          />
                          <AvatarFallback className="text-xs">
                            {resolvedAddress.slice(2, 4).toUpperCase()}
                          </AvatarFallback>
                        </>
                      ) : (
                        <AvatarFallback className="text-xs">??</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <h1 className={`${titleClasses} font-semibold truncate`}>
                          {primaryDisplayName}
                        </h1>
                        {isClaimed && !isPrivate && getStatusBadge()}
                        {!isClaimed && getStatusBadge()}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono">{shortAddress}</span>
                          {resolvedAddress && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={handleCopyAddress}
                                    className="h-5 w-5"
                                    aria-label="Copy address"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Copy address</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[11px] px-2 py-0">
                          Avalanche
                        </Badge>
                        {resolvedAddress && isValidAddress(resolvedAddress) && (
                          <span className="flex items-center gap-1">
                            <FollowStats address={resolvedAddress} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Right: Actions (Follow, QR, Share, Claim) */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:justify-end">
                    {resolvedAddress && isValidAddress(resolvedAddress) && (
                      <FollowToggle address={resolvedAddress} />
                    )}
                    {resolvedAddress && isValidAddress(resolvedAddress) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => setQrModalOpen(true)}
                              aria-label="QR Code"
                              className="h-7 w-7"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>QR Code</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <PublicProfileShareMenu 
                      address={profile?.address || params.id} 
                      slug={profile?.slug}
                      onOpenQR={() => setQrModalOpen(true)}
                    />
                    {profileStatus === 'UNCLAIMED' && profile?.address && (
                      <ClaimProfileButton address={profile.address} onSuccess={handleClaimSuccess} />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground">{profile.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Grid layout - 12 columns on desktop, 1 column on mobile */}
          {/* Only render if layout config is loaded to prevent FOUC */}
          {layoutConfig && appearanceConfig ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
              {blocksWithComputedSpan.map((block) => {
                const variant = block.variant || 'compact'
                const computedSpan = block.computedSpan || 'half'
                // Full-span blocks: 12 cols, half-span blocks: 6 cols
                const gridColSpan = computedSpan === 'full' ? 'md:col-span-12' : 'md:col-span-6'

              if (block.key === 'links') {
                // Unified Link Hub: Merge social links and custom links into single system
                type UnifiedLink = {
                  id: string
                  title: string
                  url: string
                  category: string
                  type: 'social' | 'featured' | 'custom'
                  icon?: React.ReactNode
                  order: number
                }

                const allLinks: UnifiedLink[] = []

                // Add custom links (default to "Featured" category)
                enabledProfileLinks.forEach((link, index) => {
                  allLinks.push({
                    id: link.id,
                    title: link.title || link.url,
                    url: link.url,
                    category: 'Featured', // Default category for custom links
                    type: 'featured',
                    order: link.order || index,
                  })
                })

                // Add social links to "Socials" category
                if (profile?.socialLinks && profile.socialLinks.length > 0) {
                  profile.socialLinks.forEach((link, index) => {
                    allLinks.push({
                      id: link.id || `social-${link.url}`,
                      title: getSocialLabel(link),
                      url: getSocialUrl(link),
                      category: 'Socials',
                      type: 'social',
                      icon: getSocialIcon(link.platform || link.type || 'website'),
                      order: 1000 + index, // Social links come after featured
                    })
                  })
                }

                // Sort all links by order
                allLinks.sort((a, b) => a.order - b.order)

                // Group links by category
                const linksByCategory = new Map<string, UnifiedLink[]>()
                allLinks.forEach((link) => {
                  if (!linksByCategory.has(link.category)) {
                    linksByCategory.set(link.category, [])
                  }
                  linksByCategory.get(link.category)!.push(link)
                })

                // Sort categories: Featured first, then Socials, then others alphabetically
                const categoryOrder = ['Featured', 'Socials']
                const categories = Array.from(linksByCategory.keys()).sort((a, b) => {
                  const indexA = categoryOrder.indexOf(a)
                  const indexB = categoryOrder.indexOf(b)
                  if (indexA !== -1 && indexB !== -1) return indexA - indexB
                  if (indexA !== -1) return -1
                  if (indexB !== -1) return 1
                  return a.localeCompare(b)
                })
                const totalLinks = allLinks.length

                return (
                  <Card 
                    key="links" 
                    ref={linksBlockRef}
                    className={`${getThemeCardClasses(effectiveAppearanceConfig.theme, 'links')} ${gridColSpan} w-full`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className={getThemeTextClasses(effectiveAppearanceConfig.theme, 'title')}>
                            Links
                          </CardTitle>
                          <CardDescription>
                            Curated destinations (trackable)
                          </CardDescription>
                        </div>
                        {/* Optional stats placeholder */}
                        {totalLinks > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {totalLinks} {totalLinks === 1 ? 'link' : 'links'}
                            </p>
                            {/* Placeholder for future stats */}
                            {/* <p className="text-[10px] text-muted-foreground mt-0.5">
                              Views · Clicks (7d)
                            </p> */}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {totalLinks === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No public links enabled
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {categories.map((category) => {
                            const categoryLinks = linksByCategory.get(category) || []
                            return (
                              <div key={category} className="space-y-2">
                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  {category}
                                </h3>
                                <div className="space-y-2">
                                  {categoryLinks.map((link) => {
                                    const handleLinkClick = () => {
                                      if (stableProfileId && link.id) {
                                        // Links clicked from profile page always have source="profile"
                                        trackLinkClick(stableProfileId, link.id, 'profile')
                                      }
                                    }
                                    
                                    return (
                                    <a
                                      key={link.id}
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={handleLinkClick}
                                      className="group flex items-center justify-between rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs transition-colors hover:border-primary/50 hover:bg-primary/5"
                                    >
                                      <div className="flex min-w-0 items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/60 text-muted-foreground shrink-0">
                                          {link.icon || <Link2 className="h-3.5 w-3.5" />}
                                        </div>
                                        <div className="min-w-0 space-y-0.5">
                                          <p className="truncate text-sm font-medium text-foreground">
                                            {link.title}
                                          </p>
                                          <p className="truncate text-[11px] text-muted-foreground">
                                            {link.url}
                                          </p>
                                        </div>
                                      </div>
                                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                                    </a>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              }

              if (block.key === 'activity') {
                const showAmounts = variant !== 'hiddenAmounts'
                const isCompact = variant === 'compact'
                const isFull = variant === 'full'
                const maxItems = isFull ? 20 : (isCompact ? 5 : 10)

                return (
                  <Card key="activity" className={`${getThemeCardClasses(effectiveAppearanceConfig.theme, 'activity')} ${gridColSpan} w-full`}>
                    <CardHeader>
                      <CardTitle className={getThemeTextClasses(effectiveAppearanceConfig.theme, 'title')}>Activity</CardTitle>
                      <CardDescription className={getThemeTextClasses(effectiveAppearanceConfig.theme, 'small')}>Recent transactions</CardDescription>
                    </CardHeader>
                    <CardContent className={isFull ? 'space-y-4' : 'space-y-3'}>
                      {walletData.transactions && walletData.transactions.length > 0 ? (
                        walletData.transactions.slice(0, maxItems).map((tx, idx) => (
                          <div 
                            key={idx} 
                            className={`${isFull ? 'space-y-2 p-3 rounded-md border bg-muted/30' : 'space-y-1 border-b pb-2'} last:border-0`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                {isFull && (
                                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 shrink-0">
                                    <Activity className="h-3 w-3 text-primary" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className={`font-mono ${isFull ? 'text-sm' : 'text-xs'} truncate`}>
                                    {isFull ? tx.hash : formatAddress(tx.hash)}
                                  </p>
                                  {isFull && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Block #{tx.blockNumber}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <a
                                href={`https://snowtrace.io/tx/${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground shrink-0"
                              >
                                <ExternalLink className={isFull ? 'h-4 w-4' : 'h-3 w-3'} />
                              </a>
                            </div>
                            {isFull && (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-muted-foreground">From</p>
                                  <p className="font-mono truncate">{formatAddress(tx.from)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">To</p>
                                  <p className="font-mono truncate">{formatAddress(tx.to)}</p>
                                </div>
                              </div>
                            )}
                            {showAmounts && (
                              <p className={`${isFull ? 'text-sm font-semibold' : 'text-xs'} text-muted-foreground`}>
                                {parseFloat(tx.value).toFixed(4)} AVAX
                              </p>
                            )}
                            <p className={`${isFull ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                              {new Date(tx.timestamp * 1000).toLocaleString('tr-TR')}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No recent transactions</p>
                      )}
                    </CardContent>
                  </Card>
                )
              }

              if (block.key === 'assets') {
                const showAmounts = variant !== 'hiddenAmounts'
                const isCompact = variant === 'compact'
                const isFull = variant === 'full'
                // Full variant shows more items, compact shows fewer
                const maxItems = isFull ? 20 : (isCompact ? 5 : 10)

                return (
                  <Card key="assets" className={`${getThemeCardClasses(effectiveAppearanceConfig.theme, 'assets')} ${gridColSpan} w-full`}>
                    <CardHeader>
                      <CardTitle className={getThemeTextClasses(effectiveAppearanceConfig.theme, 'title')}>Assets</CardTitle>
                      <CardDescription className={getThemeTextClasses(effectiveAppearanceConfig.theme, 'small')}>Tokens and NFTs</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Tokens</p>
                        {walletData.tokenBalances && walletData.tokenBalances.length > 0 ? (
                          walletData.tokenBalances.slice(0, maxItems).map((token, idx) => (
                            <div key={idx} className="flex justify-between items-center mb-2">
                              <div>
                                <p className="text-sm font-medium">{token.symbol}</p>
                                <p className="text-xs text-muted-foreground">{token.name}</p>
                              </div>
                              {showAmounts && (
                                <p className="text-sm font-mono">
                                  {parseFloat(token.balance).toFixed(4)}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">No tokens found</p>
                        )}
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">NFTs</p>
                        {walletData.nfts && walletData.nfts.length > 0 ? (
                          walletData.nfts.slice(0, maxItems).map((nft, idx) => (
                            <div key={idx} className="flex justify-between items-center mb-2">
                              <div>
                                <p className="text-sm font-medium">
                                  {nft.name || 'Unnamed NFT'}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {formatAddress(nft.contractAddress)} #{nft.tokenId}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">No NFTs found</p>
                        )}
                      </div>
                      {walletData.address && (
                        <div className="pt-3 border-t">
                          <Button variant="outline" size="sm" asChild className="w-full">
                            <a
                              href={`https://snowtrace.io/address/${walletData.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View all assets on Snowtrace
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              }

              // Summary block is deprecated but kept for migration compatibility
              if (block.key === 'summary') {
                return null
              }

              return null
            })}
            </div>
          ) : null}
        </div>
      ) : null}
      
      {/* QR Code Modal for current profile */}
      {resolvedAddress && isValidAddress(resolvedAddress) && (
        <QRCodeModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          profile={{
            address: resolvedAddress,
            slug: profile?.slug || null,
            displayName: profile?.displayName || null,
            avatarUrl: `https://effigy.im/a/${resolvedAddress}.svg`,
          }}
        />
      )}
    </div>
  )
}
