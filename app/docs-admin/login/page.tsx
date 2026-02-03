'use client'

import { useState } from 'react'
import { useAccount, useSignMessage, useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck, Terminal } from 'lucide-react'
import { Soci4LLogo } from '@/components/logos/soci4l-logo'

export default function DocsAdminLogin() {
    const router = useRouter()
    const { address, isConnected } = useAccount()
    const { signMessageAsync } = useSignMessage()
    const { connectAsync } = useConnect()
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        setLoading(true)
        try {
            if (!isConnected || !address) {
                await connectAsync({ connector: injected() })
                // If still not connected, return (user might have rejected)
                return
            }

            // 1. Sign Message
            const message = `Sign in to SOCI4L Docs Admin\nTimestamp: ${Date.now()}`
            const signature = await signMessageAsync({ message })

            // 2. Verify with API
            const response = await fetch('/api/docs-admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, message, signature })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to authenticate')
            }

            toast.success('Welcome back, Admin')
            toast.success('Welcome back, Admin')
            // Force full reload to ensure cookies are picked up by middleware
            window.location.href = '/docs-admin/dashboard'

        } catch (error: any) {
            console.error('Login error:', error)
            toast.error(error.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

            <Card className="w-full max-w-md relative z-10 overflow-hidden shadow-xl border-zinc-200 dark:border-zinc-800">
                <div className="p-8 space-y-8">
                    <div className="flex flex-col items-center text-center space-y-2">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                            <Terminal className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Docs Admin</h1>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            Manage articles and guides for the SOCI4L ecosystem.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Button
                            size="lg"
                            className="w-full gap-2"
                            onClick={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ShieldCheck className="h-4 w-4" />
                            )}
                            {isConnected ? 'Sign Message to Login' : 'Connect Wallet & Login'}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                            Restricted access for authorized editors only.
                        </p>
                    </div>
                </div>
                <div className="bg-muted/50 p-4 text-center border-t text-xs text-muted-foreground font-mono">
                    v1.0.0-beta
                </div>
            </Card>
        </div>
    )
}
