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
            router.push('/docs-admin/dashboard')

        } catch (error: any) {
            console.error('Login error:', error)
            toast.error(error.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Branding */}
            <div className="hidden lg:flex flex-col bg-zinc-900 border-r border-white/5 p-12 text-white justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="relative z-10">
                    <Soci4LLogo variant="combination" className="invert-0" width={140} />
                </div>

                <div className="relative z-10 space-y-4">
                    <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <Terminal className="h-6 w-6" />
                    </div>
                    <h2 className="text-3xl font-semibold tracking-tight">Documentation CMS</h2>
                    <p className="text-zinc-400 max-w-sm">
                        Manage articles, guides, and API references for the SOCI4L ecosystem.
                        Restricted access for authorized editors only.
                    </p>
                </div>

                <div className="text-sm text-zinc-600 font-mono">
                    v1.0.0-beta
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h1 className="text-2xl font-bold tracking-tight">Admin Authentication</h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            Connect your authorized wallet to access the panel.
                        </p>
                    </div>

                    <div className="space-y-4 pt-4">
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
                            Only whitelisted addresses can access this area.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
