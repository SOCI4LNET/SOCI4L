'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { Line, LineChart, ResponsiveContainer, YAxis, Tooltip } from 'recharts'
import { getCachedLogo, getCacheKey } from "@/lib/logo-cache"
import { formatAddress } from "@/lib/utils"

import { ExternalLink, X, Calendar } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"

interface TokenSidebarProps {
    token: any | null
    totalValueUsd?: number
    onClose: () => void
    explorerLink: string
}

export function TokenSidebar({ token, totalValueUsd, onClose, explorerLink }: TokenSidebarProps) {
    if (!token) return null

    const { address: connectedAddress } = useAccount()
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d')

    const isNative = token.isNative || token.address === null

    // Helper functions for formatting
    const formatBalance = (balance: string): string => {
        const num = parseFloat(balance)
        if (num === 0) return '0'
        if (num >= 1) return num.toLocaleString('en-US', { maximumFractionDigits: 6 })
        return num.toLocaleString('en-US', { maximumFractionDigits: 6 })
    }

    const formatCurrency = (value?: number) => {
        if (value === undefined || value === null) return '—'
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    const formatPrice = (value?: number) => {
        if (!value) return '—'
        if (value < 0.01) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 4,
                maximumFractionDigits: 8,
            }).format(value)
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value)
    }

    // Logo resolution
    const cacheKey = getCacheKey(token.address, token.symbol)
    const logoUrl = getCachedLogo(cacheKey)
    const firstLetter = token.symbol?.charAt(0).toUpperCase() || '?'

    // Calculate Portfolio Share (%)
    const calculateShare = () => {
        if (!totalValueUsd || totalValueUsd === 0 || !token.valueUsd) return 0
        return Math.min((token.valueUsd / totalValueUsd) * 100, 100)
    }
    const sharePercent = calculateShare()

    // Fetch real chart data
    const { data: chartResponse, isLoading: isChartLoading } = useQuery({
        queryKey: ['token-chart', token.address || 'native', token.symbol, timeRange],
        queryFn: async () => {
            const daysMap = { '24h': '1', '7d': '7', '30d': '30' }
            const days = daysMap[timeRange]
            const address = token.address || 'native'
            const symbol = token.symbol || ''
            // Append timestamp to bypass stubborn browser HTTP caching of old errors
            const res = await fetch(`/api/token/${address}/chart?days=${days}&symbol=${symbol}&_t=${Date.now()}`)
            if (!res.ok) throw new Error('Failed to fetch chart')
            return res.json()
        },
        enabled: !!token,
        staleTime: 5 * 60 * 1000, // 5 mins
    })

    // Fetch first acquisition date
    const tokenAddress = token.address || 'native'
    const { data: historyData } = useQuery({
        queryKey: ['token-history', tokenAddress, connectedAddress],
        queryFn: async () => {
            if (!connectedAddress) return { firstAcquiredAt: null }
            const res = await fetch(`/api/token/${tokenAddress}/history?wallet=${connectedAddress}`)
            if (!res.ok) return { firstAcquiredAt: null }
            return res.json()
        },
        enabled: !!token && !!connectedAddress,
        staleTime: 30 * 60 * 1000, // 30 mins
    })

    const firstAcquiredAt: number | null = historyData?.firstAcquiredAt || null

    const chartData = chartResponse?.data || []

    // Calculate real change based on chart data
    const { changePercentage, isPriceUpFinal, chartColor } = useMemo(() => {
        if (!chartData || !Array.isArray(chartData) || chartData.length < 2) {
            return { changePercentage: '0.00', isPriceUpFinal: true, chartColor: '#00e676' }
        }
        const firstValue = chartData[0]?.value || 0
        const lastValue = chartData[chartData.length - 1]?.value || 0

        if (firstValue === 0) {
            return { changePercentage: '0.00', isPriceUpFinal: true, chartColor: '#00e676' }
        }

        const change = ((lastValue - firstValue) / firstValue) * 100
        const isUp = change >= 0

        return {
            changePercentage: change.toFixed(2),
            isPriceUpFinal: isUp,
            chartColor: isUp ? '#00e676' : '#E84142' // Green if up, Red if down
        }
    }, [chartData])

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length > 0 && payload[0].payload) {
            const data = payload[0].payload
            return (
                <div className="bg-[#1a1a1c] border border-border/50 shadow-xl px-3 py-2 rounded-lg flex flex-col gap-1 min-w-[120px]">
                    <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                        {data.date || ''} {data.time ? `• ${data.time}` : ''}
                    </span>
                    <span className="text-foreground text-sm font-semibold">
                        {formatPrice(data.value)}
                    </span>
                </div>
            )
        }
        return null
    }

    // Segmented P&L bar — scale: ±20% = full bar (realistic for crypto daily/weekly moves)
    function SegmentedBar({ value, isPositive }: { value: number, isPositive: boolean }) {
        const TOTAL_SEGMENTS = 20
        const MAX_SCALE = 20 // 20% change = full bar
        const clampedAbs = Math.min(Math.abs(value), MAX_SCALE)
        const filledCount = Math.round((clampedAbs / MAX_SCALE) * TOTAL_SEGMENTS)
        const color = isPositive ? '#00e676' : '#E84142'
        return (
            <div className="flex items-center gap-[2px]">
                {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
                    <div
                        key={i}
                        className="h-[10px] w-[8px] rounded-[2px] transition-all duration-300"
                        style={{
                            backgroundColor: i < filledCount ? color : 'rgba(255,255,255,0.08)',
                            opacity: i < filledCount ? (0.5 + (i / TOTAL_SEGMENTS) * 0.5) : 1,
                        }}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className="w-full lg:w-[350px] shrink-0 bg-[#0c0c0e] border border-border/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-stretch h-fit">

            {/* Header Area */}
            <div className="flex items-start justify-between p-5 pb-0">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/50 relative">
                        {logoUrl ? (
                            <Image src={logoUrl} alt={token.symbol} fill sizes="40px" className="object-cover" />
                        ) : (
                            <span className="text-sm font-bold">{firstLetter}</span>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-none">{token.symbol}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{token.name}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Value Area */}
            <div className="px-5 pt-6 pb-2">
                <h2 className="text-4xl font-bold tracking-tight mb-1">
                    {formatCurrency(token.valueUsd)}
                </h2>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-medium text-muted-foreground">
                        {formatBalance(token.balanceFormatted)} {token.symbol}
                    </p>
                    <span className={`text-sm font-semibold ${isPriceUpFinal ? 'text-[#00e676]' : 'text-[#E84142]'}`}>
                        {isPriceUpFinal ? '+' : ''}{changePercentage}%
                    </span>
                </div>
            </div>

            {/* Mini Chart */}
            <div className="h-[120px] w-full mt-4 px-2 focus:outline-none focus:ring-0 [&_*]:focus:outline-none [&_*]:outline-none relative">
                {isChartLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0c0c0e]/50 z-10">
                        <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                )}
                {!isChartLoading && chartData.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span className="text-xs text-muted-foreground">No chart data available</span>
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%" className="focus:outline-none focus:ring-0 outline-none">
                    <LineChart data={chartData} style={{ outline: 'none' }}>
                        <YAxis domain={['auto', 'auto']} hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={chartColor}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={true}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Time Toggles */}
            <div className="px-5 py-4">
                <div className="flex items-center justify-between bg-accent/40 rounded-lg p-1">
                    <button
                        onClick={() => setTimeRange('24h')}
                        className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${timeRange === '24h' ? 'bg-popover text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        24h
                    </button>
                    <button
                        onClick={() => setTimeRange('7d')}
                        className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${timeRange === '7d' ? 'bg-popover text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        7d
                    </button>
                    <button
                        onClick={() => setTimeRange('30d')}
                        className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${timeRange === '30d' ? 'bg-popover text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        30d
                    </button>
                </div>
            </div>

            <div className="w-full h-[1px] bg-border/40 my-2" />

            {/* Stats Area */}
            <div className="px-5 pb-6 space-y-4 pt-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="text-sm font-medium">{formatPrice(token.priceUsd)}</span>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Portfolio Share</span>
                        <span className="text-sm font-medium">{sharePercent.toFixed(2)}%</span>
                    </div>
                    {/* Share Progress bar */}
                    <div className="h-1.5 w-full bg-accent/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${sharePercent}%` }}
                        />
                    </div>
                </div>

                {/* P&L Section */}
                {chartData.length >= 2 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Price Change ({timeRange})</span>
                            <span className={`text-sm font-semibold tabular-nums ${isPriceUpFinal ? 'text-[#00e676]' : 'text-[#E84142]'
                                }`}>
                                {isPriceUpFinal ? '+' : ''}{changePercentage}%
                            </span>
                        </div>
                        <SegmentedBar value={parseFloat(changePercentage)} isPositive={isPriceUpFinal} />
                    </div>
                )}

                {/* First Acquired */}
                {firstAcquiredAt && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            First Acquired
                        </span>
                        <span className="text-sm font-medium">
                            {new Date(firstAcquiredAt).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric'
                            })}
                        </span>
                    </div>
                )}

                {!isNative && token.address && (

                    <div className="flex items-center justify-between pt-2">
                        <span className="text-sm text-muted-foreground">Contract</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">{formatAddress(token.address, 4)}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                title="View on Explorer"
                            >
                                <a href={explorerLink} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </Button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}
