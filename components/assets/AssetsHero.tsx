'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Coins, Image as ImageIcon, Wallet, TrendingUp } from "lucide-react"

interface AssetsHeroProps {
    totalValueUsd?: number
    tokenCount?: number
    nftCount?: number
    isLoading: boolean
}

export function AssetsHero({ totalValueUsd, tokenCount, nftCount, isLoading }: AssetsHeroProps) {
    // Format currency
    const formatCurrency = (value?: number) => {
        if (value === undefined || value === null) return '$0.00'
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Total Net Worth - Takes up 2 columns on large screens */}
            <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Wallet className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Net Worth</span>
                    </div>
                    <div className="space-y-1">
                        {isLoading ? (
                            <Skeleton className="h-10 w-48" />
                        ) : (
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold tracking-tight">
                                    {formatCurrency(totalValueUsd)}
                                </span>
                                {/* <span className="text-xs font-medium text-emerald-500 flex items-center gap-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  +2.4%
                </span> */}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Total estimated value of tokens on Avalanche C-Chain
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Token Count */}
            <Card>
                <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Tokens</span>
                        <Coins className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        {isLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <span className="text-3xl font-bold">{tokenCount || 0}</span>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Assets with balance &gt; 0
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* NFT Count */}
            <Card>
                <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-muted-foreground">NFTs</span>
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        {isLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <span className="text-3xl font-bold">{nftCount || 0}</span>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Collections with items
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
