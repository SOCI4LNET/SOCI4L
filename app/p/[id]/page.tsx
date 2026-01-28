'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatAddress, isValidAddress } from '@/lib/utils'
import { getPublicProfileHref } from '@/lib/routing'
import Link from 'next/link'
import { ExternalLink, Linkedin, Github, Globe, MessageCircle, Send, Mail, QrCode, Link2, Activity, Copy, ArrowRight, Eye, Share2, Instagram, Youtube, Sparkles, ShieldAlert } from 'lucide-react'
import { XIcon } from '@/components/icons/x-icon'
import { ClaimProfileButton } from '@/components/claim-profile-button'
import { FollowToggle, FollowStats } from '@/components/follow-toggle'
import { QRCodeModal } from '@/components/qr/qr-code-modal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { trackProfileView, getSourceFromUrl, getProfileViewCount } from '@/lib/analytics'
import { type ProfileLink } from '@/lib/profile-links'
import {
  type ProfileLayoutConfig,
  type ProfileLayoutBlock,
  type LayoutRow,
  type SectionId,
  type ProfileBlockKey,
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
  const { address: connectedAddress } = useAccount()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [profileStatus, setProfileStatus] = useState<'UNCLAIMED' | 'CLAIMED+PUBLIC' | 'CLAIMED+PRIVATE'>('UNCLAIMED')
  const [profile, setProfile] = useState<{
    address: string
    slug: string | null
    displayName?: string | null
    bio?: string | null
    isBanned?: boolean
    socialLinks?: Array<{ id?: string; platform?: string; type?: string; url: string; label?: string }> | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([])
  const [linkCategories, setLinkCategories] = useState<Array<{ id: string; name: string; slug: string; description: string | null; order: number; isVisible?: boolean }>>([])
  const [score, setScore] = useState<{ total: number; tier: string; tierLabel: string } | null>(null)
  // useRef guard to prevent double tracking (React Strict Mode + hydration safe)
  // Stores the profile ID that was already tracked to detect profile changes
  const trackedProfileIdRef = useRef<string | null>(null)
  // Initialize with defaults to prevent FOUC (Flash of Unstyled Content)
  // Will be updated from API response after data loads
  const [layoutConfig, setLayoutConfig] = useState<ProfileLayoutConfig>(() => getDefaultProfileLayout())
  const [appearanceConfig, setAppearanceConfig] = useState<ProfileAppearanceConfig>(() => getDefaultAppearanceConfig())
  const linksBlockRef = useRef<HTMLDivElement>(null)
  const [viewCount, setViewCount] = useState<number | null>(null)

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
        // Add cache bust timestamp to ensure fresh data (especially after Builder changes)
        // Use both timestamp and random to prevent aggressive caching
        const cacheBust = `${Date.now()}-${Math.random().toString(36).substring(7)}`
        if (isAddress) {
          // Normalize address to lowercase for consistent API calls
          const normalizedAddress = params.id.toLowerCase()
          response = await fetch(`/api/wallet?address=${normalizedAddress}&_t=${cacheBust}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          })
        } else {
          response = await fetch(`/api/wallet?slug=${params.id}&_t=${cacheBust}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
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
              isBanned: data.profile.isBanned,
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
                categoryId: link.categoryId || null,
                order: link.order || 0,
                createdAt: link.createdAt || new Date().toISOString(),
                updatedAt: link.updatedAt || new Date().toISOString(),
              }))
            setProfileLinks(enabledLinks)
          }

          // Load categories from API response
          if (data.categories && Array.isArray(data.categories)) {
            setLinkCategories(data.categories.map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              description: cat.description || null,
              order: cat.order || 0,
              isVisible: cat.isVisible ?? true, // Default to true if not provided
            })))
          } else {
            setLinkCategories([])
          }

          // Load layout config from API response
          if (data.layout) {
            // Normalize layout config to ensure consistency
            const normalizedLayout = normalizeLayoutConfig(data.layout)
            console.log('[PublicProfile] Layout config loaded:', normalizedLayout)
            setLayoutConfig(normalizedLayout)
          } else {
            // Use default if no layout config (already initialized with default, but update for consistency)
            console.warn('[PublicProfile] No layout config in API response, using default')
            setLayoutConfig(getDefaultProfileLayout())
          }

          // Load appearance config from API response
          if (data.appearance) {
            const normalizedAppearance = normalizeAppearanceConfig(data.appearance)
            console.log('[PublicProfile] Appearance config loaded:', normalizedAppearance)
            setAppearanceConfig(normalizedAppearance)
          } else {
            // Use default if no appearance config (already initialized with default, but update for consistency)
            console.warn('[PublicProfile] No appearance config in API response, using default')
            setAppearanceConfig(getDefaultAppearanceConfig())
          }

          // Fetch score for this profile
          if (data.profile?.address || data.walletData?.address) {
            const scoreAddress = data.profile?.address || data.walletData?.address
            try {
              const scoreResponse = await fetch(`/api/profile/${scoreAddress}/score`)
              if (scoreResponse.ok) {
                const scoreData = await scoreResponse.json()
                setScore({
                  total: scoreData.score,
                  tier: scoreData.tier,
                  tierLabel: scoreData.tierLabel,
                })
              }
            } catch (scoreError) {
              console.error('[PublicProfile] Failed to fetch score:', scoreError)
            }
          }
        }
      } catch (err) {
        setError('An error occurred while loading data')
        console.error(err)
        // Configs already initialized with defaults, no need to set again
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
  // Ignore owner self-views (privacy-first: owner viewing their own profile doesn't count)
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

    // Guard: ignore owner self-views (privacy-first: owner viewing their own profile doesn't count)
    if (connectedAddress && stableProfileId) {
      const normalizedConnected = connectedAddress.toLowerCase()
      const normalizedProfileId = stableProfileId.toLowerCase()
      if (normalizedConnected === normalizedProfileId) {
        // Owner viewing their own profile - don't track
        return
      }
    }

    // Track view with source attribution from URL query params
    const source = getSourceFromUrl(searchParams)
    trackProfileView(stableProfileId, source)

    // Mark as tracked for this profile ID to prevent double invoke
    trackedProfileIdRef.current = stableProfileId
  }, [stableProfileId, searchParams, connectedAddress])

  // Load view count (7 days) for display
  useEffect(() => {
    if (!stableProfileId || typeof window === 'undefined') {
      setViewCount(null)
      return
    }

    // Get view count for last 7 days
    const count = getProfileViewCount(stableProfileId, 7)
    setViewCount(count)
  }, [stableProfileId])

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
            ← Back to Home
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
      toast.error('Failed to copy')
    }
  }

  const handleCopyProfileLink = async () => {
    if (!resolvedAddress) return
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const profilePath = getPublicProfileHref(resolvedAddress, profile?.slug)
      const profileUrl = `${baseUrl}${profilePath}`
      await navigator.clipboard.writeText(profileUrl)
      toast.success('Profile link copied')
    } catch {
      toast.error('Failed to copy')
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
        return <XIcon className="h-3.5 w-3.5" />
      case 'instagram':
        return <Instagram className="h-3.5 w-3.5" />
      case 'youtube':
        return <Youtube className="h-3.5 w-3.5" />
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

  // Configs are always initialized with defaults, so no need for fallback
  const effectiveLayoutConfig = layoutConfig
  const effectiveAppearanceConfig = appearanceConfig

  // Use row-based layout if available, otherwise fall back to grid-based
  const useRowLayout = effectiveLayoutConfig.rows && effectiveLayoutConfig.rows.length > 0
  const layoutRows: LayoutRow[] = useRowLayout
    ? effectiveLayoutConfig.rows!
    : []

  // Create block map for quick lookup
  const blockMap = new Map<ProfileBlockKey, ProfileLayoutBlock>()
  for (const block of effectiveLayoutConfig.blocks) {
    blockMap.set(block.key, block)
  }

  // Get visible blocks sorted by grid position (row, then col) - for backward compatibility
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
                        {isClaimed && !isPrivate && !profile?.isBanned && getStatusBadge()}
                        {!isClaimed && !profile?.isBanned && getStatusBadge()}
                        {profile?.isBanned && (
                          <Badge variant="destructive" className="text-[11px] px-2 py-0 font-normal flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" />
                            BANNED
                          </Badge>
                        )}
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
                                    size="icon"
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
                        {resolvedAddress && isValidAddress(resolvedAddress) && !profile?.isBanned && (
                          <span className="flex items-center gap-1">
                            <FollowStats address={resolvedAddress} />
                          </span>
                        )}
                        {score && !profile?.isBanned && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`
                                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-default
                                    text-xs font-semibold transition-all
                                    ${score.tier === 'legendary'
                                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                                      : score.tier === 'elite'
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20'
                                        : score.tier === 'established'
                                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20'
                                          : score.tier === 'rising'
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm'
                                            : score.tier === 'newcomer'
                                              ? 'bg-gradient-to-r from-slate-500 to-zinc-500 text-white'
                                              : 'bg-muted text-muted-foreground'
                                    }
                                  `}
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  <span>{score.total}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="text-center">
                                <p className="font-semibold">{score.tierLabel}</p>
                                <p className="text-xs text-muted-foreground">SOCI4L Score</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {resolvedAddress && isValidAddress(resolvedAddress) && !profile?.isBanned && (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Eye className="h-3.5 w-3.5" />
                            <span className="font-medium">Views</span>
                            {viewCount !== null ? (
                              <span className="font-semibold text-foreground">{viewCount}</span>
                            ) : (
                              <Skeleton className="h-3.5 w-6" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Right: Actions (Follow, Share, Claim) */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:justify-end">
                    {resolvedAddress && isValidAddress(resolvedAddress) && !profile?.isBanned && (
                      <FollowToggle address={resolvedAddress} />
                    )}
                    {resolvedAddress && isValidAddress(resolvedAddress) && !profile?.isBanned && (
                      <DropdownMenu>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-8"
                                >
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Share profile
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Share profile</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleCopyProfileLink}>
                            <Copy className="mr-2 h-4 w-4" />
                            <span>Copy profile link</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                            const profilePath = getPublicProfileHref(resolvedAddress, profile?.slug)
                            const profileUrl = `${baseUrl}${profilePath}`
                            const isOwnProfile = connectedAddress && resolvedAddress && resolvedAddress.toLowerCase() === connectedAddress.toLowerCase()
                            let shareText: string
                            if (isOwnProfile) {
                              shareText = 'Just claimed my SOCI4L profile on Avalanche.\n\nTrack my on-chain identity and links in one place.\n\n' + profileUrl
                            } else {
                              const profileName = profile?.displayName || formatAddress(resolvedAddress, 4)
                              shareText = `Check out this SOCI4L profile on Avalanche: ${profileName}\n\nTrack on-chain identity and links in one place.\n\n` + profileUrl
                            }
                            const text = encodeURIComponent(shareText)
                            window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer')
                          }}>
                            <XIcon className="mr-2 h-4 w-4" />
                            <span>Share on X</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setQrModalOpen(true)}>
                            <QrCode className="mr-2 h-4 w-4" />
                            <span>Show QR code</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {resolvedAddress && isValidAddress(resolvedAddress) && !profile?.isBanned && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCopyProfileLink}
                              aria-label="Copy profile link"
                              className="h-7 w-7"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy profile link</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {profileStatus === 'UNCLAIMED' && profile?.address && !profile?.isBanned && (
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
                {/* Social Links Icons */}
                {profile?.socialLinks && profile.socialLinks.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {profile.socialLinks.map((link) => {
                      const platform = link.platform || link.type || 'website'
                      return (
                        <TooltipProvider key={link.id || link.url}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center h-9 w-9 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                              >
                                {getSocialIcon(platform)}
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{getSocialLabel(link)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Row-based layout - supports single and double rows */}
          {/* Configs are always initialized with defaults, so safe to render immediately */}
          {!profile?.isBanned && useRowLayout ? (
            // Row-based layout
            <div className="space-y-6 w-full">
              {layoutRows.map((row) => {
                // Helper function to render a block by sectionId
                const renderBlockBySectionId = (sectionId: SectionId | null, colSpan: string) => {
                  if (!sectionId) return null
                  const block = blockMap.get(sectionId)
                  if (!block || !block.enabled) return null
                  const variant = block.variant || 'compact'

                  // Determine grid column span based on row type
                  const gridColSpan = colSpan === 'full' ? 'md:col-span-12' : 'md:col-span-6'

                  if (sectionId === 'links') {
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

                    // Create category map for quick lookup
                    const categoryMap = new Map<string, { id: string; name: string; order: number }>()
                    linkCategories.forEach((cat) => {
                      categoryMap.set(cat.id, { id: cat.id, name: cat.name, order: cat.order })
                    })

                    // Find default category (usually "General")
                    const defaultCategory = linkCategories.find(cat => cat.slug === 'general') || linkCategories[0]
                    const defaultCategoryName = defaultCategory?.name || 'Links'

                    // Add custom profile links with their categories
                    // IMPORTANT: Sort by categoryId first, then by link.order within each category
                    enabledProfileLinks.forEach((link, index) => {
                      // Links without category go to "Uncategorized"
                      const category = link.categoryId && categoryMap.has(link.categoryId)
                        ? categoryMap.get(link.categoryId)!.name
                        : 'Uncategorized'
                      allLinks.push({
                        id: link.id,
                        title: link.title || link.url,
                        url: link.url,
                        category,
                        type: 'featured',
                        order: (link as any).order ?? index, // Use explicit order from database
                      })
                    })

                    // Add social links to "Socials" category (keep as special category)
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

                    // Group links by category FIRST (before sorting)
                    const linksByCategory = new Map<string, UnifiedLink[]>()
                    allLinks.forEach((link) => {
                      if (!linksByCategory.has(link.category)) {
                        linksByCategory.set(link.category, [])
                      }
                      linksByCategory.get(link.category)!.push(link)
                    })

                    // Sort links WITHIN each category by order (deterministic ordering)
                    linksByCategory.forEach((links, categoryName) => {
                      links.sort((a, b) => {
                        // Primary sort: order field
                        if (a.order !== b.order) {
                          return a.order - b.order
                        }
                        // Fallback: sort by id for stability
                        return a.id.localeCompare(b.id)
                      })
                    })

                    // Sort categories: Use category order from database (STRICT ordering by category.order)
                    // Build category order map from database categories
                    const categoryOrderMap = new Map<string, number>()
                    linkCategories.forEach((cat) => {
                      categoryOrderMap.set(cat.name, cat.order ?? 0) // Use explicit order from database
                    })

                    const categories = Array.from(linksByCategory.keys())
                      .filter(cat => {
                        // Only show categories that have links
                        const categoryLinks = linksByCategory.get(cat) || []
                        if (categoryLinks.length === 0) return false

                        // "Uncategorized" and "Socials" are always visible (they're virtual categories)
                        if (cat === 'Uncategorized' || cat === 'Socials') return true

                        // Check visibility for database categories
                        const categoryData = linkCategories.find(c => c.name === cat)
                        // If category exists in database, check visibility. If not found, show it (might be a new category)
                        if (categoryData) {
                          return categoryData.isVisible !== false // Default to true if undefined
                        }

                        // If category not found in database, show it (might be a legacy category)
                        return true
                      })
                      .sort((a, b) => {
                        // Deterministic ordering: Uncategorized always comes last
                        if (a === 'Uncategorized') return 1
                        if (b === 'Uncategorized') return -1
                        // Socials comes before Uncategorized but after all database categories
                        if (a === 'Socials') {
                          // Socials should come after all database categories (order >= 1000)
                          return 1
                        }
                        if (b === 'Socials') {
                          return -1
                        }

                        // For database categories: use strict order from database
                        const orderA = categoryOrderMap.get(a) ?? 999
                        const orderB = categoryOrderMap.get(b) ?? 999
                        if (orderA !== orderB) {
                          return orderA - orderB // Strict ordering by category.order
                        }
                        // If order is same, sort alphabetically for stability
                        return a.localeCompare(b)
                      })

                    const totalLinks = allLinks.length

                    // Show category headers if more than one category, or if the only category is not "Uncategorized"
                    const shouldShowCategoryHeaders = categories.length > 1 || (categories.length === 1 && categories[0] !== 'Uncategorized')

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
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <Link2 className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">
                                This profile hasn&apos;t shared any links yet.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {categories.map((category) => {
                                const categoryLinks = linksByCategory.get(category) || []
                                const categoryData = linkCategories.find(cat => cat.name === category)
                                return (
                                  <div key={category} className="space-y-2">
                                    {shouldShowCategoryHeaders && (
                                      <>
                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                          {category}
                                        </h3>
                                        {categoryData?.description && (
                                          <p className="text-xs text-muted-foreground">{categoryData.description}</p>
                                        )}
                                      </>
                                    )}
                                    <div className="space-y-2">
                                      {categoryLinks.map((link) => {
                                        // Use redirect endpoint for tracking
                                        // This ensures clicks are tracked even if user right-clicks or opens in new tab
                                        const redirectUrl = `/r/${link.id}?source=profile`

                                        return (
                                          <a
                                            key={link.id}
                                            href={redirectUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
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
                                                <p className="truncate text-[11px] text-muted-foreground flex items-center gap-1.5">
                                                  {link.url}
                                                  {link.url.startsWith('http://') && (
                                                    <TooltipProvider>
                                                      <Tooltip>
                                                        <TooltipTrigger>
                                                          <ShieldAlert className="h-3 w-3 text-red-500/80 hover:text-red-500 transition-colors" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                          <p>Insecure connection (HTTP)</p>
                                                        </TooltipContent>
                                                      </Tooltip>
                                                    </TooltipProvider>
                                                  )}
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

                  if (sectionId === 'activity') {
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
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                              <Activity className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">
                                No recent transactions
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  }

                  if (sectionId === 'assets') {
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
                            {/* Native AVAX Balance */}
                            {walletData.nativeBalance && parseFloat(walletData.nativeBalance) > 0 && (
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <p className="text-sm font-medium">AVAX</p>
                                  <p className="text-xs text-muted-foreground">Avalanche</p>
                                </div>
                                {showAmounts && (
                                  <p className="text-sm font-mono">
                                    {parseFloat(walletData.nativeBalance).toFixed(4)}
                                  </p>
                                )}
                              </div>
                            )}
                            {/* ERC-20 Tokens */}
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
                              !walletData.nativeBalance || parseFloat(walletData.nativeBalance) === 0 ? (
                                <p className="text-xs text-muted-foreground">—</p>
                              ) : null
                            )}
                          </div>
                          <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground mb-2">NFTs</p>
                            {walletData.nfts && walletData.nfts.length > 0 ? (
                              walletData.nfts.slice(0, maxItems).map((nft, idx) => (
                                <div key={idx} className="flex items-center gap-3 mb-2">
                                  {nft.image ? (
                                    <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={nft.image}
                                        alt={nft.name || 'NFT'}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none'
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted">
                                      <span className="text-xs text-muted-foreground">#</span>
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                      {nft.name || 'Unnamed NFT'}
                                    </p>
                                    <p className="text-xs text-muted-foreground font-mono truncate">
                                      {formatAddress(nft.contractAddress)} #{nft.tokenId}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground">—</p>
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

                  // Summary block is deprecated
                  if (sectionId === 'summary') {
                    return null
                  }

                  return null
                }

                // Render row based on type
                if (row.type === 'single') {
                  return (
                    <div key={row.id} className="w-full">
                      {renderBlockBySectionId(row.left, 'full')}
                    </div>
                  )
                } else {
                  return (
                    <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
                      {renderBlockBySectionId(row.left, 'half')}
                      {renderBlockBySectionId(row.right, 'half')}
                    </div>
                  )
                }
              })}
            </div>
          ) : (
            // Fallback to grid-based layout
            !profile?.isBanned && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
                {blocksWithComputedSpan.map((block) => {
                  const variant = block.variant || 'compact'
                  const computedSpan = block.computedSpan || 'half'
                  const gridColSpan = computedSpan === 'full' ? 'md:col-span-12' : 'md:col-span-6'

                  if (block.key === 'links') {
                    // Links block rendering - same as row-based
                    return null // Will be implemented with full block rendering
                  }

                  if (block.key === 'activity') {
                    return null // Will be implemented with full block rendering
                  }

                  if (block.key === 'assets') {
                    return null // Will be implemented with full block rendering
                  }

                  return null
                })}
              </div>
            )
          )}
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
