'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageShell } from '@/components/app-shell/page-shell'
import { BlockedUsersList, MutedUsersList } from '@/components/dashboard/safety/blocked-users-list'

export function SafetyPanel() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Get active subtab from URL query param 'subtab'
    const subtabParam = searchParams.get('subtab')
    const [activeTab, setActiveTab] = useState<'blocked' | 'muted'>(
        (subtabParam === 'blocked' || subtabParam === 'muted')
            ? subtabParam
            : 'blocked'
    )

    // Sync with URL
    useEffect(() => {
        const subtab = searchParams.get('subtab')
        if (subtab === 'blocked' || subtab === 'muted') {
            setActiveTab(subtab)
        } else {
            // Default to blocked if not specified
            const params = new URLSearchParams(searchParams.toString())
            if (!params.has('subtab')) {
                params.set('subtab', 'blocked')
                if (pathname) {
                    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
                }
            }
        }
    }, [searchParams, pathname, router])

    const handleTabChange = (value: string) => {
        const newTab = value as 'blocked' | 'muted'
        setActiveTab(newTab)

        const params = new URLSearchParams(searchParams.toString())
        params.set('subtab', newTab)

        if (pathname) {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        }
    }

    return (
        <PageShell
            title="Safety & Privacy"
            subtitle="Manage your blocked and muted users."
            mode="constrained"
        >
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="blocked">Blocked Accounts</TabsTrigger>
                    <TabsTrigger value="muted">Muted Accounts</TabsTrigger>
                </TabsList>
                <TabsContent value="blocked" className="mt-6">
                    <BlockedUsersList />
                </TabsContent>
                <TabsContent value="muted" className="mt-6">
                    <MutedUsersList />
                </TabsContent>
            </Tabs>
        </PageShell>
    )
}
