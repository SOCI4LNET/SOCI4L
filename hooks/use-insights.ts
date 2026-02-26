
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useDemo } from '@/lib/demo/demo-context'
import { useMemo } from 'react'

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
        visitorWallet?: string
        referrer?: string
        source?: string
    }>
    sourceBreakdown: Record<string, number>
    deviceBreakdown: Record<string, number>
    linkClickCounts: Record<string, number>
    topReferrers: Array<{ name: string; count: number }>
}

export function useInsights(targetAddress?: string, timeframe: string = '7d') {
    const params = useParams()
    const { address: connectedAddress } = useAccount()
    const { isDemo } = useDemo()

    const address = targetAddress?.toLowerCase() ||
        (params.address as string)?.toLowerCase() ||
        connectedAddress?.toLowerCase() || ''

    // --- Demo Data ---
    const demoData: AnalyticsData = useMemo(() => ({
        totalProfileViews: 1250,
        totalLinkClicks: 843,
        ctr: 0.67,
        topLinks: [
            { id: '1', title: 'Portfolio', url: 'https://portfolio.com', clicks: 342, isDeleted: false, categoryName: 'Work' },
            { id: '2', title: 'Twitter', url: 'https://twitter.com', clicks: 215, isDeleted: false, categoryName: 'Social' },
            { id: '3', title: 'GitHub', url: 'https://github.com', clicks: 108, isDeleted: false, categoryName: 'Code' }
        ],
        topCategories: [
            { id: 'cat1', name: 'Work', clicks: 400, share: 0.47, topLinkLabel: 'Portfolio' },
            { id: 'cat2', name: 'Social', clicks: 300, share: 0.35, topLinkLabel: 'Twitter' }
        ],
        recentActivity: [
            { type: 'profile_view', timestamp: Date.now() - 1000 * 60 * 5 },
            { type: 'link_click', timestamp: Date.now() - 1000 * 60 * 15, linkTitle: 'Portfolio', linkId: '1' }
        ],
        sourceBreakdown: {
            'profile': 800,
            'qr': 200,
            'unknown': 250
        },
        deviceBreakdown: {
            'Desktop': 750,
            'Mobile': 450,
            'Tablet': 50
        },
        linkClickCounts: {
            '1': 342,
            '2': 215,
            '3': 108
        },
        topReferrers: [
            { name: 'x.com', count: 450 },
            { name: 'google.com', count: 120 },
            { name: 'linkedin.com', count: 80 }
        ]
    }), [])

    // --- Real API ---
    const insightsQuery = useQuery({
        queryKey: ['insights', address, timeframe],
        queryFn: async () => {
            if (isDemo) return demoData

            if (!address) return null
            // We can fetch from our new consolidated endpoint if we make one, 
            // or perform multiple fetches here and aggregate.
            // For now, let's assume the previous /api/profile/insights is what we want to use/build.
            // Wait, I reverted that API too? 
            // Yes, I reverted `app / api / profile / insights / route.ts` to "old state".
            // The "old state" of that API might return basic data.

            // Let's use the same aggregation logic I built in the component (InsightsPanel)
            // BUT move it here later.
            // For now, to keep it simple and working:
            // Fetch from /api/profile/insights (it exists in old state).
            const res = await fetch(`/api/profile/insights?address=${encodeURIComponent(address)}&range=${timeframe}`)
            if (!res.ok) throw new Error('Failed to fetch insights')
            const data = await res.json()

            // The API returns 'analytics' object.
            const raw = data.analytics

            // Backfill missing fields that are expected by the UI type
            const linkClickCounts: Record<string, number> = {}
            if (raw.topLinks) {
                raw.topLinks.forEach((l: any) => {
                    if (l.id && l.clicks) linkClickCounts[l.id] = l.clicks
                })
            }

            return {
                ...raw,
                linkClickCounts,
                sourceBreakdown: raw.sourceBreakdown || {},
                deviceBreakdown: raw.deviceBreakdown || {}
            } as AnalyticsData
        },
        enabled: (!!address) || isDemo
    })

    return {
        data: insightsQuery.data || null,
        loading: insightsQuery.isLoading,
        error: insightsQuery.error,
        isDemo
    }
}
