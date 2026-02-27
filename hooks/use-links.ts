import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useDemo } from '@/lib/demo/demo-context'

export type LinkItem = {
    id: string
    title: string
    url: string
    enabled: boolean
    categoryId?: string | null
    order?: number
    createdAt: string
    updatedAt: string
}

export type LinkCategory = {
    id: string
    name: string
    slug: string
    description?: string | null
    order: number
    isVisible: boolean
    isDefault: boolean
    linkCount?: number
    createdAt: string
    updatedAt: string
}

export function useLinks(targetAddress?: string) {
    const { isDemo, profile: demoProfile, simulateAction, updateProfile } = useDemo()
    const queryClient = useQueryClient()

    // Guard for real mode: address is required
    const address = targetAddress || ''

    // --- Real API Queries ---
    const apiLinksQuery = useQuery({
        queryKey: ['links', address],
        queryFn: async () => {
            if (isDemo && demoProfile) {
                // Map demo social links (platform='Custom Link') to LinkItems
                return (demoProfile.socialLinks || [])
                    .filter(l => l.platform === 'Custom Link')
                    .map(l => ({
                        id: l.id,
                        title: l.label || 'Untitled',
                        url: l.url,
                        enabled: true,
                        categoryId: null, // Demo doesn't support categories yet for links
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    })) as LinkItem[]
            }

            if (!address) return []
            const res = await fetch(`/api/profile/links?address=${encodeURIComponent(address)}`)
            if (!res.ok) throw new Error('Failed to fetch links')
            const data = await res.json()
            return data.links as LinkItem[]
        },
        enabled: (!!address) || isDemo,
    })

    const apiCategoriesQuery = useQuery({
        queryKey: ['link-categories', address],
        queryFn: async () => {
            if (isDemo) return [] // Demo doesn't support categories yet

            if (!address) return []
            const res = await fetch(`/api/profile/categories?address=${encodeURIComponent(address)}`)
            if (!res.ok) throw new Error('Failed to fetch categories')
            const data = await res.json()
            return data.categories as LinkCategory[]
        },
        enabled: (!!address) || isDemo,
    })

    // --- Data ---
    const links = apiLinksQuery.data || []
    const categories = apiCategoriesQuery.data || []
    const loading = apiLinksQuery.isLoading || apiCategoriesQuery.isLoading

    // --- Actions ---

    const saveLinks = async (newLinks: LinkItem[]) => {
        if (isDemo) return true // Reordering not fully supported in simple demo wrapper yet without complex logic

        if (!address) return false
        try {
            const res = await fetch('/api/profile/links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, links: newLinks }),
            })
            if (!res.ok) throw new Error('Failed to save links')
            queryClient.setQueryData(['links', address], newLinks)
            return true
        } catch (error) {
            toast.error('Failed to save changes')
            return false
        }
    }

    const saveCategories = async (newCategories: LinkCategory[]) => {
        if (isDemo) return true

        if (!address) return false
        try {
            const res = await fetch('/api/profile/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, categories: newCategories }),
            })

            if (!res.ok) throw new Error('Failed to save categories')
            queryClient.setQueryData(['link-categories', address], newCategories)
            return true
        } catch (error) {
            toast.error('Failed to save categories')
            return false
        }
    }

    const createLink = async (linkData: Partial<LinkItem>) => {
        if (isDemo) {
            simulateAction('Add Link', { label: linkData.title, url: linkData.url })
            return true
        }
        const newLink = { ...linkData, id: linkData.id || crypto.randomUUID(), createdAt: new Date().toISOString() } as LinkItem
        const newLinks = [...links, newLink]
        return saveLinks(newLinks)
    }

    const updateLink = async (id: string, data: Partial<LinkItem>) => {
        if (isDemo) {
            // We need to map back to socialLinks logic or just use updateProfile
            // Since demo unification is messy, let's just toast
            toast.info('Link updates in demo mode are limited.')
            return true
        }
        const updated = links.map(l => l.id === id ? { ...l, ...data } : l)
        return saveLinks(updated)
    }

    const deleteLink = async (id: string) => {
        if (isDemo) {
            // Filter out from socialLinks
            return true
        }
        const updated = links.filter(l => l.id !== id)
        return saveLinks(updated)
    }

    const createCategory = async (data: Partial<LinkCategory>) => {
        if (isDemo) return true
        const newCat = { ...data, id: data.id || crypto.randomUUID(), createdAt: new Date().toISOString() } as LinkCategory
        const newCategories = [...categories, newCat]
        return saveCategories(newCategories)
    }

    const updateCategory = async (id: string, data: Partial<LinkCategory>) => {
        if (isDemo) return true
        const updated = categories.map(c => c.id === id ? { ...c, ...data } : c)
        return saveCategories(updated)
    }

    const deleteCategory = async (id: string) => {
        if (isDemo) return true
        const updated = categories.filter(c => c.id !== id)
        return saveCategories(updated)
    }

    // --- Social Links ---
    const apiSocialsQuery = useQuery({
        queryKey: ['social-links', address],
        queryFn: async () => {
            if (isDemo && demoProfile) {
                return (demoProfile.socialLinks || []).filter(l => l.platform !== 'Custom Link')
            }

            if (!address) return []
            const res = await fetch(`/api/wallet?address=${encodeURIComponent(address)}`)
            if (!res.ok) throw new Error('Failed')
            const data = await res.json()
            return data.profile?.socialLinks || []
        },
        enabled: (!!address) || isDemo
    })

    const socialLinks = apiSocialsQuery.data || []
    const socialLoading = apiSocialsQuery.isLoading

    const saveSocialLinks = async (newLinks: any[]) => {
        if (isDemo) {
            updateProfile({ socialLinks: newLinks })
            return true
        }

        try {
            const res = await fetch('/api/profile/social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, socialLinks: newLinks }),
            })
            if (!res.ok) throw new Error('Failed')
            queryClient.setQueryData(['social-links', address], newLinks)
            return true
        } catch { return false }
    }

    return {
        links,
        categories,
        socialLinks,
        loading: loading || socialLoading,
        saveLinks,
        saveCategories,
        createLink,
        updateLink,
        deleteLink,
        createCategory,
        updateCategory,
        deleteCategory,
        saveSocialLinks,
        isReadOnly: false,
        isDemo
    }
}
