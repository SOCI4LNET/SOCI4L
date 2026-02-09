'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

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
                let hash = stored
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
        <div className="space-y-6 max-w-4xl">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Plan Status Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Premium Plan
                            {renderStatusBadge()}
                        </CardTitle>
                        <CardDescription>
                            Your subscription status
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isPremium ? (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Valid until</p>
                                <p className="text-2xl font-bold">
                                    {premiumExpiresAt ? format(premiumExpiresAt, 'MMMM d, yyyy') : 'Conversational Life'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {format(premiumExpiresAt!, 'h:mm a')}
                                </p>
                            </div>
                        ) : pendingTx ? (
                            <div className="flex flex-col gap-2 py-2">
                                <div className="flex items-center gap-2 text-yellow-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="font-medium">Payment Pending</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    We detected a recent transaction. It may take a few minutes for the blockchain to confirm and our indexer to update your status.
                                    <br />
                                    <span className="text-xs opacity-70">Tx: {pendingTx.slice(0, 6)}...{pendingTx.slice(-4)}</span>
                                </p>
                                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => window.location.reload()}>
                                    Refresh Status
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <XCircle className="h-4 w-4" />
                                    <span>No active premium subscription</span>
                                </div>
                                <Link href="/premium">
                                    <Button className="w-full">Upgrade to Premium</Button>
                                </Link>
                            </div>
                        )}

                        <div className="pt-4 border-t border-border/50">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Price</span>
                                <span className="font-medium">0.5 AVAX / year</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                On-chain license. Payments are final and non-refundable.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {/* Receipt Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Last Receipt</CardTitle>
                            <CardDescription>Transaction proof on Avalanche</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {txHash && isValidTxHash(txHash) ? (
                                <div className="space-y-4">
                                    <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Transaction Hash</p>
                                        <p className="font-mono text-sm break-all">{txHash}</p>
                                    </div>
                                    <Button variant="outline" className="w-full" asChild>
                                        <a
                                            href={`https://snowtrace.io/tx/${txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2"
                                        >
                                            View on Snowtrace
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground flex flex-col items-center justify-center py-6 text-center">
                                    <Clock className="h-8 w-8 mb-2 opacity-20" />
                                    <p>No receipt available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Network Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Network</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                    <span className="font-medium">Avalanche C-Chain</span>
                                </div>
                                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">Mainnet</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
