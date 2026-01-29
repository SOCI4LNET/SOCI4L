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
import { MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { formatAddress } from '@/lib/utils'

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
    showUnfollow?: boolean
    onUnfollow?: (address: string) => void
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
    showUnfollow = false,
    onUnfollow,
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

    return (
        <div className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors border-b border-border/40 last:border-b-0">
            {/* Avatar */}
            <Avatar className="h-11 w-11 flex-shrink-0">
                <AvatarImage src={avatarUrl} alt={shortAddress} />
                <AvatarFallback className="text-xs">{fallbackText}</AvatarFallback>
            </Avatar>

            {/* Identity + Labels */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{primaryLabel}</p>
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
                    <div className="flex items-center gap-2 mt-1">
                        {connectionReason && (
                            <p className="text-xs text-muted-foreground">
                                {connectionReason}
                            </p>
                        )}
                        {connectionStrength !== undefined && connectionStrength > 0 && (
                            <div className="flex items-center gap-1" title={`Connection Score: ${connectionStrength}`}>
                                <div className="h-1.5 w-12 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary/70 rounded-full"
                                        style={{ width: `${connectionStrength}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Followed date (only when showing unfollow) */}
                {showUnfollow && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        Followed on {new Date(followedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                )}
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
                        <DropdownMenuItem>Add to list</DropdownMenuItem>
                        <DropdownMenuItem>Mute</DropdownMenuItem>
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
