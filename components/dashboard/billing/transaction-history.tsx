"use client"

import { useEffect, useState } from "react"
import { createPublicClient, http, parseAbiItem, formatEther } from "viem"
import { formatDistanceToNow } from "date-fns"
import { activeChain, activeRpc, activePremiumPayment, activeSlugRegistry, blockExplorerUrl } from '@/lib/chain-config'

import { Loader2, ExternalLink, Receipt, AlertCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// --- Configuration ---
// Removed hardcoded addresses to use dynamic chain configs imported above.

// --- Types ---
interface Transaction {
    id: string
    type: "PREMIUM" | "SLUG_CLAIM"
    description: string
    amount: string
    hash: string
    timestamp: Date
    status: "CONFIRMED"
}

interface TransactionHistoryProps {
    address: string
}

export function TransactionHistory({ address }: TransactionHistoryProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true)
            setError(null)
            try {
                // 1. Fetch persistent history from Database API
                const apiResponse = await fetch(`/api/profile/${address}/billing-history`)
                const apiData = await apiResponse.json()

                const dbTxs: Transaction[] = (apiData.history || []).map((tx: any) => ({
                    ...tx,
                    timestamp: new Date(tx.timestamp)
                }))

                // 2. Scan a very small RECENT window from RPC (fallback/immediate-feedback)
                // We scan only the last 5000 blocks (approx 1.5 hours) for pending indexer updates
                let recentTxs: Transaction[] = []
                try {
                    const client = createPublicClient({
                        chain: activeChain,
                        transport: http(activeRpc)
                    })
                    const currentBlock = await client.getBlockNumber()
                    const fromBlock = currentBlock - 5000n

                    const [premiumLogs, slugLogs] = await Promise.all([
                        client.getLogs({
                            address: activePremiumPayment as `0x${string}`,
                            event: parseAbiItem('event PremiumPurchased(address indexed user, uint256 paidAt, uint256 expiresAt, uint256 amount)'),
                            args: { user: address as `0x${string}` },
                            fromBlock
                        }),
                        client.getLogs({
                            address: activeSlugRegistry as `0x${string}`,
                            event: parseAbiItem('event SlugClaimed(bytes32 indexed slugHash, address indexed owner, uint256 timestamp)'),
                            args: { owner: address as `0x${string}` },
                            fromBlock
                        })
                    ])

                    for (const log of premiumLogs) {
                        const { paidAt, amount } = log.args as any
                        recentTxs.push({
                            id: log.transactionHash + "-premium",
                            type: "PREMIUM",
                            description: "Premium Plan (365 Days)",
                            amount: formatEther(amount) + " AVAX",
                            hash: log.transactionHash,
                            timestamp: new Date(Number(paidAt) * 1000),
                            status: "CONFIRMED"
                        })
                    }

                    for (const log of slugLogs) {
                        const { timestamp } = log.args as any
                        recentTxs.push({
                            id: log.transactionHash + "-slug",
                            type: "SLUG_CLAIM",
                            description: "Identity Handle Claim",
                            amount: "Gas Only",
                            hash: log.transactionHash,
                            timestamp: new Date(Number(timestamp) * 1000),
                            status: "CONFIRMED"
                        })
                    }
                } catch (rpcErr) {
                    console.warn("RPC recent scan failed, falling back to DB only", rpcErr)
                }

                // 3. Merge and Deduplicate
                const allTxs = [...dbTxs]
                recentTxs.forEach(rtx => {
                    if (!allTxs.find(tx => tx.hash === rtx.hash)) {
                        allTxs.push(rtx)
                    }
                })

                // Sort by date desc
                allTxs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

                setTransactions(allTxs)
            } catch (err) {
                console.error("Error fetching transaction history:", err)
                setError("Failed to load history.")
            } finally {
                setIsLoading(false)
            }
        }

        if (address) {
            fetchHistory()
        }
    }, [address])

    if (!address) return null

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Receipt className="w-5 h-5 text-muted-foreground" />
                    Transaction History
                </CardTitle>
                <CardDescription>
                    Permanent archive of your on-chain interactions
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin mb-2 opacity-50" />
                        <p className="text-sm">Loading archive...</p>
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-2 text-destructive py-8 justify-center bg-destructive/5 rounded-lg">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No transaction history found for this account.</p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border/40 overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow className="hover:bg-transparent border-border/40">
                                    <TableHead className="h-14 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Activity</TableHead>
                                    <TableHead className="h-14 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Date & Time</TableHead>
                                    <TableHead className="h-14 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Value</TableHead>
                                    <TableHead className="h-14 px-6 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Explorer</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id} className="hover:bg-muted/20 border-border/10 transition-colors group">
                                        <TableCell className="py-5 px-6">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            tx.type === "PREMIUM"
                                                                ? "bg-primary/5 text-primary border-primary/20 text-[9px] h-5 px-1.5 font-bold tracking-tight lowercase"
                                                                : "bg-blue-500/5 text-blue-500 border-blue-500/20 text-[9px] h-5 px-1.5 font-bold tracking-tight lowercase"
                                                        }
                                                    >
                                                        #{tx.type === "PREMIUM" ? "subscription" : "identity"}
                                                    </Badge>
                                                    <span className="font-semibold text-foreground tracking-tight">{tx.description}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-6">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-medium text-foreground/90">{tx.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                <span className="text-[11px] text-muted-foreground/60 font-medium">
                                                    {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-6">
                                            <span className="font-mono text-sm font-semibold text-foreground/90 tabular-nums">
                                                {tx.amount}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-5 px-6 text-right">
                                            <a
                                                href={`${blockExplorerUrl}/tx/${tx.hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-background/50 text-[11px] font-bold text-muted-foreground hover:text-primary hover:border-primary/30 transition-all group/link shadow-sm"
                                            >
                                                {tx.hash.slice(0, 6)}
                                                <ExternalLink className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                                            </a>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
