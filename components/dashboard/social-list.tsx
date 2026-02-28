import { ConnectionCard } from '@/components/dashboard/connection-card'
import { Skeleton } from '@/components/ui/skeleton'
import { UserPlus } from 'lucide-react'
import { SocialEmptyState } from './social-empty-state'
import { FollowItem } from '@/hooks/use-social-actions'

interface SocialListProps {
    items: FollowItem[]
    loading: boolean
    emptyTitle: string
    emptyHelper: string
    showUnfollow?: boolean
    suggestions?: any[]
    dateLabel?: string
    showRemoveFollower?: boolean
    onUnfollow?: (address: string) => void
    onBlock?: (address: string) => void
    onRemoveFollower?: (address: string) => void
    onCopyLink?: () => void
    onShareTwitter?: () => void
    onShareNative?: () => void
    onShowQrCode?: () => void
}

export function SocialList({
    items,
    loading,
    emptyTitle,
    emptyHelper,
    showUnfollow = false,
    suggestions = [],
    dateLabel = 'Followed on',
    showRemoveFollower = false,
    onUnfollow,
    onBlock,
    onRemoveFollower,
    onCopyLink,
    onShareTwitter,
    onShareNative,
    onShowQrCode,
}: SocialListProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const suggestionsBlock = suggestions && suggestions.length > 0 && (
        <div className="w-full mt-8 text-left border-t pt-6">
            <h4 className="text-sm font-semibold mb-3 px-1 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                Suggested for you
            </h4>
            <div className="space-y-0 border rounded-md overflow-hidden">
                {suggestions.map((s) => (
                    <ConnectionCard
                        key={s.address}
                        address={s.address}
                        displayName={s.displayName}
                        avatarUrl={`https://effigy.im/a/${s.address.toLowerCase()}.svg`}
                        primaryRole={s.primaryRole}
                        statusMessage={s.statusMessage}
                        connectionReason={s.reason}
                        followedAt={new Date(s.createdAt)}
                        dateLabel="Joined"
                        isPremium={s.isPremium}
                    />
                ))}
            </div>
        </div>
    )

    if (items.length === 0) {
        return (
            <SocialEmptyState
                emptyTitle={emptyTitle}
                emptyHelper={emptyHelper}
                suggestions={suggestions}
                onCopyLink={onCopyLink}
                onShareTwitter={onShareTwitter}
                onShareNative={onShareNative}
                onShowQrCode={onShowQrCode}
            />
        )
    }

    return (
        <div className="space-y-0">
            {items.map((item) => (
                <ConnectionCard
                    key={item.address}
                    address={item.address}
                    displayName={item.displayName}
                    avatarUrl={`https://effigy.im/a/${item.address.toLowerCase()}.svg`}
                    followedAt={new Date(item.createdAt)}
                    showUnfollow={showUnfollow}
                    onUnfollow={onUnfollow}
                    onBlock={onBlock}
                    isBlocked={item.isBlocked}
                    showRemoveFollower={showRemoveFollower}
                    onRemoveFollower={onRemoveFollower}
                    connectionStrength={item.score}
                    connectionReason={item.reason}
                    primaryRole={item.primaryRole}
                    statusMessage={item.statusMessage}
                    dateLabel={dateLabel}
                    isPremium={item.isPremium}
                />
            ))}
            {suggestionsBlock}
        </div>
    )
}
