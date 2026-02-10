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
                const fromBlock = currentBlock - 2000000n // Scan last ~2 million blocks (apx 1 month) or adjust as needed for deeper history. 
                // For a full history, we might need an indexer, but let's try a reasonable range for now or from genesis if RPC allows wide ranges.
                // The C-Chain RPC might limit range. Let's try 500k range blocks loops if needed, but for now simple fetch.
                // Actually, let's just try fetching from a known deployment block if possible, or just a safe recent range.
                // Since this is a user dashboard, we care about *their* history. 
                // Using `getLogs` with `address` filter is usually efficient.

                // 1. Fetch Premium Purchases
                const premiumLogs = await client.getLogs({
                    address: PREMIUM_CONTRACT,
                    event: parseAbiItem('event PremiumPurchased(address indexed user, uint256 paidAt, uint256 expiresAt, uint256 amount)'),
                    args: { user: address as `0x${string}` },
                    fromBlock: 40000000n, // Approximate somewhat recent block to save time, or 0n if indexed well
                    toBlock: 'latest'
                })

                // 2. Fetch Slug Claims
                const slugLogs = await client.getLogs({
                    address: SLUG_CONTRACT,
                    event: parseAbiItem('event SlugClaimed(bytes32 indexed slugHash, address indexed owner, uint256 timestamp)'),
                    args: { owner: address as `0x${string}` },
                    fromBlock: 40000000n,
                    toBlock: 'latest'
                })

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
                // Note: Slug logs contain the hash, we don't know the plain text slug easily without an indexer or rainbow table.
                // We'll display "Identity Claim" for now.
                for (const log of slugLogs) {
                    const { timestamp } = log.args
                    if (timestamp) {
                        formattedTxs.push({
                            id: log.transactionHash + "-slug",
                            type: "SLUG_CLAIM",
                            description: "Identity Handle Claim",
                            amount: "Gas Only", // Contract doesn't charge AVAX for claim itself in the event, but user paid gas.
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
                setError("Failed to load on-chain history. Please try again later.")
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
                    <div className="rounded-md border border-border/50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead className="text-right">Proof</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        tx.type === "PREMIUM"
                                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                                    }
                                                >
                                                    {tx.type === "PREMIUM" ? "SUBSCRIPTION" : "IDENTITY"}
                                                </Badge>
                                                <span className="font-medium text-foreground/90">{tx.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {tx.timestamp.toLocaleDateString()}
                                            <span className="text-xs opacity-50 ml-1.5 hidden sm:inline-block">
                                                ({formatDistanceToNow(tx.timestamp, { addSuffix: true })})
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {tx.amount}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <a
                                                href={`https://snowtrace.io/tx/${tx.hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                            >
                                                {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                                                <ExternalLink className="w-3 h-3" />
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
