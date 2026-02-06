'use client'

import { useServerAuth } from '@/hooks/use-server-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageShell } from '@/components/app-shell/page-shell'

import { useEffect } from 'react'
import { Suspense } from 'react'

function AdminLoginContent() {
    const { ensureSession } = useServerAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectPath = searchParams.get('redirect') || '/master-console'
    const error = searchParams.get('error')

    useEffect(() => {
        if (error === 'admin_no_session') {
            toast.error('Admin authentication required. Please sign in.')
        } else if (error === 'not_admin') {
            toast.error('Access denied. Your wallet is not authorized as an admin.')
        } else if (error) {
            toast.error(`Authentication error: ${error}`)
        }
    }, [error])

    const handleLogin = async () => {
        const success = await ensureSession()
        if (success) {
            // Force hard navigation to ensure cookies are sent to server components
            window.location.href = redirectPath
        }
    }

    return (
        <div className="flex items-center justify-center py-20">
            <Card className="w-full max-w-md border-2 border-primary/20">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Master Console Access</CardTitle>
                    <CardDescription>
                        Please sign a message with your admin wallet to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Button size="lg" className="w-full gap-2" onClick={handleLogin}>
                        Authenticate as Admin
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => router.push('/')}>
                        Cancel
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export default function AdminLoginPage() {
    return (
        <PageShell title="Admin Authentication" subtitle="Proof of identity required for Master Console.">
            <Suspense fallback={<div className="flex justify-center py-20">Loading authentication...</div>}>
                <AdminLoginContent />
            </Suspense>
        </PageShell>
    )
}
