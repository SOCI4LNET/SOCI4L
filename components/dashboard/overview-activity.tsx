import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { RefreshCw, CheckCircle2, Activity, ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import type { ActivityTransaction } from "@/lib/activity/fetchActivity"
import { formatAddress } from "@/lib/utils"
import { useProfileActions } from "@/hooks/use-profile-actions"

interface OverviewActivityProps {
    activity: {
        items: ActivityTransaction[]
        isLoading: boolean
        error: Error | null
        refetch: () => void
    }
    basePath: string
}

export function OverviewActivity({ activity, basePath }: OverviewActivityProps) {
    const router = useRouter()
    const { handleCopyHash } = useProfileActions()

    const getStatusIcon = (status: ActivityTransaction['status']) => {
        if (status === 'success') {
            return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        } else if (status === 'failed') {
            return <CheckCircle2 className="h-3.5 w-3.5 text-destructive" />
        } else {
            return <CheckCircle2 className="h-3.5 w-3.5 text-yellow-500" />
        }
    }

    const getDirectionIcon = (direction: ActivityTransaction['direction']) => {
        if (direction === 'outgoing') {
            return <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
        } else {
            return <ArrowDownRight className="h-3.5 w-3.5 text-muted-foreground" />
        }
    }

    const getExplorerLink = (hash: string): string => {
        return `https://snowtrace.io/tx/${hash}`
    }

    return (
        <Card className="bg-card border border-border/60 shadow-sm relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                    <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                    <CardDescription className="text-xs">Last transactions</CardDescription>
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => activity.refetch()}
                                disabled={activity.isLoading}
                                aria-label="Refresh activity"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${activity.isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Refresh activity</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardHeader>
            <CardContent className="relative">
                {activity.isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activity.error ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-sm font-medium mb-1">Failed to load activity</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => activity.refetch()}
                            className="mt-2"
                        >
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Try Again
                        </Button>
                    </div>
                ) : activity.items && activity.items.length > 0 ? (
                    <div className="space-y-3 relative">
                        {activity.items.map((tx, idx) => {
                            return (
                                <div key={tx.hash || idx} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                        {getDirectionIcon(tx.direction)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(tx.status)}
                                            <Badge variant="secondary" className="text-xs">
                                                {tx.type === 'transfer' ? 'Transfer' : tx.type === 'contract' ? 'Contract' : 'Swap'}
                                            </Badge>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => handleCopyHash(tx.hash)}
                                                            className="text-xs font-mono truncate hover:text-primary"
                                                        >
                                                            {formatAddress(tx.hash, 4)}
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="font-mono text-xs">{tx.hash}</p>
                                                        <p className="text-xs mt-1">Click to copy</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-muted-foreground">
                                                {parseFloat(tx.nativeValueAvax) > 0
                                                    ? `${parseFloat(tx.nativeValueAvax).toFixed(4)} AVAX`
                                                    : tx.tokenTransfers.length > 0
                                                        ? `${parseFloat(tx.tokenTransfers[0].amount).toFixed(4)} ${tx.tokenTransfers[0].symbol}`
                                                        : '-'}
                                            </p>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(tx.timestamp * 1000), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 flex-shrink-0"
                                                    asChild
                                                    aria-label="View on Explorer"
                                                >
                                                    <a href={getExplorerLink(tx.hash)} target="_blank" rel="noopener">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View on Explorer</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            )
                        })}
                        {activity.items.length >= 5 && (
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent via-background/60 to-background pointer-events-none" />
                        )}
                        <div className="pt-2 relative z-10">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => router.push(`${basePath}?tab=activity`)}
                            >
                                View all
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Activity className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-sm font-medium mb-1">No recent transactions detected</p>
                        <p className="text-xs text-muted-foreground mb-4">
                            Activity will appear as your wallet interacts on-chain.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`${basePath}?tab=activity`)}
                        >
                            View all activity
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
