import { Suspense } from 'react'
import { DemoProvider } from '@/lib/demo/demo-context'
import { DemoBanner } from '@/components/demo/demo-banner'
import { Skeleton } from '@/components/ui/skeleton'

function DemoLoading() {
    return (
        <div className="min-h-screen flex flex-col">
            <div className="h-12 border-b bg-background" />
            <div className="p-8 space-y-6">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        </div>
    )
}

export default function DemoLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Suspense fallback={<DemoLoading />}>
            <DemoProvider>
                <div className="relative min-h-screen flex flex-col">
                    <DemoBanner />
                    {children}
                </div>
            </DemoProvider>
        </Suspense>
    )
}
