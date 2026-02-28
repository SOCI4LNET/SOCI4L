import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { FilterType, SortType } from '@/components/dashboard/social-filter-bar'
import { RoleTag } from '@/components/dashboard/connection-card'

export interface FollowItem {
    address: string
    createdAt: string
    displayName?: string | null
    slug?: string | null
    score?: number
    reason?: string
    primaryRole?: RoleTag
    statusMessage?: string | null
    isBlocked?: boolean
    isPremium?: boolean
}

export function useSocialActions(address: string, filter: FilterType, sort: SortType) {
    const queryClient = useQueryClient()

    const handleFollow = useCallback(async (targetAddress: string) => {
        try {
            const normalizedTargetAddress = targetAddress.toLowerCase()
            const response = await fetch(`/api/profile/${normalizedTargetAddress}/follow`, {
                method: 'POST',
                credentials: 'include',
            })
            if (response.ok) {
                toast.success('Followed successfully')
                queryClient.invalidateQueries({ queryKey: ['following', address?.toLowerCase(), filter, sort] })
            } else {
                toast.error('Failed to follow')
            }
        } catch (e) {
            toast.error('Failed to follow')
        }
    }, [address, filter, sort, queryClient])

    const handleUnfollow = useCallback(async (targetAddress: string) => {
        try {
            const normalizedTargetAddress = targetAddress.toLowerCase()
            const response = await fetch(`/api/profile/${normalizedTargetAddress}/follow`, {
                method: 'DELETE',
                credentials: 'include',
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Unfollow failed')
            }

            queryClient.setQueryData(['following', address?.toLowerCase(), filter, sort], (prev: FollowItem[] | undefined) =>
                prev?.filter((item) => item.address.toLowerCase() !== normalizedTargetAddress) || []
            )

            toast.success('Unfollowed successfully')
        } catch (error: any) {
            console.error('Error unfollowing:', error)
            toast.error('Failed to unfollow. Please try again.')
        }
    }, [address, filter, sort, queryClient])

    const handleBlock = useCallback(async (targetAddress: string) => {
        try {
            const normalizedTargetAddress = targetAddress.toLowerCase()
            const response = await fetch(`/api/profile/${normalizedTargetAddress}/block`, {
                method: 'POST',
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('Block action failed')
            }

            const { blocked } = await response.json()

            if (blocked) {
                queryClient.setQueryData(['followers', address?.toLowerCase(), filter, sort], (prev: FollowItem[] | undefined) =>
                    prev?.filter(f => f.address.toLowerCase() !== normalizedTargetAddress) || []
                )
                queryClient.setQueryData(['following', address?.toLowerCase(), filter, sort], (prev: FollowItem[] | undefined) =>
                    prev?.filter(f => f.address.toLowerCase() !== normalizedTargetAddress) || []
                )
                toast.success('User blocked successfully')
            } else {
                toast.success('User unblocked successfully')
            }
        } catch (error) {
            console.error('Error blocking:', error)
            toast.error('Failed to block user')
        }
    }, [address, filter, sort, queryClient])

    const handleRemoveFollower = useCallback(async (targetAddress: string) => {
        try {
            const normalizedTargetAddress = targetAddress.toLowerCase()
            const response = await fetch(`/api/profile/${normalizedTargetAddress}/remove-follower`, {
                method: 'DELETE',
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('Failed to remove follower')
            }

            queryClient.setQueryData(['followers', address?.toLowerCase(), filter, sort], (prev: FollowItem[] | undefined) =>
                prev?.filter(f => f.address.toLowerCase() !== normalizedTargetAddress) || []
            )
            toast.success('Follower removed')
        } catch (error) {
            console.error('Error removing follower:', error)
            toast.error('Failed to remove follower')
        }
    }, [address, filter, sort, queryClient])

    return { handleFollow, handleUnfollow, handleBlock, handleRemoveFollower }
}
