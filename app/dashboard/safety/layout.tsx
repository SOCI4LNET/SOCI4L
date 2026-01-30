'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell/app-shell'

export default function SafetyLayout({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false)
    const { address: connectedAddress, isConnected, isReconnecting, isConnecting } = useAccount()
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return

        // Don't redirect while connection is being established/restored
        if (isReconnecting || isConnecting) return

        if (!isConnected || !connectedAddress) {
            // Redirect to home if not connected
            router.push('/')
            return
        }
    }, [mounted, isConnected, connectedAddress, router, isReconnecting, isConnecting])

    // Prevent hydration mismatch or flash of content
    if (!mounted || !connectedAddress) {
        return (
            <div className="flex min-h-svh w-full">
                <div className="flex flex-1 flex-col">
                    <div className="h-16 border-b" />
                    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
                        <div className="space-y-4">
                            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                            <div className="h-64 w-full animate-pulse rounded bg-muted" />
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen w-full">
            <div className="flex flex-1 flex-col">
                <AppShell address={connectedAddress.toLowerCase()}>{children}</AppShell>
            </div>
        </div>
    )
}
