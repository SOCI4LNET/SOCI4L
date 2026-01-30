'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    RefreshCw,
    CheckCircle2,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    ExternalLink,
    Eye,
    Users,
    UserPlus,
    Link2,
} from "lucide-react"
import { formatAddress } from "@/lib/utils"
import { PageShell } from "@/components/app-shell/page-shell"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import type { ActivityTransaction } from "@/lib/activity/fetchActivity"
import { ProfileReadiness } from "@/components/dashboard/profile-readiness"
import { useRouter } from "next/navigation"
import { ProfileHeader } from "./profile-header"

// Types
export interface WalletData {
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
}

export interface ProfileData {
    displayName?: string | null
    bio?: string | null
    slug?: string | null
    status?: string | null
    claimedAt?: string | Date | null
    socialLinks?: Array<{ id?: string; platform?: string; type?: string; url: string; label?: string }> | null
}

export interface QuickStats {
    followers: number | null
    following: number | null
    views7d: number | null
    totalLinks: number | null
}

export interface OverviewPanelContentProps {
    walletData: WalletData | null
    profile: ProfileData | null
    address: string
    isOwnProfile: boolean
    stats: QuickStats
    activity: {
        items: ActivityTransaction[]
        isLoading: boolean
        error: Error | null
        refetch: () => void
    }
    assets: {
        tokens: any[]
        nfts: any[]
        isLoading: boolean
    }
    isClaimed: boolean
    publicProfileHref: string | null
    onClaimSuccess?: () => void
    isLoading?: boolean
    showReadiness?: boolean
    onDismissReadiness?: () => void

    // New props for Demo/Nav
    basePath?: string
    isEditable?: boolean
    onUpdateProfile?: (data: Partial<ProfileData>) => void
}

export function OverviewPanelContent({
    walletData,
    profile,
    address,
    isOwnProfile,
    stats,
    activity,
    assets,
    isClaimed,
    publicProfileHref,
    onClaimSuccess,
    isLoading,
    showReadiness,
    onDismissReadiness,
    basePath = `/dashboard/${address}`,
    isEditable = false,
    onUpdateProfile
}: OverviewPanelContentProps) {
    const router = useRouter()

    const handleCopyHash = async (hash: string) => {
        try {
            await navigator.clipboard.writeText(hash)
            toast.success('Hash copied')
        } catch {
            toast.error('Failed to copy')
        }
    }

    const getStatusIcon = (status: ActivityTransaction['status']) => {
        if (status === 'success') {
            return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        } else if (status === 'failed') {
            return <CheckCircle2 className="h-3.5 w-3.5 text-red-500" />
        } else {
            return <CheckCircle2 className="h-3.5 w-3.5 text-yellow-500" />
        }
    }

    const getDirectionIcon = (direction: ActivityTransaction['direction']) => {
        if (direction === 'outgoing') {
            return <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
        } else {
            return <ArrowDownRight className="h-3.5 w-3.5 text-muted-foreground" />
        }
    }

    const getExplorerLink = (hash: string): string => {
        return `https://snowtrace.io/tx/${hash}`
    }

    if (isLoading && !walletData) {
        return (
            <PageShell title="Overview" subtitle="Wallet summary and activity">
                <div className="p-8 space-y-6">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </PageShell>
        )
    }

    return (
        <PageShell title="Overview" subtitle="Wallet summary and activity">
            <div className="space-y-6">
                {/* Profile Header */}
                <ProfileHeader
                    profile={profile}
                    address={address}
                    isOwnProfile={isOwnProfile}
                    isClaimed={isClaimed}
                    publicProfileHref={publicProfileHref}
                    onClaimSuccess={onClaimSuccess}
                    isLoading={isLoading}
                    isEditable={isEditable}
                    onUpdate={onUpdateProfile}
                />

                {/* Profile Readiness Helper */}
                {showReadiness && (
                    <ProfileReadiness
                        profile={profile || {}}
                        address={address}
                        onClose={onDismissReadiness}
                    />
                )}

                {/* Status Hints (Mini Cards) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-card border border-border/60 shadow-sm">
                        <CardContent className="p-4 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Followers</p>
                            </div>
                            {stats.followers !== null ? (
                                <p className="text-lg font-semibold tracking-tight">
                                    {stats.followers.toLocaleString('en-US')}
                                </p>
                            ) : (
                                <Skeleton className="h-6 w-12" />
                            )}
                        </CardContent>
                    </Card>
                    <Card className="bg-card border border-border/60 shadow-sm">
                        <CardContent className="p-4 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                                <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Following</p>
                            </div>
                            {stats.following !== null ? (
                                <p className="text-lg font-semibold tracking-tight">
                                    {stats.following.toLocaleString('en-US')}
                                </p>
                            ) : (
                                <Skeleton className="h-6 w-12" />
                            )}
                        </CardContent>
                    </Card>
                    <Card className="bg-card border border-border/60 shadow-sm">
                        <CardContent className="p-4 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Views (7d)</p>
                            </div>
                            {stats.views7d !== null ? (
                                <p className="text-lg font-semibold tracking-tight">
                                    {stats.views7d.toLocaleString('en-US')}
                                </p>
                            ) : (
                                <Skeleton className="h-6 w-12" />
                            )}
                        </CardContent>
                    </Card>
                    <Card className="bg-card border border-border/60 shadow-sm opacity-50">
                        <CardContent className="p-4 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Total Links</p>
                            </div>
                            {stats.totalLinks !== null ? (
                                <p className="text-lg font-semibold tracking-tight text-muted-foreground">
                                    {stats.totalLinks.toLocaleString('en-US')}
                                </p>
                            ) : (
                                <Skeleton className="h-6 w-12" />
                            )}
                        </CardContent>
                    </Card>
                </div>


                {/* Assets Section */}
                {assets && !assets.isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tokens */}
                        <Card className="bg-card border border-border/60 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">Tokens</CardTitle>
                                <CardDescription className="text-xs">Top holdings</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {assets.tokens.length > 0 ? (
                                    assets.tokens.map((token: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                                    {token.symbol[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{token.name}</p>
                                                    <p className="text-xs text-muted-foreground">{token.symbol}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-mono">{parseFloat(token.balanceFormatted).toFixed(2)}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No tokens found.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* NFTs */}
                        <Card className="bg-card border border-border/60 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">NFTs</CardTitle>
                                <CardDescription className="text-xs">Recent collectibles</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-2">
                                    {assets.nfts.length > 0 ? (
                                        assets.nfts.slice(0, 6).map((nft: any, i: number) => (
                                            <div key={i} className="aspect-square bg-muted rounded-md overflow-hidden relative group">
                                                {nft.imageUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={nft.imageUrl} alt={nft.name} className="object-cover w-full h-full" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-1 text-center">
                                                        {nft.name}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground col-span-3">No NFTs found.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Links Section */}
                {profile?.socialLinks && profile.socialLinks.length > 0 && (
                    <Card className="bg-card border border-border/60 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Links</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {profile.socialLinks.map((link, i) => (
                                    <a
                                        key={i}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-sm transition-colors border border-border/50"
                                    >
                                        <Link2 className="h-3.5 w-3.5" />
                                        <span className="font-medium">{link.label || link.platform}</span>
                                        <ExternalLink className="h-3 w-3 text-muted-foreground ml-1" />
                                    </a>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}


                {/* Recent Activity Section (Full Width) */}
                <Card className="bg-card border border-border/60 shadow-sm relative">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                            <CardDescription className="text-xs">Last transactions</CardDescription>
                        </div>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => activity.refetch()}
                                        disabled={activity.isLoading}
                                        aria-label="Refresh activity"
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 ${activity.isLoading ? 'animate-spin' : ''}`} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Refresh activity</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </CardHeader>
                    <CardContent className="relative">
                        {activity.isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div className="flex-1 space-y-1">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activity.error ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <p className="text-sm font-medium mb-1">Failed to load activity</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => activity.refetch()}
                                    className="mt-2"
                                >
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                    Tekrar Dene
                                </Button>
                            </div>
                        ) : activity.items && activity.items.length > 0 ? (
                            <div className="space-y-3 relative">
                                {activity.items.map((tx, idx) => {
                                    return (
                                        <div key={tx.hash || idx} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                {getDirectionIcon(tx.direction)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(tx.status)}
                                                    <Badge variant="secondary" className="text-xs">
                                                        {tx.type === 'transfer' ? 'Transfer' : tx.type === 'contract' ? 'Kontrat' : 'Swap'}
                                                    </Badge>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    onClick={() => handleCopyHash(tx.hash)}
                                                                    className="text-xs font-mono truncate hover:text-primary"
                                                                >
                                                                    {formatAddress(tx.hash, 4)}
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="font-mono text-xs">{tx.hash}</p>
                                                                <p className="text-xs mt-1">Click to copy</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-xs text-muted-foreground">
                                                        {parseFloat(tx.nativeValueAvax) > 0
                                                            ? `${parseFloat(tx.nativeValueAvax).toFixed(4)} AVAX`
                                                            : tx.tokenTransfers.length > 0
                                                                ? `${parseFloat(tx.tokenTransfers[0].amount).toFixed(4)} ${tx.tokenTransfers[0].symbol}`
                                                                : '-'}
                                                    </p>
                                                    <span className="text-xs text-muted-foreground">•</span>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(tx.timestamp * 1000), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 flex-shrink-0"
                                                            asChild
                                                            aria-label="View on Explorer"
                                                        >
                                                            <a
                                                                href={getExplorerLink(tx.hash)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <ExternalLink className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>View on Explorer</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    )
                                })}
                                {activity.items.length >= 5 && (
                                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent via-background/60 to-background pointer-events-none" />
                                )}
                                <div className="pt-2 relative z-10">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => router.push(`${basePath}?tab=activity`)}
                                    >
                                        View all
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Activity className="h-10 w-10 text-muted-foreground mb-3" />
                                <p className="text-sm font-medium mb-1">No recent transactions detected</p>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Activity will appear as your wallet interacts on-chain.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`${basePath}?tab=activity`)}
                                >
                                    View all activity
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageShell>
    )
}
