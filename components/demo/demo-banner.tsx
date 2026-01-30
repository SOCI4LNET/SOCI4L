'use client'

import React from 'react'
import { useDemo } from '@/lib/demo/demo-context'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Edit, RefreshCcw, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function DemoBanner() {
    const { mode, isDemo, startSandbox, resetDemo } = useDemo()
    const router = useRouter()

    if (!isDemo) return null

    return (
        <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-12 items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-2 text-sm">
                    {mode === 'public' && (
                        <>
                            <Lock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Public Demo (Read-Only)</span>
                        </>
                    )}
                    {mode === 'sandbox' && (
                        <>
                            <Edit className="h-4 w-4 text-primary" />
                            <span className="font-medium text-primary">Sandbox Mode</span>
                        </>
                    )}
                    {mode === 'investor' && (
                        <>
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="font-medium text-amber-500">Investor Preview</span>
                        </>
                    )}
                    <span className="hidden text-muted-foreground md:inline-block">
                        — {mode === 'public' ? 'Changes are disabled' : 'Changes are local-only and do not affect real data'}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {mode === 'public' && (
                        <Button size="sm" variant="secondary" onClick={() => {
                            startSandbox()
                            router.push('/demo/sandbox')
                        }}>
                            Try Editing
                        </Button>
                    )}

                    {(mode === 'sandbox' || mode === 'investor') && (
                        <Button size="sm" variant="ghost" className="h-8 gap-2 text-muted-foreground hover:text-destructive" onClick={resetDemo}>
                            <RefreshCcw className="h-3.5 w-3.5" />
                            Reset Demo
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
