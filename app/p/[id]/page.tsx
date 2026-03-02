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
import { ExternalLink, Linkedin, Github, Globe, MessageCircle, Send, Mail, QrCode, Link2, Activity, Copy, ArrowRight, Heart, Share2, Instagram, Youtube, Sparkles, ShieldAlert, Layers, UserX, CheckCircle, MoreVertical, Ban, Puzzle, Code2, ChevronDown, ChevronUp, Wallet } from 'lucide-react'
import { XIcon } from '@/components/icons/x-icon'
import { getCachedLogo, getCacheKey } from '@/lib/logo-cache'

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
    const [activityDisplayCount, setActivityDisplayCount] = useState(5)
    const [assetsDisplayCount, setAssetsDisplayCount] = useState(3)

    const [profile, setProfile] = useState<{
        address: string
        slug: string | null
        displayName?: string | null
        bio?: string | null
        role?: string | null
        primaryRole?: string | null
        secondaryRoles?: string[] | null
        statusMessage?: string | null
        isBanned?: boolean
        isVerified?: boolean
        socialLinks?: Array<{ id?: string; platform?: string; type?: string; url: string; label?: string; verified?: boolean; enabled?: boolean }> | null
        premiumExpiresAt?: string | null
        profileViews?: number
    } | null>(null)
    const [baseLoading, setBaseLoading] = useState(true)
    const [walletLoading, setWalletLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isNotFound, setIsNotFound] = useState(false)
    const [qrModalOpen, setQrModalOpen] = useState(false)
    const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([])
    const [linkCategories, setLinkCategories] = useState<Array<{ id: string; name: string; slug: string; description: string | null; order: number; isVisible?: boolean }>>([])
    const [score, setScore] = useState<{ total: number; tier: string; tierLabel: string; breakdown?: any } | null>(null)
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
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

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

    const isOwnProfile = mounted && !!(connectedAddress && stableProfileId && connectedAddress.toLowerCase() === stableProfileId)
    const isPrivate = profileStatus === 'CLAIMED+PRIVATE'
    const isClaimed = profileStatus === 'CLAIMED+PUBLIC' || profileStatus === 'CLAIMED+PRIVATE'
    const resolvedAddress = stableProfileId

    useEffect(() => {
        const fetchData = async () => {
            setBaseLoading(true)
            setError(null)

            try {
                // Check if id is an address (starts with 0x) or a slug
                const isAddress = params.id.startsWith('0x') && isValidAddress(params.id)

                let response: Response
                // Add cache bust timestamp to prevent aggressive caching
                const cacheBust = `${Date.now()}-${Math.random().toString(36).substring(7)}`

                // --- PHASE 1: Fetch Identity Data (Fast) ---
                let profileResponse: Response
                if (isAddress) {
                    const normalizedAddress = params.id.toLowerCase()
                    profileResponse = await fetch(`/api/profile/${normalizedAddress}?_t=${cacheBust}`, {
                        cache: 'no-store',
                        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
                    })
                } else {
                    profileResponse = await fetch(`/api/profile/${params.id}?_t=${cacheBust}`, { // Assuming /api/profile handles slugs too, or might need a specific endpoint
                        cache: 'no-store',
                        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
                    })
                }

                // Temporary workaround since `/api/profile/[id]` doesn't return full public layout/appearance payloads yet.
                // We'll hit the newly returning `/api/wallet` but NOT wait for the wallet data parsing to render the UI? No, /api/wallet blocks on getWalletData on the backend.
                // We MUST use existing endpoints. `/api/profile/[id]` returns the raw DB object, but we need layout/appearance.
                // Actually, wait, let's look closely at `/api/wallet/route.ts` - it blocks on `await getWalletData(resolvedAddress)`.
                // If I modify `/api/wallet/route.ts` to take a `?skipWallet=true` flag, it can return instantly!

                const skipWalletUrl = isAddress
                    ? `/api/wallet?address=${params.id.toLowerCase()}&skipWallet=true&_t=${cacheBust}`
                    : `/api/wallet?slug=${params.id}&skipWallet=true&_t=${cacheBust}`

                const baseResponse = await fetch(skipWalletUrl, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
                })

                const data = await baseResponse.json()
                const { Logger } = await import('@/lib/logger')
                Logger.info('[PublicProfile] API base response:', { hasLayout: !!data.layout, profileStatus: data.profileStatus })

                if (data.error && !data.profileStatus) {
                    if (baseResponse.status === 404 && !isAddress) {
                        setIsNotFound(true)
                        setBaseLoading(false)
                        return
                    } else {
                        setError(data.error)
                    }
                    setLayoutConfig(getDefaultProfileLayout())
                    setAppearanceConfig(getDefaultAppearanceConfig())
                } else {
                    setProfileStatus(data.profileStatus)
                    if (data.cooldown) setCooldownInfo(data.cooldown)
                    if (data.score) setScore(data.score)

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
                            profileViews: data.profile.profileViews,
                        })
                    }

                    if (data.isBlockedByViewer) setIsBlockedByViewer(true)

                    if (data.links && Array.isArray(data.links)) {
                        const enabledLinks = data.links
                            .filter((link: any) => link.enabled)
                            .sort((a: any, b: any) => a.order !== b.order ? a.order - b.order : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                            .map((link: any) => ({
                                id: link.id, title: link.title || '', url: link.url, enabled: link.enabled,
                                categoryId: link.categoryId || null, order: link.order || 0,
                                createdAt: link.createdAt || new Date().toISOString(),
                                updatedAt: link.updatedAt || new Date().toISOString(),
                            }))
                        setProfileLinks(enabledLinks)
                    }

                    if (data.categories && Array.isArray(data.categories)) {
                        setLinkCategories(data.categories.map((cat: any) => ({
                            id: cat.id, name: cat.name, slug: cat.slug, description: cat.description || null,
                            order: cat.order || 0, isVisible: cat.isVisible ?? true,
                        })))
                    } else setLinkCategories([])

                    if (data.layout) setLayoutConfig(normalizeLayoutConfig(data.layout))
                    else setLayoutConfig(getDefaultProfileLayout())

                    if (data.appearance) setAppearanceConfig(normalizeAppearanceConfig(data.appearance))
                    else setAppearanceConfig(getDefaultAppearanceConfig())

                    if (typeof data.views7d === 'number') setViewCount(data.views7d)
                    else setViewCount(null)

                    if (data.profile?.address || data.walletData?.address) {
                        const scoreAddress = data.profile?.address || data.walletData?.address
                        fetch(`/api/profile/${scoreAddress}/score`)
                            .then(res => res.ok ? res.json() : null)
                            .then(scoreData => {
                                if (scoreData) setScore({ total: scoreData.score, tier: scoreData.tier, tierLabel: scoreData.tierLabel, breakdown: scoreData.breakdown })
                            })
                            .catch(err => Logger.error('[PublicProfile] Failed to fetch score:', err))
                    }
                }

                // Unlock the UI instantly for the Identity section
                setBaseLoading(false)

                // --- PHASE 2: Fetch Wallet Data (Slow) ---
                if (!data.error && data.profile?.address) {
                    try {
                        const walletUrl = `/api/wallet?address=${data.profile.address.toLowerCase()}&onlyWallet=true&_t=${cacheBust}`
                        const walletResponse = await fetch(walletUrl, {
                            cache: 'no-store',
                            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
                        })
                        const walletJson = await walletResponse.json()
                        if (walletJson.walletData) {
                            setWalletData(walletJson.walletData)
                        }
                    } catch (walletErr) {
                        console.error('Error fetching wallet data separately:', walletErr)
                    } finally {
                        setWalletLoading(false)
                    }
                } else {
                    setWalletLoading(false)
                }

            } catch (err) {
                setError('An error occurred while loading data')
                console.error(err)
                setBaseLoading(false)
                setWalletLoading(false)
            }
        } // End of fetchData

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
        } else {
            // Privacy feature: Do not track owner viewing their own profile
            if (stableProfileId === connectedAddress.toLowerCase()) {
                trackedProfileIdRef.current = currentTrackKey
                return
            }

            trackProfileView(stableProfileId, source, connectedAddress)
            trackedProfileIdRef.current = currentTrackKey
        }

    }, [searchParams, profile?.address, profile?.isBanned, baseLoading, stableProfileId, connectedAddress, status, isReconnecting, profileStatus])

    // Check for donate action in URL parameters (from extension)
    useEffect(() => {
        const action = searchParams.get('action')
        console.log('[DonateModal] URL check:', { action, hasProfile: !!profile?.address, isBanned: profile?.isBanned, loading: baseLoading, donateModalOpen })

        if (action === 'donate' && profile?.address && !profile?.isBanned && !baseLoading && !donateModalOpen && !isOwnProfile) {
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
    }, [searchParams, profile?.address, profile?.isBanned, baseLoading, donateModalOpen])


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
                    premiumExpiresAt: data.profile.premiumExpiresAt,
                    isBanned: data.profile.isBanned,
                    isVerified: data.profile.isVerified,
                    profileViews: data.profile.profileViews,
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

    const handleCopyDonateEmbed = async () => {
        if (!resolvedAddress) return
        try {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
            const embedId = profile?.slug || resolvedAddress
            const embedUrl = `${baseUrl}/embed/donate/${embedId}`
            const embedCode = `<iframe src="${embedUrl}" width="350" height="80" frameborder="0" style="border:none; overflow:hidden;" scrolling="no"></iframe>`
            await navigator.clipboard.writeText(embedCode)
            toast.success('Donate embed code copied')
        } catch {
            toast.error('Failed to copy embed code')
        }
    }


    // Normalize once for follow/stats so cache key and API always use same address (fixes followers count persistence)
    const profileAddressForFollow =
        resolvedAddress && isValidAddress(resolvedAddress) ? resolvedAddress.toLowerCase() : null
    const shortAddress = resolvedAddress
        ? formatAddress(resolvedAddress)
        : params.id.startsWith('0x')
            ? formatAddress(params.id)
            : params.id
    const primaryDisplayName = profile?.displayName || shortAddress
    const isProMember = Boolean(profile?.premiumExpiresAt && new Date(profile.premiumExpiresAt) > new Date())

    const reduceExtraMentions = (text: string) => {
        let seen = false
        return text.replace(/(^|\s)@([a-zA-Z0-9_]+)/g, (match, prefix, handle) => {
            if (!seen) {
                seen = true
                return `${prefix}@${handle}`
            }
            return `${prefix}${handle}`
        })
    }

    const normalizeBioCopy = (text: string) => {
        return text
            .replace(/\b(avalanche|team1)\b/gi, '')
            .replace(/\s{2,}/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
    }

    const simplifyHeaderBio = (text: string) => {
        return normalizeBioCopy(reduceExtraMentions(text))
            .replace(/@/g, '')
            .replace(/\s*·\s*/g, '\n')
            .trim()
    }

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

    const getSmartLinkIcon = (title: string, url: string, category: string, providedIcon?: React.ReactNode) => {
        if (providedIcon) return providedIcon
        const value = `${title} ${url} ${category}`.toLowerCase()
        if (value.includes('github.com')) return <Github className="h-3.5 w-3.5" />
        if (value.includes('extension') || value.includes('plugin') || value.includes('add-on') || value.includes('addon')) {
            return <Puzzle className="h-3.5 w-3.5" />
        }
        if (value.includes('website') || value.includes('site') || value.includes('http://') || value.includes('https://')) {
            return <Globe className="h-3.5 w-3.5" />
        }
        return <Link2 className="h-3.5 w-3.5" />
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

    // Debug blocks logging removed.

    const headerClasses = getThemeHeaderClasses(effectiveAppearanceConfig.theme)
    const titleClasses = getThemeTextClasses(effectiveAppearanceConfig.theme, 'title')
    const avatarSize = effectiveAppearanceConfig.theme === 'spotlight' ? 'h-16 w-16' : 'h-12 w-12'

    if (isNotFound) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-6xl">
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
        <div className="space-y-6 min-h-screen">
            {baseLoading ? (
                <div className="space-y-6 pb-24 md:pb-0 max-w-6xl mx-auto w-full mt-2 animate-pulse">
                    <div className="flex flex-col items-center text-center mb-6 relative w-full pt-2">
                        {/* Avatar Skeleton */}
                        <div className="relative mb-3 flex items-center justify-center">
                            <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-foreground/10" />
                        </div>

                        {/* Identity Header Skeleton */}
                        <div className="flex flex-col items-center mt-3 w-full">
                            <div className="flex items-center justify-center gap-3">
                                <Skeleton className="h-8 w-40 bg-foreground/10 rounded-md" />
                            </div>

                            {/* Meta Row Skeleton */}
                            <div className="flex items-center justify-center gap-2 mt-[6px]">
                                <Skeleton className="h-4 w-60 bg-foreground/10 rounded-md" />
                            </div>
                        </div>

                        {/* Bio Skeleton */}
                        <div className="flex justify-center w-full mt-[16px]">
                            <Skeleton className="h-[45px] w-[320px] bg-foreground/10 rounded-lg" />
                        </div>

                        {/* Social Icons Skeleton */}
                        <div className="flex justify-center flex-row gap-4 pt-[18px]">
                            <Skeleton className="h-8 w-8 rounded-full bg-foreground/10" />
                            <Skeleton className="h-8 w-8 rounded-full bg-foreground/10" />
                            <Skeleton className="h-8 w-8 rounded-full bg-foreground/10" />
                        </div>

                        {/* Stats Skeleton */}
                        <div className="flex justify-center pt-[10px]">
                            <Skeleton className="h-4 w-48 bg-foreground/10 rounded-md" />
                        </div>
                    </div>

                    {/* Content Blocks Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 items-start" >
                        <Skeleton className="md:col-span-1 h-[220px] w-full bg-foreground/5 rounded-3xl border border-foreground/5" />
                        <Skeleton className="md:col-span-1 h-[220px] w-full bg-foreground/5 rounded-3xl border border-foreground/5" />
                    </div>
                </div >
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
            ) : (profile?.address || walletData) ? (
                <div className="space-y-6 pb-24 md:pb-0 max-w-6xl mx-auto w-full mt-2">
                    {/* Profile Info Card - show for all profiles (claimed or unclaimed) */}
                    {(isClaimed || !isPrivate) && (
                        <div className="flex flex-col items-center text-center mb-6 relative w-full pt-2">
                            {/* Top Action Band */}
                            <div className="absolute top-0 right-0 flex items-center gap-2">
                                {profileAddressForFollow && !isOwnProfile && !profile?.isBanned && (
                                    <div className="hidden sm:flex gap-2 [&_button]:px-[14px] [&_button]:h-8 [&_button]:rounded-[10px] [&_button]:bg-foreground/5 [&_button]:border-foreground/10 hover:[&_button]:bg-foreground/10 [&_button]:text-foreground [&_button]:font-medium [&_button]:backdrop-blur-md [&_button]:transition-all [&_button]:active:scale-95 [&_svg]:h-[14px] [&_svg]:w-[14px] [&_button]:gap-1.5 [&_button]:text-xs">
                                        <FollowToggle
                                            address={profileAddressForFollow}
                                            isBlockedByViewer={isBlockedByViewer}
                                            onBlockChange={(blocked) => setIsBlockedByViewer(blocked)}
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => setDonateModalOpen(true)}
                                        >
                                            <Heart />
                                            <span>D</span>onate
                                        </Button>
                                    </div>
                                )}
                                {resolvedAddress && isValidAddress(resolvedAddress) && !profile?.isBanned && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="h-8 w-8 shrink-0 rounded-[10px] bg-foreground/5 border border-foreground/10 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/10 transition-all active:scale-95 backdrop-blur-md [&_svg]:stroke-[1.5]">
                                                <MoreVertical className="h-[16px] w-[16px]" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-background border-foreground/10 text-foreground">
                                            <DropdownMenuItem onClick={handleCopyProfileLink} className="hover:bg-foreground/10 focus:bg-foreground/10 cursor-pointer">
                                                <Copy className="mr-2 h-4 w-4" />
                                                Copy Link
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleCopyDonateEmbed} className="hover:bg-foreground/10 focus:bg-foreground/10 cursor-pointer">
                                                <Code2 className="mr-2 h-4 w-4" />
                                                {isOwnProfile ? 'Copy Donate Embed' : 'Embed this Profile'}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-foreground/10" />
                                            <DropdownMenuItem onClick={() => setQrModalOpen(true)} className="hover:bg-foreground/10 focus:bg-foreground/10 cursor-pointer">
                                                <QrCode className="mr-2 h-4 w-4" />
                                                Show QR Code
                                            </DropdownMenuItem>

                                            {/* Block/Report Menu */}
                                            {!isOwnProfile && (
                                                <>
                                                    <DropdownMenuSeparator className="bg-foreground/10" />
                                                    <DropdownMenuItem onClick={handleBlock} className="text-red-400 focus:text-red-400 hover:bg-red-400/10 focus:bg-red-400/10 cursor-pointer">
                                                        <Ban className="h-4 w-4 mr-2" />
                                                        {isBlockedByViewer ? 'Unblock User' : 'Block User'}
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>

                            {/* Avatar and Badges */}
                            <div className="relative group mt-6 sm:mt-8">
                                <div className="absolute -inset-0.5 bg-gradient-to-b from-foreground/20 to-foreground/0 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-700"></div>
                                <TooltipProvider delayDuration={150}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="relative cursor-pointer">
                                                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border border-foreground/10 shadow-2xl relative">
                                                    {resolvedAddress ? (
                                                        <>
                                                            <AvatarImage src={`https://effigy.im/a/${resolvedAddress.toLowerCase()}.svg`} alt={primaryDisplayName} className="object-cover" />
                                                            <AvatarFallback className="bg-foreground/5 text-xl text-foreground">{resolvedAddress.slice(2, 4).toUpperCase()}</AvatarFallback>
                                                        </>
                                                    ) : (
                                                        <AvatarFallback className="bg-foreground/5 text-xl text-foreground">??</AvatarFallback>
                                                    )}
                                                </Avatar>
                                                {profile?.isVerified && (
                                                    <div className="absolute bottom-0 right-0 bg-background rounded-full p-1 border border-foreground/10 z-10 translate-x-1/4 translate-y-1/4 pointer-events-none">
                                                        <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </TooltipTrigger>

                                        {score && (
                                            <TooltipContent
                                                side="bottom"
                                                sideOffset={14}
                                                className="bg-background border border-foreground/5 rounded-[16px] p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                                            >
                                                <div className="flex flex-col gap-4">
                                                    {/* Top Row: Score & Bar */}
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-foreground/40 font-semibold text-[10px] uppercase tracking-wider">
                                                                Social Score
                                                            </span>
                                                            <span className="text-foreground font-semibold text-sm tracking-widest font-mono">
                                                                {Math.min(100, score.total).toFixed(2)}%
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-[3px]">
                                                            {Array.from({ length: 20 }).map((_, i) => {
                                                                const percentageBase = Math.min(100, score.total);
                                                                const isActive = (percentageBase / 100) * 20 >= (i + 1);
                                                                const isPartial = !isActive && (percentageBase / 100) * 20 > i;

                                                                return (
                                                                    <div
                                                                        key={i}
                                                                        className={`w-[3px] h-3.5 rounded-full transition-colors duration-500 ${isActive ? 'bg-[#4ADE80]' :
                                                                            isPartial ? 'bg-[#4ADE80]/50' :
                                                                                'bg-foreground/10'
                                                                            }`}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Bottom Row: Breakdown Data */}
                                                    {score.breakdown && (
                                                        <div className="grid grid-cols-4 gap-4 pt-3 border-t border-foreground/5">
                                                            <div className="flex flex-col gap-0.5 mt-0.5">
                                                                <span className="text-[9px] text-foreground/30 uppercase tracking-wider font-semibold">Profile</span>
                                                                <span className="text-xs text-foreground/80 font-mono tracking-wide">
                                                                    +{(score.breakdown.profileClaimed + score.breakdown.displayName + score.breakdown.bio).toFixed(0)}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col gap-0.5 mt-0.5">
                                                                <span className="text-[9px] text-foreground/30 uppercase tracking-wider font-semibold">Network</span>
                                                                <span className="text-xs text-foreground/80 font-mono tracking-wide">
                                                                    +{score.breakdown.followers.toFixed(1)}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col gap-0.5 mt-0.5">
                                                                <span className="text-[9px] text-foreground/30 uppercase tracking-wider font-semibold">Links</span>
                                                                <span className="text-xs text-foreground/80 font-mono tracking-wide">
                                                                    +{(score.breakdown.socialLinks + score.breakdown.profileLinks).toFixed(0)}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col gap-0.5 mt-0.5">
                                                                <span className="text-[9px] text-foreground/30 uppercase tracking-wider font-semibold">Tier</span>
                                                                <span className="text-xs text-emerald-400 font-medium capitalize tracking-wide">
                                                                    {score.tierLabel}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            {/* Identity Header Row */}
                            <div className="flex flex-col items-center mt-3 w-full">
                                {/* Name and Pro Badge */}
                                <div className="flex items-center justify-center gap-3">
                                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center justify-center gap-2">
                                        {primaryDisplayName}
                                    </h1>
                                    {isProMember && !profile?.isBanned && (
                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-[10px] font-semibold tracking-wider">
                                            PRO
                                        </span>
                                    )}
                                    {profile?.isBanned && (
                                        <Badge variant="destructive" className="text-[11px] px-2 py-0 font-normal flex items-center gap-1">
                                            <ShieldAlert className="h-3 w-3" />
                                            BANNED
                                        </Badge>
                                    )}
                                </div>

                                {/* Address, Tier, Network, and Stats Row */}
                                <div className="flex flex-row items-center justify-center gap-1.5 mt-[6px] text-xs text-foreground/40 font-medium tracking-wide">
                                    {profile?.address && (
                                        <p className="font-mono tracking-wider">
                                            {formatAddress(profile.address, 4)}
                                        </p>
                                    )}
                                    {!profile?.isBanned && score && score.total > 0 && (
                                        <>
                                            <span className="text-foreground/20 text-[10px]">·</span>
                                            <span className="text-foreground/50">{score.tierLabel}</span>
                                        </>
                                    )}
                                    {!profile?.isBanned && (
                                        <>
                                            <span className="text-foreground/20 text-[10px]">·</span>
                                            <span>Avalanche</span>
                                            {(profile?.role === 'BUILDER' || profile?.primaryRole === 'builder') && (
                                                <>
                                                    <span className="text-foreground/20 text-[10px]">·</span>
                                                    <span>Builder</span>
                                                </>
                                            )}
                                            {viewCount !== null && (
                                                <>
                                                    <span className="text-foreground/20 text-[10px]">·</span>
                                                    <span>{viewCount.toLocaleString()} views</span>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Bio */}
                            {!profile?.isBanned && profile?.bio && (
                                <p className="text-[15px] text-foreground/70 max-w-[420px] leading-relaxed whitespace-pre-wrap mt-[16px] text-center">
                                    {profile.bio}
                                </p>
                            )}

                            {/* Social / Link Icons (Moved below Bio) */}
                            {!profile?.isBanned && profile?.socialLinks && profile.socialLinks.length > 0 && (
                                <div className="flex items-center gap-4 justify-center pt-[18px]">
                                    {[...profile.socialLinks]
                                        .sort((a, b) => {
                                            // Priority: 1. Website/Other 2. X/Twitter 3. GitHub
                                            const getPriority = (platform: string) => {
                                                const p = platform.toLowerCase();
                                                if (p === 'website' || p === 'other') return 1;
                                                if (p === 'x' || p === 'twitter') return 2;
                                                if (p === 'github') return 3;
                                                return 4; // Others
                                            };
                                            return getPriority(a.platform || a.type || 'website') - getPriority(b.platform || b.type || 'website');
                                        })
                                        .map((link) => {
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
                                                                    className="flex items-center justify-center h-8 w-8 rounded-full transition-colors text-foreground/40 hover:text-foreground/80 [&_svg]:[stroke-width:1.5]"
                                                                >
                                                                    {getSocialIcon(platform)}
                                                                </a>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span>{getSocialLabel(link)}</span>
                                                                    {link.verified && (
                                                                        <div className="flex items-center gap-1 text-blue-400 ml-0.5">
                                                                            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                                                                            <span className="text-xs font-medium">Verified</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    {link.verified && (
                                                        <div className="absolute -top-1 -right-1 pointer-events-none bg-background rounded-full p-[1px] border border-foreground/10 z-10">
                                                            <CheckCircle className="h-3 w-3 text-blue-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                </div>
                            )}

                            {/* Stats */}
                            {!profile?.isBanned && (
                                <div className="flex flex-col items-center justify-center w-full">
                                    <div className="flex items-center justify-center text-[13px] text-foreground/85 pt-[10px]">
                                        {profileAddressForFollow && (
                                            <FollowStats address={profileAddressForFollow} />
                                        )}
                                    </div>

                                </div>
                            )}

                            {profileStatus === 'UNCLAIMED' && profile?.address && !profile?.isBanned && (
                                <div className="flex justify-center pt-3">
                                    <ClaimProfileButton address={profile.address} onSuccess={handleClaimSuccess} />
                                </div>
                            )}
                        </div>
                    )}

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
                            <div className="space-y-5 w-full">
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
                                                    className={`relative flex flex-col h-full rounded-3xl overflow-hidden bg-foreground/[0.02] border border-foreground/5 shadow-2xl backdrop-blur-xl transition-all duration-500 ${gridColSpan} w-full`}
                                                >
                                                    <CardHeader className="px-6 py-5 border-b border-foreground/5 flex flex-row items-center justify-between space-y-0 pb-5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-1.5 rounded-lg bg-foreground/5">
                                                                <Link2 className="h-4 w-4 text-foreground/70" />
                                                            </div>
                                                            <h3 className="font-medium text-sm tracking-wide text-foreground/80">Links</h3>
                                                        </div>
                                                        {/* Optional stats placeholder */}
                                                        {totalLinks > 0 && (
                                                            <div className="text-right">
                                                                <p className="text-xs text-muted-foreground/90">
                                                                    {totalLinks} {totalLinks === 1 ? 'link' : 'links'}
                                                                </p>
                                                                {/* Placeholder for future stats */}
                                                                {/* <p className="text-[10px] text-muted-foreground mt-0.5">
                              Views · Clicks (7d)
                            </p> */}
                                                            </div>
                                                        )}

                                                    </CardHeader>
                                                    <CardContent className="p-6 pt-5 flex-1">
                                                        {totalLinks === 0 ? (
                                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                                <Link2 className="h-8 w-8 text-muted-foreground mb-2" />
                                                                <p className="text-sm text-muted-foreground">
                                                                    This profile hasn&apos;t shared any links yet.
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-6">
                                                                {categories.map((category, index) => {
                                                                    const categoryLinks = linksByCategory.get(category) || []
                                                                    const categoryData = linkCategories.find(cat => cat.name === category)
                                                                    return (
                                                                        <div key={category} className={`space-y-2 ${index > 0 ? "pt-4" : ""}`}>
                                                                            {shouldShowCategoryHeaders && (
                                                                                <div className="mb-3 pl-1">
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
                                                                                                    {getSmartLinkIcon(link.title, link.url, link.category, link.icon)}
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
                                            // Limit unexpanded 'full' variant to 3 items to roughly match the height of the unexpanded Assets card height
                                            const displayCount = activityDisplayCount === 5 && isFull ? 3 : activityDisplayCount

                                            return (
                                                <Card key="activity" className={`relative flex flex-col h-full rounded-3xl overflow-hidden bg-foreground/[0.02] border border-foreground/5 shadow-2xl backdrop-blur-xl transition-all duration-500 ${gridColSpan} w-full`}>
                                                    <CardHeader className="px-6 py-5 border-b border-foreground/5 flex flex-row items-center justify-between space-y-0 pb-5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-1.5 rounded-lg bg-foreground/5">
                                                                <Activity className="h-4 w-4 text-foreground/70" />
                                                            </div>
                                                            <h3 className="font-medium text-sm tracking-wide text-foreground/80">Activity</h3>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className={isFull ? 'space-y-4 pt-4 px-0 pb-0 flex-1 flex flex-col relative' : 'space-y-3 pt-4 px-0 pb-0 flex-1 flex flex-col relative'}>
                                                        {walletLoading ? (
                                                            <div className="flex-1 pb-16 space-y-4 px-6 pt-4">
                                                                <Skeleton className="h-[72px] w-full bg-foreground/5 rounded-xl border border-foreground/5" />
                                                                <Skeleton className="h-[72px] w-full bg-foreground/5 rounded-xl border border-foreground/5" />
                                                                <Skeleton className="h-[72px] w-full bg-foreground/5 rounded-xl border border-foreground/5" />
                                                            </div>
                                                        ) : walletData?.transactions?.length ? (
                                                            <div className="flex-1 pb-16 flex flex-col">
                                                                <div className="px-6 pb-2">
                                                                    {walletData.transactions.slice(0, displayCount).map((tx, idx) => (
                                                                        <div
                                                                            key={idx}
                                                                            className={`${isFull ? 'space-y-2 p-3 rounded-md border bg-muted/30 mb-4 inline-block w-full' : isCompact ? 'space-y-0.5 py-1.5 border-b' : 'space-y-1 py-3 border-b'} last:border-0`}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                    {isFull && (
                                                                                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 shrink-0">
                                                                                            <Activity className="h-3 w-3 text-primary" />
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="min-w-0">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <p className={`font-mono ${getThemeTextClasses(effectiveAppearanceConfig.theme, isFull ? 'body' : isCompact ? 'small' : 'body')} truncate`}>
                                                                                                {formatAddress(tx.hash)}
                                                                                            </p>
                                                                                            {isFull && (
                                                                                                <button
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation()
                                                                                                        navigator.clipboard.writeText(tx.hash)
                                                                                                    }}
                                                                                                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                                                                                    title="Copy transaction hash"
                                                                                                >
                                                                                                    <Copy className="h-3.5 w-3.5" />
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
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
                                                                                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                                                                    <div>
                                                                                        <p className="text-muted-foreground">From</p>
                                                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                                                            <p className="font-mono truncate">{formatAddress(tx.from)}</p>
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation()
                                                                                                    navigator.clipboard.writeText(tx.from)
                                                                                                }}
                                                                                                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                                                                                title="Copy address"
                                                                                            >
                                                                                                <Copy className="h-3 w-3" />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-muted-foreground">To</p>
                                                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                                                            <p className="font-mono truncate">{formatAddress(tx.to)}</p>
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation()
                                                                                                    navigator.clipboard.writeText(tx.to)
                                                                                                }}
                                                                                                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                                                                                title="Copy address"
                                                                                            >
                                                                                                <Copy className="h-3 w-3" />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            <div className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 ${showAmounts ? 'mt-2' : ''}`}>
                                                                                <p className={`${getThemeTextClasses(effectiveAppearanceConfig.theme, 'small')} ${isCompact ? 'text-[10px]' : ''}`}>
                                                                                    {new Date(tx.timestamp * 1000).toLocaleString('tr-TR')}
                                                                                </p>
                                                                                {showAmounts && (
                                                                                    <p className={`${getThemeTextClasses(effectiveAppearanceConfig.theme, isCompact ? 'small' : 'body')} ${!isCompact && 'font-semibold'} ${isCompact ? 'font-medium' : ''}`}>
                                                                                        {parseFloat(tx.value).toFixed(4)} AVAX
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {/* Combined Pagination Control Area */}
                                                                {((walletData?.transactions?.length || 0) > displayCount || activityDisplayCount > 5) && (
                                                                    <div className={`mt-auto absolute bottom-0 left-0 w-full flex items-end justify-center pb-5 z-10 ${(walletData?.transactions?.length || 0) > displayCount ? 'h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none' : 'h-16 pt-2 pointer-events-auto'}`}>
                                                                        {(walletData?.transactions?.length || 0) > displayCount && (
                                                                            <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black,transparent)]" />
                                                                        )}

                                                                        <div className="pointer-events-auto relative z-20 flex items-center gap-3">
                                                                            {activityDisplayCount > 5 && (
                                                                                <button
                                                                                    onClick={() => setActivityDisplayCount(5)}
                                                                                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted backdrop-blur-md px-5 py-2.5 rounded-full border shadow-sm active:scale-95 duration-200"
                                                                                >
                                                                                    Show Less
                                                                                    <ChevronUp className="h-3.5 w-3.5 opacity-70" />
                                                                                </button>
                                                                            )}

                                                                            {((walletData?.transactions?.length || 0) > displayCount) && (
                                                                                <button
                                                                                    onClick={() => setActivityDisplayCount(prev => prev + 5)}
                                                                                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted backdrop-blur-md px-5 py-2.5 rounded-full border shadow-sm active:scale-95 duration-200"
                                                                                >
                                                                                    Load More
                                                                                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
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
                                            let cryptoAssets: {
                                                type: 'native' | 'token';
                                                name: string;
                                                symbol: string;
                                                balance: string;
                                                icon?: string;
                                                fallback?: string;
                                                contractAddress?: string;
                                            }[] = []

                                            const nftAssets: Array<{
                                                type: 'nft'
                                                name: string
                                                symbol: string
                                                balance: string
                                                image?: string | null
                                                contractAddress?: string
                                                tokenId?: string
                                            }> = []

                                            if (walletData) {
                                                if (walletData.nativeBalance && parseFloat(walletData.nativeBalance) > 0) {
                                                    cryptoAssets.push({
                                                        type: 'native',
                                                        name: 'Avalanche',
                                                        symbol: 'AVAX',
                                                        balance: parseFloat(walletData.nativeBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
                                                        icon: 'https://coin-images.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
                                                        fallback: '🔺'
                                                    })
                                                }

                                                if (walletData.tokenBalances) {
                                                    walletData.tokenBalances.forEach((token: any) => {
                                                        const cacheKey = getCacheKey(token.contractAddress, token.symbol)
                                                        const logoUrl = getCachedLogo(cacheKey)
                                                        const firstLetter = token.symbol?.charAt(0).toUpperCase() || '?'

                                                        cryptoAssets.push({
                                                            type: 'token',
                                                            name: token.name || 'Unknown Token',
                                                            symbol: token.symbol || 'TKN',
                                                            balance: parseFloat(token.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
                                                            icon: token.logo || logoUrl,
                                                            fallback: firstLetter,
                                                            contractAddress: token.contractAddress
                                                        })
                                                    })
                                                }

                                                if (walletData.nfts) {
                                                    walletData.nfts.forEach((nft: any) => {
                                                        nftAssets.push({
                                                            type: 'nft',
                                                            name: nft.name || 'Unnamed NFT',
                                                            symbol: `#${nft.tokenId}`,
                                                            balance: '1',
                                                            image: nft.image || null,
                                                            contractAddress: nft.contractAddress,
                                                            tokenId: nft.tokenId
                                                        })
                                                    })
                                                }
                                            }

                                            const visibleCrypto = cryptoAssets.slice(0, assetsDisplayCount)
                                            const visibleNfts = nftAssets.slice(0, assetsDisplayCount)
                                            const totalAssets = cryptoAssets.length + nftAssets.length
                                            const hasMoreAssets = cryptoAssets.length > assetsDisplayCount || nftAssets.length > assetsDisplayCount
                                            const showAmounts = variant !== 'hiddenAmounts'
                                            const isCompact = variant === 'compact'
                                            const isFull = variant === 'full'

                                            return (
                                                <Card key="assets" className={`relative flex flex-col h-full rounded-3xl overflow-hidden bg-foreground/[0.02] border border-foreground/5 shadow-2xl backdrop-blur-xl transition-all duration-500 ${gridColSpan} w-full`}>
                                                    <CardHeader className="px-6 py-5 border-b border-foreground/5 flex flex-row items-center justify-between space-y-0 pb-5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-1.5 rounded-lg bg-foreground/5">
                                                                <Wallet className="h-4 w-4 text-foreground/70" />
                                                            </div>
                                                            <h3 className="font-medium text-sm tracking-wide text-foreground/80">Assets</h3>
                                                        </div>
                                                        <span className="text-xs font-mono text-muted-foreground">{totalAssets} Total</span>
                                                    </CardHeader>

                                                    <CardContent className="p-0 flex-1 flex flex-col relative w-full">
                                                        {walletLoading ? (
                                                            <div className="p-2 space-y-4 flex-1 pb-16 pt-4 px-6">
                                                                <Skeleton className="h-[60px] w-full bg-foreground/5 rounded-2xl border border-foreground/5" />
                                                                <Skeleton className="h-[60px] w-full bg-foreground/5 rounded-2xl border border-foreground/5" />
                                                                <Skeleton className="h-[60px] w-full bg-foreground/5 rounded-2xl border border-foreground/5" />
                                                            </div>
                                                        ) : (
                                                            <div className="p-2 space-y-4 flex-1 pb-16">
                                                                {visibleCrypto.length > 0 && (
                                                                    <div className="flex flex-col">
                                                                        <div className="px-4 py-2 opacity-80">
                                                                            <h4 className="text-[11px] font-bold text-foreground/50 tracking-[0.2em] uppercase">Crypto Assets</h4>
                                                                        </div>
                                                                        {visibleCrypto.map((asset, idx) => (
                                                                            <div key={`crypto-${idx}`} className={`group flex items-center justify-between rounded-xl hover:bg-muted/50 transition-colors ${isCompact ? 'py-1.5 px-3' : 'p-3 sm:p-4'}`}>
                                                                                <div className={`flex items-center min-w-0 ${isCompact ? 'gap-2.5' : 'gap-4'}`}>
                                                                                    <div className={`rounded-full overflow-hidden border bg-accent/50 flex items-center justify-center flex-shrink-0 ${isCompact ? 'h-6 w-6 text-[10px]' : 'h-10 w-10 text-lg'}`}>
                                                                                        {asset.icon ? (
                                                                                            // eslint-disable-next-line @next/next/no-img-element
                                                                                            <img src={asset.icon} alt={asset.symbol} className="h-full w-full object-cover" />
                                                                                        ) : (
                                                                                            <span className={`${isCompact ? 'text-[8px]' : 'text-sm'} font-bold text-muted-foreground`}>{asset.fallback || '🪙'}</span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex flex-col min-w-0">
                                                                                        <span className={`${getThemeTextClasses(effectiveAppearanceConfig.theme, isCompact ? 'small' : 'body')} ${!isCompact && 'font-medium'} truncate`}>{asset.name}</span>
                                                                                        <span className={`${isCompact ? 'text-[10px] mt-0' : 'text-xs mt-0.5'} text-muted-foreground tracking-wider`}>{asset.symbol}</span>
                                                                                    </div>
                                                                                </div>
                                                                                {showAmounts && (
                                                                                    <div className="text-right pl-3">
                                                                                        <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-mono text-foreground/90`}>{asset.balance}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {visibleNfts.length > 0 && (
                                                                    <div className="flex flex-col">
                                                                        {visibleCrypto.length > 0 && <div className="h-px bg-foreground/5 mx-4 my-2" />}
                                                                        <div className="px-4 py-2 opacity-80">
                                                                            <h4 className="text-[11px] font-bold text-foreground/50 tracking-[0.2em] uppercase">NFTs</h4>
                                                                        </div>
                                                                        {visibleNfts.map((asset, idx) => (
                                                                            <div key={`nft-${idx}`} className={`group flex items-center justify-between rounded-xl hover:bg-muted/50 transition-colors ${isCompact ? 'py-1.5 px-3' : 'p-3 sm:p-4'}`}>
                                                                                <div className={`flex items-center min-w-0 ${isCompact ? 'gap-2.5' : 'gap-4'}`}>
                                                                                    {asset.image ? (
                                                                                        <div className={`rounded-lg overflow-hidden border bg-muted flex-shrink-0 ${isCompact ? 'h-7 w-7' : 'h-10 w-10'}`}>
                                                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                                            <img src={asset.image} alt="NFT" className="h-full w-full object-cover" />
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className={`${isCompact ? 'h-7 w-7 text-xs' : 'h-10 w-10 text-lg'} rounded-lg border bg-muted flex items-center justify-center flex-shrink-0`}>
                                                                                            🖼️
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="flex flex-col min-w-0">
                                                                                        <span className={`${getThemeTextClasses(effectiveAppearanceConfig.theme, isCompact ? 'small' : 'body')} ${!isCompact && 'font-medium'} truncate`}>{asset.name}</span>
                                                                                        <span className={`${isCompact ? 'text-[10px] mt-0' : 'text-xs mt-0.5'} text-muted-foreground uppercase tracking-wider`}>{asset.symbol}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                    <TooltipProvider>
                                                                                        <Tooltip>
                                                                                            <TooltipTrigger asChild>
                                                                                                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                                                                    <a href={`https://snowtrace.io/token/${asset.contractAddress}?a=${asset.tokenId}`} target="_blank" rel="noopener">
                                                                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                                                                    </a>
                                                                                                </Button>
                                                                                            </TooltipTrigger>
                                                                                            <TooltipContent>View on explorer</TooltipContent>
                                                                                        </Tooltip>
                                                                                    </TooltipProvider>
                                                                                </div>
                                                                                {showAmounts && (
                                                                                    <div className="text-right pl-3">
                                                                                        <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-mono text-foreground/90`}>{asset.balance}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {totalAssets === 0 && (
                                                                    <div className="text-center py-8">
                                                                        <p className="text-sm text-muted-foreground">—</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Combined Pagination Control Area */}
                                                        {(hasMoreAssets || assetsDisplayCount > 3) && !walletLoading && (
                                                            <div className={`absolute bottom-0 left-0 w-full flex items-end justify-center pb-5 z-10 ${hasMoreAssets ? 'h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none' : 'h-16 pt-2 pointer-events-auto'}`}>
                                                                {hasMoreAssets && (
                                                                    <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black,transparent)]" />
                                                                )}

                                                                <div className="pointer-events-auto relative z-20 flex items-center gap-3">
                                                                    {assetsDisplayCount > 3 && (
                                                                        <button
                                                                            onClick={() => setAssetsDisplayCount(3)}
                                                                            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted backdrop-blur-md px-5 py-2.5 rounded-full border shadow-sm active:scale-95 duration-200"
                                                                        >
                                                                            Show Less
                                                                            <ChevronUp className="h-3.5 w-3.5 opacity-70" />
                                                                        </button>
                                                                    )}

                                                                    {hasMoreAssets && (
                                                                        <button
                                                                            onClick={() => setAssetsDisplayCount(prev => prev + 5)}
                                                                            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted backdrop-blur-md px-5 py-2.5 rounded-full border shadow-sm active:scale-95 duration-200"
                                                                        >
                                                                            Load More
                                                                            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            )
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
                                            <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full items-stretch">
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
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full items-stretch">
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
            ) : null
            }

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
            {
                profileAddressForFollow && !profile?.isBanned && (
                    <DonateModal
                        open={donateModalOpen}
                        onOpenChange={setDonateModalOpen}
                        recipient={{
                            address: profileAddressForFollow,
                            displayName: profile?.displayName || undefined,
                            slug: profile?.slug || undefined,
                            avatar: getAvatarUrl(profileAddressForFollow),
                        }}
                        donationAlertVisual={effectiveAppearanceConfig.donationAlertVisual}

                        onDonate={async (amount, message) => {
                            await donate(profileAddressForFollow, amount, message)
                        }}
                    />
                )
            }

            {
                profileAddressForFollow && !profile?.isBanned && resolvedAddress && isValidAddress(resolvedAddress) && (
                    <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-50 md:hidden px-3">
                        <div className="rounded-2xl border border-border/80 bg-background/95 p-2 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/80">
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-11 gap-2 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90"
                                    onClick={handleCopyAddress}
                                >
                                    <Copy className="h-4 w-4" />
                                    Address
                                </Button>
                                <FollowToggle
                                    address={profileAddressForFollow}
                                    isBlockedByViewer={isBlockedByViewer}
                                    onBlockChange={(blocked) => setIsBlockedByViewer(blocked)}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-10 gap-2 text-xs font-medium"
                                    onClick={() => setDonateModalOpen(true)}
                                    disabled={isOwnProfile}
                                >
                                    <Heart className="h-4 w-4" />
                                    Donate
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            <SiteFooter className="mt-auto" />
        </div >
    )
}
