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
import { ExternalLink, Linkedin, Github, Globe, MessageCircle, Send, Mail, QrCode, Link2, Activity, Copy, ArrowRight, Heart, Eye, Share2, Instagram, Youtube, Sparkles, ShieldAlert, Layers, UserX, CheckCircle, MoreVertical, Ban } from 'lucide-react'
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import SiteFooter from "@/components/app-shell/site-footer"
import { toast } from 'sonner'
import { trackProfileView, trackLinkClick, getSourceFromUrl, getProfileViewCount } from '@/lib/analytics'
import { type ProfileLink } from '@/lib/profile-links'
import { DonateModal } from '@/components/donate/donate-modal'
import { useDonate } from '@/hooks/use-donate'
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
  getThemeLinkItemClasses,
} from '@/lib/profile-appearance'
import { getAvatarUrl } from '@/lib/avatar'


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

interface CooldownInfo {
  slug: string
  releasedAt: string
  cooldownEndsAt: string
  previousOwner: string
}

export default function ProfilePage({ params }: PageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address: connectedAddress, status, isReconnecting } = useAccount()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [profileStatus, setProfileStatus] = useState<'UNCLAIMED' | 'CLAIMED+PUBLIC' | 'CLAIMED+PRIVATE' | 'COOLDOWN'>('UNCLAIMED')
  const [cooldownInfo, setCooldownInfo] = useState<CooldownInfo | null>(null)

  const [profile, setProfile] = useState<{
    address: string
    slug: string | null
    displayName?: string | null
    bio?: string | null
    role?: string | null
    primaryRole?: string | null
    secondaryRoles?: string[]
    statusMessage?: string | null
    isBanned?: boolean
    isVerified?: boolean
    socialLinks?: Array<{ id?: string; platform?: string; type?: string; url: string; label?: string; verified?: boolean; enabled?: boolean }> | null
    premiumExpiresAt?: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNotFound, setIsNotFound] = useState(false)
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
  const [isBlockedByViewer, setIsBlockedByViewer] = useState(false)
  const [donateModalOpen, setDonateModalOpen] = useState(false)
  const { donate, isPending: isDonating } = useDonate()

  // ... (keep existing code)

  const handleBlock = async () => {
    if (!profile?.address) return
    try {
      const response = await fetch(`/api/profile/${profile.address.toLowerCase()}/block`, {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        if (data.blocked) {
          setIsBlockedByViewer(true)
          toast.success('User blocked')
          router.refresh()
        } else {
          setIsBlockedByViewer(false)
          toast.success('User unblocked')
          router.refresh()
        }
      } else {
        toast.error('Failed to toggle block')
      }
    } catch (e) {
      toast.error('Failed to toggle block')
    }
  }

  const handleUnblock = handleBlock // Reuse logic since API toggles

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
        // Dynamically import Logger to avoid server-side issues if any
        const { Logger } = await import('@/lib/logger')
        Logger.info('[PublicProfile] API response data:', {
          hasLayout: !!data.layout,
          hasAppearance: !!data.appearance,
          layout: data.layout,
          appearance: data.appearance,
          profile: data.profile, // Explicitly log profile data
          profileStatus: data.profileStatus
        })

        if (data.error && !data.profileStatus) {
          // Need to check for cooldown handling in API response even if error present?
          // API returns success JSON with profileStatus='COOLDOWN' if cooldown found, not error.
          if (response.status === 404 && !isAddress) {
            setIsNotFound(true)
            setLoading(false)
            return
          } else {
            setError(data.error)
          }
          // Set default configs on error to prevent null state
          setLayoutConfig(getDefaultProfileLayout())
          setAppearanceConfig(getDefaultAppearanceConfig())
        } else {
          Logger.info('[PublicProfile] Wallet data loaded:', {
            hasTokenBalances: !!data.walletData?.tokenBalances,
            tokenBalancesCount: data.walletData?.tokenBalances?.length || 0,
            hasNfts: !!data.walletData?.nfts,
            nftsCount: data.walletData?.nfts?.length || 0,
            hasTransactions: !!data.walletData?.transactions,
            transactionsCount: data.walletData?.transactions?.length || 0,
          })
          setWalletData(data.walletData)
          setProfileStatus(data.profileStatus)

          if (data.cooldown) {
            setCooldownInfo(data.cooldown)
          }

          if (data.score) {
            setScore(data.score)
          }
          if (data.profile) {
            setProfile({
              address: data.profile.address,
              slug: data.profile.slug,
              displayName: data.profile.displayName,
              bio: data.profile.bio,
              role: data.profile.role,
              primaryRole: data.profile.primaryRole,
              secondaryRoles: data.profile.secondaryRoles,
              statusMessage: data.profile.statusMessage,

              isBanned: data.profile.isBanned,
              isVerified: data.profile.isVerified,
              socialLinks: data.profile.socialLinks,
              premiumExpiresAt: data.profile.premiumExpiresAt,
            })
          } else {
            // If status is COOLDOWN, profile might be null
          }

          if (data.isBlockedByViewer) {
            setIsBlockedByViewer(true)
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
            const { Logger } = await import('@/lib/logger')
            Logger.info('[PublicProfile] Layout config loaded:', normalizedLayout)
            setLayoutConfig(normalizedLayout)
          } else {
            // Use default if no layout config (already initialized with default, but update for consistency)
            const { Logger } = await import('@/lib/logger')
            Logger.warn('[PublicProfile] No layout config in API response, using default')
            setLayoutConfig(getDefaultProfileLayout())
          }

          // Load appearance config from API response
          if (data.appearance) {
            const normalizedAppearance = normalizeAppearanceConfig(data.appearance)
            const { Logger } = await import('@/lib/logger')
            Logger.info('[PublicProfile] Appearance config loaded:', normalizedAppearance)
            setAppearanceConfig(normalizedAppearance)
          } else {
            // Use default if no appearance config (already initialized with default, but update for consistency)
            const { Logger } = await import('@/lib/logger')
            Logger.warn('[PublicProfile] No appearance config in API response, using default')
            setAppearanceConfig(getDefaultAppearanceConfig())
          }

          // Set global view count from API (fallback to 0)
          if (typeof data.views7d === 'number') {
            setViewCount(data.views7d)
          } else {
            setViewCount(null)
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
              const { Logger } = await import('@/lib/logger')
              Logger.error('[PublicProfile] Failed to fetch score:', scoreError)
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

    // Guard: need stableProfileId
    // Also skip tracking for COOLDOWN state as it's not a profile view
    if (!stableProfileId || profileStatus === 'COOLDOWN') {
      trackedProfileIdRef.current = null
      return
    }

    // 3. Status Check: Wait for wallet connection to stabilize
    // If status is 'connecting' or 'reconnecting', we wait for it to settle
    if (status === 'connecting' || status === 'reconnecting' || isReconnecting) {
      return
    }

    // Track view with source attribution from URL query params
    const source = getSourceFromUrl(searchParams)
    const currentTrackKey = `${stableProfileId}:${connectedAddress || 'anon'}:${source}`

    // Guard: Don't re-track if we already tracked this profile+identity+source in this mount
    if (trackedProfileIdRef.current === currentTrackKey) {
      return
    }

    // If anonymous, wait a bit (500ms) to see if identity is gained before sending
    // This prevents the flickering "Anonymous" then "Wallet" entries in Activity Feed
    if (!connectedAddress) {
      const timer = setTimeout(() => {
        trackProfileView(stableProfileId, source)
        trackedProfileIdRef.current = currentTrackKey
      }, 800)
      return () => clearTimeout(timer)
    }

  }, [searchParams, profile?.address, profile?.isBanned, loading])

  // Check for donate action in URL parameters (from extension)
  useEffect(() => {
    const action = searchParams.get('action')
    console.log('[DonateModal] URL check:', { action, hasProfile: !!profile?.address, isBanned: profile?.isBanned, loading, donateModalOpen })

    if (action === 'donate' && profile?.address && !profile?.isBanned && !loading && !donateModalOpen) {
      console.log('[DonateModal] Opening modal from URL parameter', { action })
      // Delay to ensure page is fully rendered
      const timer = setTimeout(() => {
        setDonateModalOpen(true)

        // Clean up URL parameter to prevent re-opening on refresh/navigation
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('action')
        window.history.replaceState({}, '', newUrl.toString())
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [searchParams, profile?.address, profile?.isBanned, loading, donateModalOpen])


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
      case 'COOLDOWN':
        return (
          <Badge variant="destructive" className={baseClass}>
            Reserved
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



  if (profileStatus === 'COOLDOWN' && cooldownInfo) {
    const endsAt = new Date(cooldownInfo.cooldownEndsAt)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <CardTitle className="text-center">Slug Reserved</CardTitle>
            <CardDescription className="text-center">
              The slug <strong>{cooldownInfo.slug}</strong> is currently in a cooldown period.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available from:</span>
                <span className="font-medium">{endsAt.toLocaleDateString()} {endsAt.toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previous Owner:</span>
                <span className="font-mono">{formatAddress(cooldownInfo.previousOwner)}</span>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              This slug cannot be claimed until the cooldown period ends.
            </p>
          </CardContent>
          <div className="p-6 pt-0 flex justify-center">
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
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
          role: data.profile.role,
          primaryRole: data.profile.primaryRole,
          secondaryRoles: data.profile.secondaryRoles,
          statusMessage: data.profile.statusMessage,
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
  const isOwnProfile = connectedAddress && resolvedAddress && connectedAddress.toLowerCase() === resolvedAddress.toLowerCase()
  // Normalize once for follow/stats so cache key and API always use same address (fixes followers count persistence)
  const profileAddressForFollow =
    resolvedAddress && isValidAddress(resolvedAddress) ? resolvedAddress.toLowerCase() : null
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
    // Dynamic import inside the render logic is not ideal, but for debug logs it's passable
    // Better to use an effect or just suppress these in production
    if (process.env.NODE_ENV === 'development') {
      // We can just keep console.log here wrapped in dev check, OR use the Logger
      // Since Logger is async import it might be tricky in render body.
      // Let's wrapping in simple console.log for now but STRICTLY checked.
      // Actually user wants them GONE in production.
      // Let's use an IIFE or just remove them if they are just debug noise.
      // Or better: use a useEffect to log them
    }
  }

  useEffect(() => {
    if (layoutConfig && appearanceConfig) {
      import('@/lib/logger').then(({ Logger }) => {
        Logger.info('[PublicProfile] Visible blocks:', visibleBlocks)
        Logger.info('[PublicProfile] Appearance theme:', effectiveAppearanceConfig.theme)
      })
    }
  }, [layoutConfig, appearanceConfig, visibleBlocks, effectiveAppearanceConfig.theme])

  const headerClasses = getThemeHeaderClasses(effectiveAppearanceConfig.theme)
  const titleClasses = getThemeTextClasses(effectiveAppearanceConfig.theme, 'title')
  const avatarSize = effectiveAppearanceConfig.theme === 'spotlight' ? 'h-16 w-16' : 'h-12 w-12'

  if (isNotFound) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-4xl text-center">404</CardTitle>
            <CardDescription className="text-center">Profile not found</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              The profile <strong>{params.id}</strong> does not exist.
            </p>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            <Card className={getThemeCardClasses(effectiveAppearanceConfig.theme)}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Avatar + Identity + Status + Context */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
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

                    <div className="min-w-0 space-y-1 flex-1">
                      {/* 1. Identity Block */}
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <h1 className={`${titleClasses} font-bold truncate text-foreground flex items-center gap-1.5`}>
                          {primaryDisplayName}
                          {profile?.isVerified && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <CheckCircle className="h-5 w-5 text-blue-500 fill-blue-500/10" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Verified Account</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </h1>

                        {/* Roles & Ranks */}
                        {!profile?.isBanned && (profile?.role === 'ADMIN' || profile?.role === 'BUILDER') && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="text-[11px] px-2 py-0 border-primary/20 bg-primary/10 text-primary font-bold cursor-help">
                                  {profile.role === 'ADMIN' ? 'Team' : 'Builder'}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Rank: {profile.role === 'ADMIN' ? 'Team Member' : 'Verified Builder'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* Premium Badge */}
                        {!profile?.isBanned && profile?.premiumExpiresAt && new Date(profile.premiumExpiresAt) > new Date() && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="default" className="text-[11px] px-2 py-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold border-0 shadow-sm flex items-center gap-1">
                                  <Sparkles className="h-3 w-3 fill-white/20" />
                                  Pro
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>Premium Membership Active</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* Score Tier Badge */}
                        {!profile?.isBanned && score && score.total > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="text-[11px] px-2 py-0 border-primary/20 bg-primary/10 text-primary font-bold cursor-help flex items-center gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  {score.tierLabel}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Tier: {score.tierLabel} ({score.total} points)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {!profile?.isBanned && profile?.primaryRole && (
                          <Badge variant="secondary" className="text-[11px] px-2 py-0 border-border bg-muted/60 text-foreground font-medium">
                            {profile.primaryRole}
                          </Badge>
                        )}
                        {!profile?.isBanned && profile?.secondaryRoles?.map(role => (
                          <Badge key={role} variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground/80 font-normal">
                            {role}
                          </Badge>
                        ))}

                        {/* Claimed/Status Badge */}
                        {isClaimed && !isPrivate && !profile?.isBanned && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground border-border/60">
                            Claimed
                          </Badge>
                        )}
                        {profile?.isBanned && (
                          <Badge variant="destructive" className="text-[11px] px-2 py-0 font-normal flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" />
                            BANNED
                          </Badge>
                        )}
                      </div>

                      {/* 2. Bio */}
                      {!profile?.isBanned && profile?.bio && (
                        <p className="text-sm text-muted-foreground/90 truncate pr-4 leading-relaxed mb-0.5">
                          {profile.bio}
                        </p>
                      )}

                      {/* 3. Status / Intent (Whisper style) */}
                      {!profile?.isBanned && profile?.statusMessage && (
                        <p className="text-xs text-muted-foreground/70 italic truncate pr-4 leading-relaxed">
                          {profile.statusMessage}
                        </p>
                      )}

                      {/* 3. Social & Network Context (Secondary) */}
                      {!profile?.isBanned && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground/70 pt-1 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal bg-muted/50 text-muted-foreground hover:bg-muted/80 border-0">
                            Avalanche
                          </Badge>

                          <div className="w-px h-3 bg-border/50" />

                          {profileAddressForFollow && !profile?.isBanned && (
                            <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                              <FollowStats address={profileAddressForFollow} />
                            </div>
                          )}

                          {resolvedAddress && isValidAddress(resolvedAddress) && !profile?.isBanned && (
                            <>
                              <div className="w-px h-3 bg-border/50" />
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
                                      <Eye className="h-3 w-3" />
                                      <span>{viewCount !== null ? viewCount : '—'}</span>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Views in last 7 days</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Actions (Top Right, Isolated) */}
                  <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                    {profileAddressForFollow && !profile?.isBanned && (
                      <FollowToggle
                        address={profileAddressForFollow}
                        isBlockedByViewer={isBlockedByViewer}
                        onBlockChange={(blocked) => setIsBlockedByViewer(blocked)}
                      />
                    )}

                    {profileAddressForFollow && !profile?.isBanned && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2 text-muted-foreground hover:text-pink-500 hover:border-pink-200 hover:bg-pink-50"
                        onClick={() => setDonateModalOpen(true)}
                      >
                        <Heart className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline text-xs font-medium">Donate</span>
                      </Button>
                    )}

                    {resolvedAddress && isValidAddress(resolvedAddress) && !profile?.isBanned && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleCopyProfileLink}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setQrModalOpen(true)}>
                            <QrCode className="mr-2 h-4 w-4" />
                            Show QR Code
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {/* Block/Report Menu */}
                    {resolvedAddress && isValidAddress(resolvedAddress) && !isOwnProfile && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleBlock} className="text-destructive focus:text-destructive">
                            <Ban className="h-4 w-4 mr-2" />
                            {isBlockedByViewer ? 'Unblock User' : 'Block User'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}


                    {profileStatus === 'UNCLAIMED' && profile?.address && !profile?.isBanned && (
                      <ClaimProfileButton address={profile.address} onSuccess={handleClaimSuccess} />
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Card Content: Only Social Links (Bio/Status is moved up) */}
              {
                !profile?.isBanned && profile?.socialLinks && profile.socialLinks.length > 0 && (
                  <CardContent className="pt-0 pb-4">
                    <div className="flex items-center gap-2 flex-wrap pl-[calc(3rem+1rem)]"> {/* Indent to align with text */}
                      {profile.socialLinks.map((link) => {
                        const platform = link.platform || link.type || 'website'
                        return (
                          <div key={link.id || link.url} className="relative inline-block">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener"
                                    className="flex items-center justify-center h-7 w-7 rounded-full border border-border/50 bg-background hover:bg-muted hover:border-border transition-colors text-muted-foreground hover:text-foreground"
                                  >
                                    {getSocialIcon(platform)}
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="flex items-center gap-1.5">
                                    <span>{getSocialLabel(link)}</span>
                                    {link.verified && (
                                      <CheckCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {link.verified && (
                              <div className="absolute -top-1 -right-1 pointer-events-none bg-background rounded-full p-[1px] ring-1 ring-border/20 shadow-sm z-10">
                                <CheckCircle className="h-2.5 w-2.5 text-blue-500 fill-blue-500/10" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                )
              }
            </Card >
          )
          }

          {
            isBlockedByViewer ? (
              <Card className={`${getThemeCardClasses(effectiveAppearanceConfig.theme)} border-destructive/30 bg-destructive/5`}>
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <UserX className="h-10 w-10 mx-auto text-destructive mb-3" />
                    <p className="text-base font-semibold mb-1 text-destructive">You have blocked this user</p>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                      You cannot see their activity or assets while they are blocked. Unblock them to view their profile content.
                    </p>
                    <Button
                      variant="outline"
                      className="border-destructive/30 hover:bg-destructive/10 text-destructive hover:text-destructive"
                      onClick={handleUnblock}
                      size="sm"
                    >
                      Unblock User
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : !profile?.isBanned && useRowLayout ? (
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
                        categoryId?: string
                        type: 'social' | 'featured' | 'custom'
                        icon?: React.ReactNode
                        order: number
                        verified?: boolean
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
                          if (link.enabled === false) return
                          allLinks.push({
                            id: link.id || `social-${link.url}`,
                            title: getSocialLabel(link),
                            url: getSocialUrl(link),
                            category: 'Socials',
                            type: 'social',
                            icon: getSocialIcon(link.platform || link.type || 'website'),
                            order: 1000 + index, // Social links come after featured
                            verified: link.verified,
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
                                        <div className="mb-3">
                                          <h3 className={`${getThemeTextClasses(effectiveAppearanceConfig.theme, 'body')} font-bold text-foreground`}>
                                            {category}
                                          </h3>
                                          {categoryData?.description && (
                                            <p className={`${getThemeTextClasses(effectiveAppearanceConfig.theme, 'small')} mt-1`}>
                                              {categoryData.description}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                      <div className="space-y-2">
                                        {categoryLinks.map((link) => {
                                          // Use redirect endpoint for tracking custom links (DB records)
                                          // Use direct URL for social links (JSON records, no DB ID for redirector)
                                          const redirectUrl = link.type === 'social'
                                            ? link.url
                                            : `/r/${link.id}?source=profile${connectedAddress ? `&wallet=${connectedAddress}` : ''}`

                                          // Format displayed URL (strip protocol and www)
                                          let displayUrl = link.url
                                            .replace(/^https?:\/\//, '')
                                            .replace(/^www\./, '')
                                            // Optional: strip trailing slash
                                            .replace(/\/$/, '')

                                          return (
                                            <a
                                              key={link.id}
                                              href={redirectUrl}
                                              target="_blank"
                                              rel="noopener"
                                              onClick={() => {
                                                if (stableProfileId) {
                                                  const source = getSourceFromUrl(searchParams)
                                                  trackLinkClick(
                                                    stableProfileId,
                                                    link.id,
                                                    source === 'unknown' ? 'profile' : source,
                                                    link.categoryId || null,
                                                    link.title,
                                                    link.url,
                                                    connectedAddress || undefined,
                                                    { skipServer: link.type !== 'social' }
                                                  )
                                                }
                                              }}
                                              className={getThemeLinkItemClasses(effectiveAppearanceConfig.theme)}
                                            >
                                              <div className="flex min-w-0 items-center gap-2">
                                                <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-muted/60 text-muted-foreground shrink-0">
                                                  {link.icon || <Link2 className="h-3.5 w-3.5" />}
                                                  {link.verified && (
                                                    <div className="absolute -top-1 -right-1 bg-background rounded-full p-[1px] ring-1 ring-border/20 shadow-sm z-10">
                                                      <CheckCircle className="h-2 w-2 text-blue-500 fill-blue-500/10" />
                                                    </div>
                                                  )}
                                                </div>
                                                <div className="min-w-0 space-y-0.5">
                                                  <p className={`${getThemeTextClasses(effectiveAppearanceConfig.theme, 'body')} truncate text-foreground`}>
                                                    {link.title}
                                                  </p>
                                                  <p className={`${getThemeTextClasses(effectiveAppearanceConfig.theme, 'small')} truncate flex items-center gap-1.5`}>
                                                    {displayUrl}
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
                                        <p className={`font-mono ${getThemeTextClasses(effectiveAppearanceConfig.theme, 'body')} truncate`}>
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
                                      rel="noopener"
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
                                    <p className={`${getThemeTextClasses(effectiveAppearanceConfig.theme, 'body')} font-semibold`}>
                                      {parseFloat(tx.value).toFixed(4)} AVAX
                                    </p>
                                  )}
                                  <p className={getThemeTextClasses(effectiveAppearanceConfig.theme, 'small')}>
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
                          <CardContent className={effectiveAppearanceConfig.theme === 'dense' ? 'p-3 space-y-2' : 'p-6 space-y-4'}>
                            <div className="space-y-2">
                              <p className={getThemeTextClasses(effectiveAppearanceConfig.theme, 'small')}>Tokens</p>
                              {/* Native AVAX Balance */}
                              {walletData.nativeBalance && parseFloat(walletData.nativeBalance) > 0 && (
                                <div className="flex justify-between items-center px-1">
                                  <div className="min-w-0">
                                    <p className={`${getThemeTextClasses(effectiveAppearanceConfig.theme, 'body')} truncate uppercase`}>AVAX</p>
                                    <p className={getThemeTextClasses(effectiveAppearanceConfig.theme, 'small')}>Avalanche</p>
                                  </div>
                                  {showAmounts && (
                                    <p className={`${getThemeTextClasses(effectiveAppearanceConfig.theme, 'body')} font-mono`}>
                                      {parseFloat(walletData.nativeBalance).toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                                    </p>
                                  )}
                                </div>
                              )}
                              {walletData.tokenBalances && walletData.tokenBalances.length > 0 ? (
                                walletData.tokenBalances.slice(0, maxItems).map((token, idx) => (
                                  <div key={idx} className="flex justify-between items-center px-1">
                                    <div className="min-w-0">
                                      <p className={`${getThemeTextClasses(effectiveAppearanceConfig.theme, 'body')} truncate uppercase`}>{token.symbol}</p>
                                      <p className={getThemeTextClasses(effectiveAppearanceConfig.theme, 'small')}>{token.name}</p>
                                    </div>
                                    {showAmounts && (
                                      <p className={`${getThemeTextClasses(effectiveAppearanceConfig.theme, 'body')} font-mono`}>
                                        {parseFloat(token.balance).toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                                      </p>
                                    )}
                                  </div>
                                ))
                              ) : (
                                !walletData.nativeBalance || parseFloat(walletData.nativeBalance) === 0 ? (
                                  <p className={getThemeTextClasses(effectiveAppearanceConfig.theme, 'small')}>—</p>
                                ) : null
                              )}
                            </div>
                            <div className={`pt-3 border-t ${effectiveAppearanceConfig.theme === 'dense' ? 'space-y-1' : 'space-y-2'}`}>
                              <p className={getThemeTextClasses(effectiveAppearanceConfig.theme, 'small')}>NFTs</p>
                              {walletData.nfts && walletData.nfts.length > 0 ? (
                                walletData.nfts.slice(0, maxItems).map((nft, idx) => (
                                  <div key={idx} className="flex items-center gap-3 mb-2 group">
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
                                      <p className={`${getThemeTextClasses(effectiveAppearanceConfig.theme, 'body')} truncate`}>
                                        {nft.name || 'Unnamed NFT'}
                                      </p>
                                      <p className={`${getThemeTextClasses(effectiveAppearanceConfig.theme, 'small')} font-mono truncate`}>
                                        {formatAddress(nft.contractAddress)} #{nft.tokenId}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                              onClick={() => {
                                                navigator.clipboard.writeText(nft.contractAddress)
                                                toast.success('Address copied')
                                              }}
                                            >
                                              <Copy className="h-3 w-3" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Copy contract</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" asChild>
                                              <a
                                                href={`https://snowtrace.io/token/${nft.contractAddress}?a=${nft.tokenId}`}
                                                target="_blank"
                                                rel="noopener"
                                              >
                                                <ExternalLink className="h-3 w-3" />
                                              </a>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>View on explorer</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" asChild>
                                              <a
                                                href={`https://snowtrace.io/token/${nft.contractAddress}`}
                                                target="_blank"
                                                rel="noopener"
                                              >
                                                <Layers className="h-3 w-3" />
                                              </a>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>View collection</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
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
                                    rel="noopener"
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
            )
          }
        </div >
      ) : null}

      {/* QR Code Modal for current profile */}
      {
        resolvedAddress && isValidAddress(resolvedAddress) && (
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
        )
      }

      {/* Donate Modal */}
      {profileAddressForFollow && !profile?.isBanned && (
        <DonateModal
          open={donateModalOpen}
          onOpenChange={setDonateModalOpen}
          recipient={{
            address: profileAddressForFollow,
            displayName: profile?.displayName || undefined,
            slug: profile?.slug || undefined,
            avatar: getAvatarUrl(profileAddressForFollow),
          }}

          onDonate={async (amount, message) => {
            await donate(profileAddressForFollow, amount, message)
          }}
        />
      )}

      <SiteFooter className="mt-auto" />
    </div >
  )
}
