import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDemo } from '@/lib/demo/demo-context'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'

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
    const { isDemo, mode, session, updateProfile: updateDemoProfile } = useDemo()
    const queryClient = useQueryClient()
    const params = useParams()
    const { address: connectedAddress } = useAccount()

    // Determine address
    const address = targetAddress?.toLowerCase() ||
        (params.address as string)?.toLowerCase() ||
        connectedAddress?.toLowerCase() || ''

    const shouldFetch = !isDemo && !!address

    // --- Query ---
    const profileQuery = useQuery({
        queryKey: ['profile', address],
        queryFn: async () => {
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
                showcase: data.showcase || p.showcase || [],
                slug: p.slug,
                isPublic: p.visibility === 'PUBLIC',
                ownerAddress: p.ownerAddress,
                layout: data.layout,
                appearance: data.appearance
            } as UserProfile
        },
        enabled: shouldFetch
    })

    // --- Demo Data ---
    const demoProfile: UserProfile = {
        id: 'demo-id',
        address: '0xdemo...',
        displayName: session?.profileOverrides?.displayName || 'Demo User',
        bio: session?.profileOverrides?.bio || 'This is a demo profile.',
        primaryRole: session?.profileOverrides?.primaryRole || 'Creator',
        secondaryRoles: session?.profileOverrides?.secondaryRoles || [],
        statusMessage: session?.profileOverrides?.statusMessage || 'Building...',
        socialLinks: (session?.profileOverrides?.socialLinks || []) as SocialLink[],
        showcase: session?.profileOverrides?.showcase || [],
        slug: 'demo',
        isPublic: true,
        ownerAddress: '0xdemo...',
        // Demo context doesn't track layout/appearance overrides deeply yet, 
        // but we could mock defaults or read from session if we add them.
        layout: null,
        appearance: null
    }

    const profile = isDemo ? demoProfile : (profileQuery.data || null)
    const loading = isDemo ? false : profileQuery.isLoading

    // --- Mutations ---

    // Generic update for identity fields (Name, Bio, Roles, Status)
    const updateIdentity = async (updates: Partial<UserProfile>) => {
        if (isDemo) {
            if (mode === 'public') { toast.info('Read only'); return false }
            updateDemoProfile(updates)
            if (mode === 'sandbox') toast.success('Saved to Sandbox')
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

    // Update Settings (Slug, Visibility) -> api/profile/update
    const updateSettings = async (updates: { slug?: string, isPublic?: boolean }) => {
        if (isDemo) {
            if (mode === 'public') { toast.info('Read only'); return false }
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

    // Update Showcase -> api/profile/update
    const updateShowcase = async (showcase: ShowcaseItem[]) => {
        if (isDemo) {
            if (mode === 'public') { toast.info('Read only'); return false }
            updateDemoProfile({ showcase })
            return true
        }

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

    // Update Layout -> api/profile/layout
    const updateLayout = async (layout: any) => {
        if (isDemo) {
            if (mode === 'public') { toast.info('Read only'); return false }
            // Mock save
            return true
        }

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

    // Update Appearance -> api/profile/appearance
    const updateAppearance = async (appearance: any) => {
        if (isDemo) {
            if (mode === 'public') { toast.info('Read only'); return false }
            // Mock save
            return true
        }

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
        profile,
        loading,
        updateIdentity,
        updateSettings,
        updateShowcase,
        updateLayout,
        updateAppearance,
        isReadOnly: isDemo && mode === 'public',
        isDemo
    }
}
