import { Users, UserPlus, Share2, Copy, Twitter, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ConnectionCard } from '@/components/dashboard/connection-card'

interface SocialEmptyStateProps {
    emptyTitle: string
    emptyHelper: string
    suggestions?: any[]
    onCopyLink?: () => void
    onShareTwitter?: () => void
    onShareNative?: () => void
    onShowQrCode?: () => void
}

export function SocialEmptyState({
    emptyTitle,
    emptyHelper,
    suggestions = [],
    onCopyLink,
    onShareTwitter,
    onShareNative,
    onShowQrCode,
}: SocialEmptyStateProps) {
    const isFollowers = emptyTitle.toLowerCase().includes('followers')

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed rounded-lg">
            {isFollowers ? (
                <Users className="h-10 w-10 text-muted-foreground" />
            ) : (
                <UserPlus className="h-10 w-10 text-muted-foreground" />
            )}
            <div>
                <p className="text-sm font-medium mb-1 mt-4">{emptyTitle}</p>
                <p className="text-xs text-muted-foreground mb-4">
                    {emptyHelper}
                </p>
            </div>

            {emptyTitle === 'No followers yet' && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Share2 className="mr-2 h-3.5 w-3.5" />
                            Share your profile
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center">
                        {onCopyLink && (
                            <DropdownMenuItem onClick={onCopyLink}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy profile link
                            </DropdownMenuItem>
                        )}
                        {onShareTwitter && (
                            <DropdownMenuItem onClick={onShareTwitter}>
                                <Twitter className="mr-2 h-4 w-4" />
                                Share on X
                            </DropdownMenuItem>
                        )}
                        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && onShareNative && (
                            <DropdownMenuItem onClick={onShareNative}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Share via...
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {onShowQrCode && (
                            <DropdownMenuItem onClick={onShowQrCode}>
                                <QrCode className="mr-2 h-4 w-4" />
                                Show QR code
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {suggestions && suggestions.length > 0 && (
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
            )}
        </div>
    )
}
