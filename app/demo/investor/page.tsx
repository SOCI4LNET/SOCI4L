'use client'

import { useDemo } from '@/lib/demo/demo-context'
import { Skeleton } from '@/components/ui/skeleton'
import { DemoOverviewPanel } from '@/components/demo/demo-overview-panel'
import { InvestorControls } from '@/components/demo/investor-controls'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function InvestorPage() {
    const { isLoading, mode } = useDemo()
    const router = useRouter()
    const searchParams = useSearchParams()

    // Simple protection - if not in investor mode (triggered by ?key=... in Layout/Context), redirect
    // Note: The context takes care of setting mode='investor' if key is present.
    // But if context is done loading and mode is NOT investor, we should probably bounce them.
    // Unless we want to allow viewing this page just to trigger it? 
    // Actually context `init` handles the trigger from URL params essentially.

    useEffect(() => {
        if (!isLoading && mode !== 'investor') {
            // If we loaded and aren't investor, check if we have a key to trigger it, 
            // if not, bounce to public demo or show access denied.
            // For this demo, let's just allow it if the param is there, context handles it.
            // If context didn't switch to investor, it means no key was found.
            if (!searchParams.get('key')) {
                // router.push('/demo') // Uncomment to enforce key
            }
        }
    }, [isLoading, mode, router, searchParams])

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col relative min-h-[calc(100vh-48px)]">
            {/* Main Content */}
            <DemoOverviewPanel />

            {/* Floating Controls */}
            <InvestorControls />
        </div>
    )
}
