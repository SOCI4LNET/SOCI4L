'use client'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Info, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { formatAddress } from '@/lib/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'

export type RoleTag = string

interface ConnectionCardProps {
    address: string
    displayName?: string | null
    avatarUrl: string
    primaryRole?: string | null
    statusMessage?: string | null
    connectionReason?: string | null
    connectionStrength?: number // 0-100 score (V2)
    followedAt: Date
    dateLabel?: string
    showUnfollow?: boolean
    onUnfollow?: (address: string) => void
    isBlocked?: boolean
    onBlock?: (address: string) => void
    onMute?: (address: string) => void
    onAddToList?: (address: string) => void
    showRemoveFollower?: boolean
    onRemoveFollower?: (address: string) => void
    isPremium?: boolean
}

export function ConnectionCard({
    address,
    displayName,
    avatarUrl,
    primaryRole,
    statusMessage,
    connectionReason,
    connectionStrength,
    followedAt,
    dateLabel,
    showUnfollow = false,
    onUnfollow,
    isBlocked = false,
    onBlock,
    showRemoveFollower = false,
    onRemoveFollower,
    onMute,
    onAddToList,
    isPremium = false,
}: ConnectionCardProps) {
    const normalizedAddr = address.toLowerCase()
    const fallbackText = address.slice(2, 4).toUpperCase()
    const shortAddress = formatAddress(address, 4)
    const primaryLabel = (displayName || '').trim() || shortAddress

    const handleUnfollow = () => {
        if (onUnfollow) {
            onUnfollow(address)
        }
    }

    const handleMute = async () => {
        try {
            const response = await fetch(`/api/profile/${address.toLowerCase()}/mute`, {
                method: 'POST',
            })
            if (response.ok) {
                toast.success('User muted')
                onMute?.(address)
            } else {
                toast.error('Failed to mute user')
            }
        } catch (error) {
            toast.error('Failed to mute user')
        }
    }

    // ... (keep avatar and identity rendering)

    return (
        <div className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors border-b border-border/40 last:border-b-0">
            {/* Avatar */}
            <Avatar className="h-11 w-11 flex-shrink-0">
                <AvatarImage src={avatarUrl} alt={shortAddress} />
                <AvatarFallback className="text-xs">{fallbackText}</AvatarFallback>
            </Avatar>

            {/* Identity + Labels */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{primaryLabel}</p>
                    {isPremium && (
                        <Badge variant="default" className="text-[10px] h-4 px-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold border-0 shadow-sm flex items-center gap-0.5">
                            <Sparkles className="h-2.5 w-2.5 fill-white/20" />
                            Pro
                        </Badge>
                    )}
                </div>
                <p className="text-xs font-mono text-muted-foreground truncate">
                    {shortAddress}
                </p>

                {/* Status Message */}
                {statusMessage && (
                    <p className="text-xs text-foreground/80 italic truncate mt-0.5">
                        {statusMessage}
                    </p>
                )}

                {/* Role tag */}
                {primaryRole && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                        {primaryRole}
                    </Badge>
                )}

                {/* Connection reason & Score */}
                {(connectionReason || (connectionStrength !== undefined && connectionStrength > 0)) && (
                    <div className="flex items-center gap-2 mt-2">
                        {connectionReason && (
                            <p className="text-xs text-muted-foreground">
                                {connectionReason}
                            </p>
                        )}
                        {connectionStrength !== undefined && connectionStrength > 0 && (
                            <div className="flex items-center gap-1.5">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1.5 cursor-help">
                                                <div className="h-1.5 w-12 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary/70 rounded-full"
                                                        style={{ width: `${connectionStrength}%` }}
                                                    />
                                                </div>
                                                <Info className="h-3 w-3 text-muted-foreground/70" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[240px] text-xs">
                                            <p className="font-semibold mb-1">Bağlantı Gücü ({connectionStrength}%)</p>
                                            <p>Bu skor profilin güvenilirliğini; karşılıklı takip, hesap yaşı, profil doluluğu ve sistem rollerine göre belirler.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        )}
                    </div>
                )}

                {/* Followed date */}
                <p className="text-[11px] text-muted-foreground mt-0.5">
                    {dateLabel || 'Followed on'} {new Date(followedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-8 text-xs"
                >
                    <Link href={`/p/${normalizedAddr}`}>View</Link>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label="More actions"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                            toast.info('List feature coming soon')
                            onAddToList?.(address)
                        }}>
                            Add to list
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleMute}>
                            Mute
                        </DropdownMenuItem>

                        {showRemoveFollower && (
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onRemoveFollower?.(address)}
                            >
                                Remove follower
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className={isBlocked ? "text-foreground" : "text-destructive focus:text-destructive"}
                            onClick={() => onBlock?.(address)}
                        >
                            {isBlocked ? "Unblock user" : "Block user"}
                        </DropdownMenuItem>

                        {showUnfollow && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={handleUnfollow}
                                >
                                    Unfollow
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
