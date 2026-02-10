"use client"

import { useEffect, useState } from "react"
import { createPublicClient, http, parseAbiItem, formatEther } from "viem"
import { avalanche } from "viem/chains"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ExternalLink, Receipt, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"

// --- Configuration ---
const PREMIUM_CONTRACT = "0x9bA02537447E6DcdeF72D0e98a4C82E6B73E3cCC"
const SLUG_CONTRACT = "0xC894a2677C7E619E9692E3bF4AFF58bE53173aA1"

const RPC_URL = "https://api.avax.network/ext/bc/C/rpc"

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
                const client = createPublicClient({
                    chain: avalanche,
                    transport: http(RPC_URL)
                })

                const currentBlock = await client.getBlockNumber()
                // Limit: RPC allows 2048 blocks per request.
                // We'll scan the last ~300,000 blocks (~1 week) to ensure good performance without an indexer.
                // Scanning from 40M (genesis of contract) to 77M is feasible only with an indexer or thousands of requests.
                const scanRange = 300000n
                const fromBlock = currentBlock - scanRange
                const chunkSize = 2040n // Keeping slight buffer under 2048

                const fetchLogsInChunks = async (address: string, event: any, args: any) => {
                    const logs: any[] = []
                    // Iterate from current down to fromBlock to show newest first, or standard loop
                    // Standard loop: from -> to
                    for (let i = fromBlock; i < currentBlock; i += chunkSize) {
                        const to = (i + chunkSize > currentBlock) ? currentBlock : i + chunkSize
                        try {
                            const chunkLogs = await client.getLogs({
                                address: address as `0x${string}`,
                                event,
                                args,
                                fromBlock: i,
                                toBlock: to
                            })
                            logs.push(...chunkLogs)
                        } catch (e) {
                            console.warn(`Failed to fetch chunk ${i}-${to}`, e)
                            // Continue best effort
                        }
                    }
                    return logs
                }

                // Parallel fetch for both contracts
                const [premiumLogs, slugLogs] = await Promise.all([
                    fetchLogsInChunks(
                        PREMIUM_CONTRACT,
                        parseAbiItem('event PremiumPurchased(address indexed user, uint256 paidAt, uint256 expiresAt, uint256 amount)'),
                        { user: address as `0x${string}` }
                    ),
                    fetchLogsInChunks(
                        SLUG_CONTRACT,
                        parseAbiItem('event SlugClaimed(bytes32 indexed slugHash, address indexed owner, uint256 timestamp)'),
                        { owner: address as `0x${string}` }
                    )
                ])

                const formattedTxs: Transaction[] = []

                // Process Premium Logs
                for (const log of premiumLogs) {
                    const { paidAt, amount } = log.args
                    if (paidAt && amount) {
                        formattedTxs.push({
                            id: log.transactionHash + "-premium",
                            type: "PREMIUM",
                            description: "Premium Plan (365 Days)",
                            amount: formatEther(amount) + " AVAX",
                            hash: log.transactionHash,
                            timestamp: new Date(Number(paidAt) * 1000),
                            status: "CONFIRMED"
                        })
                    }
                }

                // Process Slug Logs
                for (const log of slugLogs) {
                    const { timestamp } = log.args
                    if (timestamp) {
                        formattedTxs.push({
                            id: log.transactionHash + "-slug",
                            type: "SLUG_CLAIM",
                            description: "Identity Handle Claim",
                            amount: "Gas Only",
                            hash: log.transactionHash,
                            timestamp: new Date(Number(timestamp) * 1000),
                            status: "CONFIRMED"
                        })
                    }
                }

                // Sort by date desc
                formattedTxs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

                setTransactions(formattedTxs)
            } catch (err) {
                console.error("Error fetching transaction history:", err)
                setError("Failed to load full history. (RPC Limit)")
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
                    On-chain interactions with SOCI4L contracts
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin mb-2 opacity-50" />
                        <p className="text-sm">Scanning Avalanche C-Chain...</p>
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
                                                href={`https://snowtrace.io/tx/${tx.hash}`}
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
