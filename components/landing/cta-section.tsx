'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { WalletConnectButtons } from '@/components/wallet-connect-buttons'
import { ArrowRight, Sparkles } from 'lucide-react'

export function CTASection() {
    const router = useRouter()

    return (
        <section className="relative py-24 overflow-hidden">
            <div className="container relative z-10 mx-auto px-4 text-center space-y-8">
                <div className="space-y-4 max-w-2xl mx-auto">
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
                        Ready to claim your on-chain identity?
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Join the wallet-first profile layer for Avalanche.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button
                        size="lg"
                        onClick={() => router.push('/demo')}
                        className="w-full sm:w-auto gap-2 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                    >
                        <Sparkles className="h-4 w-4" />
                        Try Demo
                    </Button>

                    <div className="w-full sm:w-auto">
                        <WalletConnectButtons
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto gap-2 text-base border-border/60 transition-all hover:-translate-y-0.5 hover:bg-accent/50"
                        />
                    </div>
                </div>

                <p className="text-xs text-muted-foreground/60 pt-4 font-normal">
                    No transactions. No gas. Read-only demo.
                </p>
            </div>
        </section>
    )
}
