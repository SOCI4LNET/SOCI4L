'use client'

import { useServerAuth } from '@/hooks/use-server-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageShell } from '@/components/app-shell/page-shell'

export default function AdminLoginPage() {
    const { ensureSession } = useServerAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectPath = searchParams.get('redirect') || '/master-console'

    const handleLogin = async () => {
        const success = await ensureSession()
        if (success) {
            toast.success('Authenticated successfully')
            router.push(redirectPath)
        }
    }

    return (
        <PageShell title="Admin Authentication" subtitle="Proof of identity required for Master Console.">
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
        </PageShell>
    )
}
