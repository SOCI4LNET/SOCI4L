"use client"

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { UserX, VolumeX } from "lucide-react"
import { toast } from "sonner"
import { formatAddress } from "@/lib/utils"

interface BlockedUser {
    address: string
    displayName: string | null
    blockedAt: string
}

interface MutedUser {
    address: string
    displayName: string | null
    mutedAt: string
}

export function BlockedUsersList() {
    const queryClient = useQueryClient()
    const [unblockingIds, setUnblockingIds] = useState<Set<string>>(new Set())

    const { data: blockedUsers, isLoading, error } = useQuery({
        queryKey: ["blocked-users"],
        queryFn: async () => {
            const response = await fetch("/api/me/blocked")
            if (!response.ok) throw new Error("Failed to fetch blocked users")
            const data = await response.json()
            return data.blockedUsers as BlockedUser[]
        },
    })

    const handleUnblock = async (address: string) => {
        try {
            setUnblockingIds(prev => new Set(prev).add(address))
            const response = await fetch(`/api/profile/${address.toLowerCase()}/block`, {
                method: "DELETE",
            })

            if (!response.ok) throw new Error("Failed to unblock")

            toast.success("User unblocked")
            queryClient.invalidateQueries({ queryKey: ["blocked-users"] })
        } catch (error) {
            toast.error("Failed to unblock user")
        } finally {
            setUnblockingIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(address)
                return newSet
            })
        }
    }

    if (isLoading) return <LoadingState />
    if (error) return <div className="text-red-500">Failed to load blocked users</div>

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserX className="h-5 w-5" />
                    Blocked Users
                </CardTitle>
                <CardDescription>
                    Users you have blocked cannot follow you or see your profile.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {blockedUsers?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No blocked users
                    </div>
                ) : (
                    <div className="space-y-4">
                        {blockedUsers?.map((user) => (
                            <div key={user.address} className="flex items-center justify-between p-2 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={`https://effigy.im/a/${user.address}.svg`} />
                                        <AvatarFallback>
                                            {user.address.slice(2, 4).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">
                                            {user.displayName || formatAddress(user.address)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Blocked on {new Date(user.blockedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUnblock(user.address)}
                                    disabled={unblockingIds.has(user.address)}
                                >
                                    Unblock
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export function MutedUsersList() {
    const queryClient = useQueryClient()
    const [unmutingIds, setUnmutingIds] = useState<Set<string>>(new Set())

    const { data: mutedUsers, isLoading, error } = useQuery({
        queryKey: ["muted-users"],
        queryFn: async () => {
            const response = await fetch("/api/me/muted")
            if (!response.ok) throw new Error("Failed to fetch muted users")
            const data = await response.json()
            return data.mutedUsers as MutedUser[]
        },
    })

    const handleUnmute = async (address: string) => {
        try {
            setUnmutingIds(prev => new Set(prev).add(address))
            const response = await fetch(`/api/profile/${address.toLowerCase()}/mute`, {
                method: "DELETE",
            })

            if (!response.ok) throw new Error("Failed to unmute")

            toast.success("User unmuted")
            queryClient.invalidateQueries({ queryKey: ["muted-users"] })
        } catch (error) {
            toast.error("Failed to unmute user")
        } finally {
            setUnmutingIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(address)
                return newSet
            })
        }
    }

    if (isLoading) return <LoadingState />
    if (error) return <div className="text-red-500">Failed to load muted users</div>

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <VolumeX className="h-5 w-5" />
                    Muted Users
                </CardTitle>
                <CardDescription>
                    Muted users' posts will not appear in your feed. They will not be notified.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {mutedUsers?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No muted users
                    </div>
                ) : (
                    <div className="space-y-4">
                        {mutedUsers?.map((user) => (
                            <div key={user.address} className="flex items-center justify-between p-2 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={`https://effigy.im/a/${user.address}.svg`} />
                                        <AvatarFallback>
                                            {user.address.slice(2, 4).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">
                                            {user.displayName || formatAddress(user.address)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Muted on {new Date(user.mutedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUnmute(user.address)}
                                    disabled={unmutingIds.has(user.address)}
                                >
                                    Unmute
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function LoadingState() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-8 w-20" />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
