'use client'

import { useDemo } from '@/lib/demo/demo-context'
import { OverviewPanelContent } from '@/components/dashboard/overview-panel-content'
import { getPublicProfileHref } from '@/lib/routing'

export function DemoOverviewPanel() {
    const { profile, walletData, isLoading, mode, updateProfile, session } = useDemo()

    const baseStats = {
        followers: 420,
        following: 69,
        views7d: 1337,
        totalLinks: profile.socialLinks?.length || 0,
    }

    const stats = {
        ...baseStats,
        ...(session?.statsOverrides || {})
    }

    // Transform transactions matches mostly
    const activityItems = walletData.transactions.map(tx => ({
        ...tx,
        nativeValueAvax: tx.value,
        tokenTransfers: [],
        direction: tx.type === 'send' ? 'outgoing' : 'incoming',
        status: 'success',
    }))

    const assets = {
        tokens: walletData.tokenBalances.map(t => ({
            address: t.contractAddress,
            symbol: t.symbol,
            name: t.name,
            balanceFormatted: t.balance,
            isNative: false
        })),
        nfts: walletData.nfts.map(n => ({
            contract: n.contractAddress,
            tokenId: n.tokenId,
            name: n.name,
            imageUrl: n.image
        })),
        isLoading: false
    }

    const isOwnProfile = mode === 'sandbox'
    const isEditable = mode === 'sandbox'

    const publicProfileHref = getPublicProfileHref(walletData.address, profile.slug)

    return (
        <OverviewPanelContent
            walletData={walletData as any}
            profile={profile}
            address={walletData.address}
            isOwnProfile={isOwnProfile}
            stats={stats}
            activity={{
                items: activityItems as any,
                isLoading: false,
                error: null,
                refetch: () => console.log('Refetch mocked')
            }}
            assets={assets}
            isClaimed={profile.status === 'CLAIMED'}
            publicProfileHref={publicProfileHref}
            onClaimSuccess={() => console.log('Claim mocked')}
            isLoading={isLoading}
            showReadiness={mode === 'sandbox'}
            onDismissReadiness={() => console.log('Readiness dismissed')}

            // Nav & Edit
            basePath={mode === 'sandbox' ? '/demo/sandbox' : '/demo'}
            isEditable={isEditable}
            onUpdateProfile={updateProfile as any}
        />
    )
}
