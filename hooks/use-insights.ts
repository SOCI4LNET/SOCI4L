import { useQuery } from '@tanstack/react-query'
import { useDemo } from '@/lib/demo/demo-context'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'

export type AnalyticsData = {
    totalProfileViews: number
    totalLinkClicks: number
    ctr: number | null
    topLinks: Array<{
        id: string
        title: string
        url: string
        clicks: number
        isDeleted: boolean
        categoryName: string | null
    }>
    topCategories: Array<{
        id: string
        name: string
        clicks: number
        share: number
        topLinkLabel: string | null
    }>
    recentActivity: Array<{
        type: 'profile_view' | 'link_click'
        timestamp: number
        linkTitle?: string
        linkId?: string
    }>
    sourceBreakdown: Record<string, number>
    linkClickCounts: Record<string, number>
}

export function useInsights(targetAddress?: string) {
    const { isDemo, mode, session } = useDemo()
    const params = useParams()
    const { address: connectedAddress } = useAccount()

    const address = targetAddress?.toLowerCase() ||
        (params.address as string)?.toLowerCase() ||
        connectedAddress?.toLowerCase() || ''

    const shouldFetch = !isDemo && !!address

    // --- Real API ---
    const insightsQuery = useQuery({
        queryKey: ['insights', address],
        queryFn: async () => {
            const res = await fetch(`/api/profile/insights?address=${encodeURIComponent(address)}`)
            if (!res.ok) throw new Error('Failed to fetch insights')
            const data = await res.json()
            return data.analytics as AnalyticsData
        },
        enabled: shouldFetch
    })

    // --- Demo Simulation ---
    // Mock data for demo/investor modes
    const demoData: AnalyticsData = {
        totalProfileViews: 1250,
        totalLinkClicks: 843,
        ctr: 0.67,
        topLinks: [
            { id: '1', title: 'Portfolio', url: 'https://portfolio.com', clicks: 342, isDeleted: false, categoryName: 'Portfolio' },
            { id: '2', title: 'Twitter', url: 'https://twitter.com/demo', clicks: 215, isDeleted: false, categoryName: 'Socials' },
            { id: '3', title: 'Newsletter', url: 'https://substack.com', clicks: 108, isDeleted: false, categoryName: 'Socials' },
        ],
        topCategories: [
            { id: 'c1', name: 'Socials', clicks: 450, share: 0.53, topLinkLabel: 'Twitter' },
            { id: 'c2', name: 'Projects', clicks: 350, share: 0.41, topLinkLabel: 'Portfolio' },
        ],
        recentActivity: Array.from({ length: 10 }).map((_, i) => ({
            type: i % 3 === 0 ? 'link_click' : 'profile_view',
            timestamp: Date.now() - i * 3600000,
            linkTitle: i % 3 === 0 ? 'Twitter' : undefined,
            linkId: i % 3 === 0 ? '2' : undefined
        })),
        sourceBreakdown: {
            'direct': 500,
            'social': 300,
            'qr': 200,
            'other': 250
        },
        linkClickCounts: {
            '1': 342,
            '2': 215,
            '3': 108
        }
    }

    // Optimize Investor Mode Simulation (Fake Growth)
    // Logic: Use current timestamp to simulate growth over time if needed,
    // or just static high numbers.
    // Review Requirements: "Investor mode: simulated charts/growth"
    // For now static is fine, but if we want "Live" feel, we can use useEffect to increment.

    // Return unified data
    return {
        data: isDemo ? demoData : (insightsQuery.data || null),
        loading: isDemo ? false : insightsQuery.isLoading,
        error: isDemo ? null : insightsQuery.error
    }
}
