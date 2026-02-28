'use client'
import { PageShell } from "@/components/app-shell/page-shell"
import { ProfileReadiness } from "@/components/dashboard/profile-readiness"
import { Skeleton } from "@/components/ui/skeleton"
import { ProfileHeader } from "./profile-header"
import type { ActivityTransaction } from "@/lib/activity/fetchActivity"

import { OverviewStatsCards } from "./overview-stats-cards"
import { OverviewLinks } from "./overview-links"
import { OverviewAssets } from "./overview-assets"
import { OverviewActivity } from "./overview-activity"

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
    socialLinks?: Array<{ id?: string; platform?: string; type?: string; url: string; label?: string; category?: string }> | null
    primaryRole?: string | null
    secondaryRoles?: string[] | null
    statusMessage?: string | null
    isPremium?: boolean | null
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
                <OverviewStatsCards stats={stats} />

                {/* Links Section */}
                {profile?.socialLinks && profile.socialLinks.length > 0 && (
                    <OverviewLinks links={profile.socialLinks as any} />
                )}

                {/* Assets Section */}
                {assets && !assets.isLoading && (
                    <OverviewAssets assets={assets} />
                )}

                {/* Recent Activity Section (Full Width) */}
                <OverviewActivity activity={activity} basePath={basePath} />
            </div>
        </PageShell>
    )
}
