import { DemoProvider } from '@/lib/demo/demo-context'
import { DemoBanner } from '@/components/demo/demo-banner'

export default function DemoLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <DemoProvider>
            <div className="relative min-h-screen flex flex-col">
                <DemoBanner />
                {children}
            </div>
        </DemoProvider>
    )
}
