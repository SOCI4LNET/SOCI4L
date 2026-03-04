'use client'

import { useState, useEffect } from 'react'
import { Bell, ArrowRight, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatAddress } from '@/lib/utils'

interface Notification {
    id: string
    profileId: string
    type: string
    isRead: boolean
    actorAddress: string | null
    metadata: string | null
    createdAt: string
}

interface NotificationsDropdownProps {
    address: string
}

export function NotificationsDropdown({ address }: NotificationsDropdownProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`/api/notifications?address=${address}`)
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications || [])
                setUnreadCount(data.unreadCount || 0)
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (address) {
            fetchNotifications()

            // Poll every 30 seconds
            const interval = setInterval(fetchNotifications, 30000)
            return () => clearInterval(interval)
        }
    }, [address])

    const markAllAsRead = async () => {
        if (unreadCount === 0) return

        setUnreadCount(0)
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))

        try {
            await fetch(`/api/notifications?address=${address}`, {
                method: 'PATCH',
            })
        } catch (error) {
            console.error('Failed to mark as read', error)
        }
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (open) {
            // Small delay before marking as read to allow user to see the badge
            setTimeout(() => {
                markAllAsRead()
            }, 1500)
        }
    }

    const handleNotificationClick = (notification: Notification) => {
        if (notification.actorAddress) {
            router.push(`/p/${notification.actorAddress}`)
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full border border-border bg-background">
                    <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[380px] p-0 overflow-hidden sm:max-w-md">
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                    <p className="font-semibold text-sm">Notifications</p>
                    {unreadCount > 0 && (
                        <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-[300px] text-center px-4">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <Bell className="h-5 w-5 text-muted-foreground opacity-50" />
                            </div>
                            <p className="font-medium text-sm">Burası çok sessiz...</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                When someone interacts with your profile or sends a donation, you'll see it here.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => {
                                let metadata: any = {}
                                try {
                                    metadata = notification.metadata ? JSON.parse(notification.metadata) : {}
                                } catch (e) { }

                                const actorAddress = notification.actorAddress
                                const avatarUrl = actorAddress ? `https://effigy.im/a/${actorAddress.toLowerCase()}.svg` : ''
                                const fallback = actorAddress ? actorAddress.slice(2, 4) : 'AV'

                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`flex items-start gap-3 p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-primary/5' : ''}`}
                                    >
                                        {/* Unread indicator */}
                                        {!notification.isRead && (
                                            <div className="mt-2 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                        )}

                                        {/* Avatar */}
                                        <Avatar className={`h-10 w-10 border flex-shrink-0 ${notification.isRead ? 'opacity-80' : ''}`}>
                                            {avatarUrl && <AvatarImage src={avatarUrl} />}
                                            <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
                                        </Avatar>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <span className="font-medium text-sm truncate">
                                                    {actorAddress ? formatAddress(actorAddress, 4) : 'Someone'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>

                                            {notification.type === 'DONATION_RECEIVED' && (
                                                <>
                                                    <p className="text-xs text-foreground/80 leading-snug">
                                                        Sent you <span className="font-semibold text-primary">{metadata.amount} AVAX</span>
                                                    </p>
                                                    {metadata.message && (
                                                        <p className="text-xs text-muted-foreground mt-1 italic truncate bg-muted/40 p-1.5 rounded-md border border-border/50">
                                                            "{metadata.message}"
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Action Icon */}
                                        <div className="mt-2 text-muted-foreground/40 hover:text-foreground transition-colors">
                                            <ExternalLink className="h-4 w-4" />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>

                {notifications.length > 0 && (
                    <div className="p-2 bg-muted/30 border-t text-center">
                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}>
                            Mark all as read
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
