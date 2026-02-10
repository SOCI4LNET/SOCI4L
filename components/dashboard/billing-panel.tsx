'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { TransactionHistory } from '@/components/dashboard/billing/transaction-history'

interface BillingPanelProps {
    profile: any
    walletData: any
    address: string
}

export function BillingPanel({ profile, address }: BillingPanelProps) {
    const [mounted, setMounted] = useState(false)
    const [pendingTx, setPendingTx] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
        // Check for pending transaction in localStorage
        try {
            const stored = localStorage.getItem('lastSentTxHash')
            if (stored) {
                // You might want to store { hash, timestamp, address } to be safer
                // For now assuming simple string or checking if we need to parse
                let hash: string | null = stored
                try {
                    const parsed = JSON.parse(stored)
                    if (parsed.address && parsed.address.toLowerCase() === address.toLowerCase()) {
                        hash = parsed.hash
                    } else {
                        hash = null
                    }
                } catch (e) {
                    // plain string, assume it's for current user if recently set
                }

                if (hash) setPendingTx(hash)
            }
        } catch (e) {
            console.error('Error reading local storage:', e)
        }
    }, [address])

    if (!mounted) return null

    const premiumExpiresAt = profile?.premiumExpiresAt ? new Date(profile.premiumExpiresAt) : null
    const isPremium = premiumExpiresAt && premiumExpiresAt > new Date()
    const isExpired = premiumExpiresAt && premiumExpiresAt <= new Date()

    // Use DB hash if available, otherwise fall back to pending hash if we are in "optimistic" state
    // But strictly, strict receipt should come from DB.
    // Pending state is for "Payment sent, waiting for indexer".
    const txHash = profile?.premiumLastTxHash

    // Validation for Snowtrace link
    const isValidTxHash = (hash: string) => /^0x[a-fA-F0-9]{64}$/.test(hash)

    const renderStatusBadge = () => {
        if (isPremium) {
            return <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">Active</Badge>
        }
        if (pendingTx && !isPremium) {
            return <Badge className="bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25 border-yellow-500/20">Processing</Badge>
        }
        if (isExpired) {
            return <Badge variant="destructive" className="bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/20">Expired</Badge>
        }
        return <Badge variant="secondary">Free Plan</Badge>
    }

    return (
        <div className="space-y-6 w-full">
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Plan Status Card */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Premium Plan
                            {renderStatusBadge()}
                        </CardTitle>
                        <CardDescription>
                            Your subscription status
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isPremium ? (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Valid until</p>
                                <p className="text-3xl font-bold tracking-tight">
                                    {premiumExpiresAt ? format(premiumExpiresAt, 'MMMM d, yyyy') : 'Unlimited Access'}
                                </p>
                                <p className="text-sm text-muted-foreground/60 mt-1">
                                    {format(premiumExpiresAt!, 'h:mm a')}
                                </p>
                            </div>
                        ) : pendingTx ? (
                            <div className="flex flex-col gap-3 py-2">
                                <div className="flex items-center gap-2 text-yellow-500">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span className="font-semibold">Payment Processing</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    We detected a recent transaction. It may take a few minutes for the blockchain to confirm and our indexer to update your status.
                                    <br />
                                    <span className="text-xs font-mono opacity-60 mt-2 block bg-muted p-2 rounded">Tx: {pendingTx}</span>
                                </p>
                                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => window.location.reload()}>
                                    Check Update
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <XCircle className="h-4 w-4" />
                                    <span>No active premium subscription</span>
                                </div>
                                <Link href="/premium">
                                    <Button className="w-full shadow-lg shadow-primary/10 transition-all hover:scale-[1.01]">Upgrade to Premium</Button>
                                </Link>
                            </div>
                        )}

                        <div className="pt-6 border-t border-border/50">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground font-medium">Annual Price</span>
                                <span className="text-lg font-bold">0.5 AVAX</span>
                            </div>
                            <p className="text-xs text-muted-foreground/60 mt-2 leading-relaxed">
                                Lifetime on-chain license. All payments are final and secured by smart contract.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-6">
                    {/* Receipt Card */}
                    <Card className="flex-1">
                        <CardHeader>
                            <CardTitle>Payment Receipt</CardTitle>
                            <CardDescription>Verified transaction proof on Avalanche</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {txHash && isValidTxHash(txHash) ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted/30 rounded-xl border border-border/10 space-y-2">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Transaction Hash</p>
                                        <p className="font-mono text-xs break-all text-foreground/80 leading-relaxed">{txHash}</p>
                                    </div>
                                    <Button variant="outline" className="w-full group" asChild>
                                        <a
                                            href={`https://snowtrace.io/tx/${txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2"
                                        >
                                            View on Snowtrace
                                            <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </a>
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground flex flex-col items-center justify-center py-10 text-center rounded-xl bg-muted/10 border border-dashed border-border/50">
                                    <Clock className="h-10 w-10 mb-3 opacity-10" />
                                    <p className="font-medium">No recent purchase record found</p>
                                    <p className="text-xs mt-1 opacity-60">History will appear after your first claim.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Network Info */}
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                                Network Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Avalanche C-Chain</span>
                                <Badge variant="secondary" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/10 text-[10px] uppercase font-bold tracking-tight">Mainnet Online</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="pt-2">
                <TransactionHistory address={address} />
            </div>
        </div>
    )
}
