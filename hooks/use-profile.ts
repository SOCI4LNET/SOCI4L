import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useDemo } from '@/lib/demo/demo-context'

export type SocialLink = {
    id: string
    platform: 'website' | 'x' | 'instagram' | 'github' | 'youtube' | 'linkedin'
    url: string
    label?: string
}

export type ShowcaseItem = {
    contractAddress: string
    tokenId: string
}

export type UserProfile = {
    id: string
    address: string
    displayName: string | null
    bio: string | null
    primaryRole: string | null
    secondaryRoles: string[]
    statusMessage: string | null
    socialLinks: SocialLink[]
    showcase: ShowcaseItem[]
    slug?: string
    isPublic?: boolean
    ownerAddress?: string
    layout?: any
    appearance?: any
}

export function useProfile(targetAddress?: string) {
    const queryClient = useQueryClient()
    const params = useParams()
    const { address: connectedAddress } = useAccount()

    // Determine address
    const address = targetAddress?.toLowerCase() ||
        (params.address as string)?.toLowerCase() ||
        connectedAddress?.toLowerCase() || ''

    const { isDemo, profile: demoProfile, updateProfile: demoUpdateProfile } = useDemo()

    // --- Query ---
    const profileQuery = useQuery({
        queryKey: ['profile', address],
        queryFn: async () => {
            if (isDemo && demoProfile) {
                // Map DemoProfile to UserProfile
                return {
                    id: demoProfile.id,
                    address: demoProfile.address,
                    displayName: demoProfile.displayName || null,
                    bio: demoProfile.bio || null,
                    primaryRole: demoProfile.primaryRole || null,
                    secondaryRoles: demoProfile.secondaryRoles || [],
                    statusMessage: demoProfile.statusMessage || null,
                    socialLinks: (demoProfile.socialLinks || [])
                        .filter(l => l.platform !== 'Custom Link')
                        .map(l => ({
                            id: l.id,
                            platform: l.platform as any,
                            url: l.url,
                            label: l.label
                        })),
                    showcase: [], // Demo doesn't support showcase editing yet
                    slug: demoProfile.slug || undefined,
                    isPublic: demoProfile.visibility === 'PUBLIC',
                    ownerAddress: demoProfile.ownerAddress || undefined,
                    layout: null, // Could support layout overrides
                    appearance: null
                } as UserProfile
            }

            if (!address) return null
            const res = await fetch(`/api/wallet?address=${encodeURIComponent(address)}`)
            if (!res.ok) throw new Error('Failed to fetch profile')
            const data = await res.json()

            // Transform response to match UserProfile
            const p = data.profile || {}

            return {
                id: p.id,
                address: p.address,
                displayName: p.displayName,
                bio: p.bio,
                primaryRole: p.primaryRole,
                secondaryRoles: p.secondaryRoles || [],
                statusMessage: p.statusMessage,
                socialLinks: p.socialLinks || [],
                showcase: p.showcase || [],
                slug: p.slug,
                isPublic: p.visibility === 'PUBLIC',
                ownerAddress: p.ownerAddress,
                layout: data.layout,
                appearance: data.appearance
            } as UserProfile
        },
        enabled: (!!address) || isDemo // Enable if demo mode
    })

    const loading = profileQuery.isLoading

    // --- Mutations ---

    // Update Identity (Name, Bio, Roles, Status)
    const updateIdentity = async (updates: Partial<UserProfile>) => {
        if (isDemo) {
            demoUpdateProfile(updates)
            return true
        }

        try {
            const res = await fetch('/api/profile/social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    ...updates
                })
            })
            if (!res.ok) throw new Error('Failed')

            await profileQuery.refetch()
            return true
        } catch (e) {
            toast.error('Failed to update profile')
            return false
        }
    }

    // Update Settings (Slug, Visibility)
    const updateSettings = async (updates: { slug?: string, isPublic?: boolean }) => {
        if (isDemo) {
            demoUpdateProfile({
                slug: updates.slug,
                visibility: updates.isPublic ? 'PUBLIC' : 'PRIVATE'
            })
            return true
        }

        try {
            const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    ...updates
                })
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed')
            }
            await profileQuery.refetch()
            return true
        } catch (e: any) {
            toast.error(e.message || 'Failed to update settings')
            return false
        }
    }

    // Update Showcase
    const updateShowcase = async (showcase: ShowcaseItem[]) => {
        if (isDemo) return true // No-op

        try {
            const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    showcase
                })
            })
            if (!res.ok) throw new Error('Failed')
            await profileQuery.refetch()
            return true
        } catch (e) {
            toast.error('Failed to update showcase')
            return false
        }
    }

    // Update Layout
    const updateLayout = async (layout: any) => {
        if (isDemo) return true // No-op

        try {
            const res = await fetch('/api/profile/layout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    layout
                })
            })
            if (!res.ok) throw new Error('Failed')
            await profileQuery.refetch()
            return true
        } catch (e) {
            toast.error('Failed to update layout')
            return false
        }
    }

    // Update Appearance
    const updateAppearance = async (appearance: any) => {
        if (isDemo) return true // No-op

        try {
            const res = await fetch('/api/profile/appearance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    appearance
                })
            })
            if (!res.ok) throw new Error('Failed')
            await profileQuery.refetch()
            return true
        } catch (e) {
            toast.error('Failed to update appearance')
            return false
        }
    }

    return {
        profile: profileQuery.data || null,
        loading,
        updateIdentity,
        updateSettings,
        updateShowcase,
        updateLayout,
        updateAppearance,
        isReadOnly: false,
        isDemo
    }
}
