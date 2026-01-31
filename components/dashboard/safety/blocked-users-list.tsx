import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useServerAuth } from "@/hooks/use-server-auth"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { UserX, VolumeX } from "lucide-react"
import { formatAddress } from "@/lib/utils"

interface BlockedUser {
    address: string
    displayName?: string
    blockedAt: string
}

interface MutedUser {
    address: string
    displayName?: string
    mutedAt: string
}
export function BlockedUsersList() {
    const queryClient = useQueryClient()
    const { ensureSession } = useServerAuth()
    const [unblockingIds, setUnblockingIds] = useState<Set<string>>(new Set())

    const { data: blockedUsers, isLoading, error } = useQuery({
        queryKey: ["blocked-users"],
        queryFn: async () => {
            const response = await fetch("/api/me/blocked")
            if (response.status === 401) throw new Error("Unauthorized")
            if (!response.ok) throw new Error("Failed to fetch blocked users")
            const data = await response.json()
            return data.blockedUsers as BlockedUser[]
        },
        retry: (failureCount, error: any) => {
            if (error.message === "Unauthorized") return false
            return failureCount < 2
        }
    })

    const handleUnblock = async (address: string) => {
        try {
            const hasSession = await ensureSession()
            if (!hasSession) return

            setUnblockingIds(prev => new Set(prev).add(address))
            const response = await fetch(`/api/profile/${address.toLowerCase()}/block`, {
                method: "POST",
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

    const handleAuth = async () => {
        const success = await ensureSession()
        if (success) {
            queryClient.invalidateQueries({ queryKey: ["blocked-users"] })
        }
    }

    if (isLoading) return <LoadingState />

    if (error) {
        if (error.message === "Unauthorized") {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserX className="h-5 w-5" />
                            Blocked Users
                        </CardTitle>
                        <CardDescription>
                            Sign in to view your blocked users.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <p className="text-sm text-muted-foreground text-center">
                                You need to verify your wallet ownership to see this private list.
                            </p>
                            <Button onClick={handleAuth}>Verify Ownership</Button>
                        </div>
                    </CardContent>
                </Card>
            )
        }
        return <div className="text-red-500">Failed to load blocked users</div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserX className="h-5 w-5" />
                    Blocked Users
                </CardTitle>
                <CardDescription>
                    Users you have blocked cannot follow you or see your profile. Control your interactions here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {blockedUsers?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                        <div className="p-3 bg-muted rounded-full">
                            <UserX className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">No blocked users</p>
                            <p className="text-sm text-muted-foreground w-full max-w-[250px] mx-auto">
                                You haven&apos;t blocked anyone yet. Control who can interact with you here.
                            </p>
                        </div>
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
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                    >
                                        <a href={`/p/${user.address}`} target="_blank" rel="noopener noreferrer">
                                            View Profile
                                        </a>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUnblock(user.address)}
                                        disabled={unblockingIds.has(user.address)}
                                    >
                                        Unblock
                                    </Button>
                                </div>
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
    const { ensureSession } = useServerAuth()
    const [unmutingIds, setUnmutingIds] = useState<Set<string>>(new Set())

    const { data: mutedUsers, isLoading, error } = useQuery({
        queryKey: ["muted-users"],
        queryFn: async () => {
            const response = await fetch("/api/me/muted")
            if (response.status === 401) throw new Error("Unauthorized")
            if (!response.ok) throw new Error("Failed to fetch muted users")
            const data = await response.json()
            return data.mutedUsers as MutedUser[]
        },
        retry: (failureCount, error: any) => {
            if (error.message === "Unauthorized") return false
            return failureCount < 2
        }
    })

    const handleUnmute = async (address: string) => {
        try {
            const hasSession = await ensureSession()
            if (!hasSession) return

            setUnmutingIds(prev => new Set(prev).add(address))
            const response = await fetch(`/api/profile/${address.toLowerCase()}/mute`, {
                method: "POST",
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

    const handleAuth = async () => {
        const success = await ensureSession()
        if (success) {
            queryClient.invalidateQueries({ queryKey: ["muted-users"] })
        }
    }

    if (isLoading) return <LoadingState />

    if (error) {
        if (error.message === "Unauthorized") {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <VolumeX className="h-5 w-5" />
                            Muted Users
                        </CardTitle>
                        <CardDescription>
                            Sign in to view your muted users.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <p className="text-sm text-muted-foreground text-center">
                                You need to verify your wallet ownership to see this private list.
                            </p>
                            <Button onClick={handleAuth}>Verify Ownership</Button>
                        </div>
                    </CardContent>
                </Card>
            )
        }
        return <div className="text-red-500">Failed to load muted users</div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <VolumeX className="h-5 w-5" />
                    Muted Users
                </CardTitle>
                <CardDescription>
                    Muted users' posts will not appear in your feed. Control visibility here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {mutedUsers?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                        <div className="p-3 bg-muted rounded-full">
                            <VolumeX className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">No muted users</p>
                            <p className="text-sm text-muted-foreground w-full max-w-[250px] mx-auto">
                                You haven&apos;t muted anyone yet. Muted users won&apos;t appear in your feed.
                            </p>
                        </div>
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
