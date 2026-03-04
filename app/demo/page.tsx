'use client'

import { useDemo } from '@/lib/demo/demo-context'
import { Skeleton } from '@/components/ui/skeleton'
import { DemoOverviewPanel } from '@/components/demo/demo-overview-panel'
import SiteFooter from "@/components/app-shell/site-footer"

export default function PublicDemoPage() {
    const { isLoading } = useDemo()

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col">
            <DemoOverviewPanel />
            <SiteFooter className="mt-auto" />
        </div>
    )
}
