'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getCachedLogo, getCacheKey } from "@/lib/logo-cache"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// TokenData from assets-panel
interface TokenData {
    address: string | null
    symbol: string
    name: string
    valueUsd?: number
    logoUrl?: string
}

interface AssetsHeroProps {
    totalValueUsd?: number
    isLoading: boolean
    tokens?: TokenData[]
}

interface DistItem {
    symbol: string
    value: number
    percent: number
    color: string
    logoUrl: string | null
}

const COLORS = [
    '#F7931A', // Orange (like BTC/ETH focus)
    '#E84142', // Red (like AVAX)
    '#00E676', // Green
    '#2962FF', // Blue
    '#9C27B0', // Purple
    '#00B0FF', // Light blue
]

export function AssetsHero({ totalValueUsd, isLoading, tokens }: AssetsHeroProps) {
    const [selectedTokenSymbol, setSelectedTokenSymbol] = useState<string | null>(null)

    // Generate colors for up to top 10 tokens dynamically
    const chartColors = [
        '#F7931A', // Bitcoin Orange (fallback)
        '#627EEA', // ETH Blue
        '#E84142', // AVAX Red
        '#8247E5', // Polygon Purple
        '#00EAAA', // Teal
        '#F3BA2F', // BNB Yellow
        '#2775CA', // Uniswap Blue
        '#161615', // Dark
        '#FF0420', // Optimism Red
        '#00A3FF'  // Arbitrum Blue
    ]

    // Calculate distribution data based on token values
    const distributionData = useMemo(() => {
        if (!tokens || tokens.length === 0 || !totalValueUsd || totalValueUsd === 0) return []

        // Sort by value descending
        const sortedTokens = [...tokens]
            .sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0))

        const topTokens = sortedTokens.slice(0, 5)

        let processedTokens: DistItem[] = topTokens.map((token, index) => {
            const cacheKey = getCacheKey(token.address, token.symbol)
            return {
                symbol: token.symbol,
                value: token.valueUsd || 0,
                percent: ((token.valueUsd || 0) / totalValueUsd) * 100,
                color: chartColors[index % chartColors.length],
                logoUrl: getCachedLogo(cacheKey) || null
            }
        })

        const topTokensValue = topTokens.reduce((sum, t) => sum + (t.valueUsd || 0), 0)
        const otherValue = totalValueUsd - topTokensValue

        if (sortedTokens.length > 5) {
            processedTokens.push({
                symbol: 'Other',
                value: otherValue > 0 ? otherValue : 0,
                percent: otherValue > 0 ? (otherValue / totalValueUsd) * 100 : 0,
                color: '#6B7280', // Gray for "Other"
                logoUrl: null
            })
        }

        return processedTokens
    }, [tokens, totalValueUsd])

    // Generate synthetic 7-day historical data based on current distribution
    const chartData = useMemo(() => {
        if (distributionData.length === 0) return []

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const data = []

        // Base multipliers to create waves
        const baseMultipliers = [0.85, 0.92, 0.88, 1.10, 1.25, 1.15, 1.0]

        // Calculate a visual multiplier to boost small values and compress huge values.
        // We do this by mapping the visual height to a compressed scale (e.g. square root) 
        // to ensure all top assets look like meaningful layers in the chart.
        const maxRealValue = Math.max(...distributionData.map(d => d.value))

        for (let i = 0; i < 7; i++) {
            const dayData: any = { name: days[i] }
            let dayTotal = 0

            distributionData.forEach(item => {
                // Pseudo-random noise (deterministic based on day index and symbol)
                const pseudoRandom = ((i * 17 + item.symbol.charCodeAt(0)) % 100) / 100

                // --- VISUAL COMPRESSION MAGIC ---
                // Instead of using real $ values for the height of the chart area, 
                // we'll compress the scale so a $0.02 token isn't squashed by a $10.00 token.
                // We square-root the value relative to the max, guaranteeing a thick minimum band.
                let visualWeight = 0
                if (maxRealValue > 0) {
                    if (item.value > 0) {
                        // Even the tiniest token gets at least 5% of the visual thickness of the biggest token
                        const relativeScale = Math.sqrt(item.value / maxRealValue)
                        visualWeight = maxRealValue * Math.max(0.05, relativeScale)
                    } else {
                        // Tokens with $0 value still get a tiny sliver just to show they exist
                        visualWeight = maxRealValue * 0.01
                    }
                } else {
                    visualWeight = 1 // Fallback
                }

                // Apply time-based waves and noise to the VISUAL weight
                const visualValue = visualWeight * baseMultipliers[i] * (1 + (pseudoRandom * 0.1 - 0.05))

                // The Tooltip expects the REAL total USD value, not our compressed visual height.
                // So we store two things: the visual height for Recharts, and the real value for the Tooltip.
                const realValue = item.value * baseMultipliers[i] * (1 + (pseudoRandom * 0.1 - 0.05))

                // Highlight logic
                if (selectedTokenSymbol && selectedTokenSymbol !== item.symbol) {
                    dayData[item.symbol] = 0 // Hide unselected tokens completely
                    dayData[`${item.symbol}_real`] = realValue // Keep real value (though hidden in tooltip usually)
                } else {
                    dayData[item.symbol] = visualValue // This creates the chart height
                    dayData[`${item.symbol}_real`] = realValue // This powers the tooltip
                }

                dayTotal += realValue // Tooltip Total should be the sum of real values
            })
            dayData.total = dayTotal // Real total
            data.push(dayData)
        }

        return data
    }, [distributionData, selectedTokenSymbol])

    const formatCurrency = (value?: number) => {
        if (value === undefined || value === null) return '$0.00'
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    // Custom Tooltip for the chart
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            // Find the payload containing the total (all payloads have access to the raw dayData)
            const dayData = payload[0].payload
            const total = dayData.total

            return (
                <div className="bg-popover border border-border/50 shadow-md p-3 rounded-lg text-sm">
                    <p className="font-semibold mb-2">{label}</p>
                    <p className="text-muted-foreground mb-2 pb-2 border-b border-border/50">
                        Total: <span className="text-foreground font-medium">{formatCurrency(total)}</span>
                    </p>
                    {payload
                        .slice()
                        .sort((a: any, b: any) => {
                            const valA = a.payload[`${a.dataKey}_real`] || 0
                            const valB = b.payload[`${b.dataKey}_real`] || 0
                            return valB - valA
                        })
                        .map((entry: any, index: number) => {
                            // Retrieve the real value we stored earlier, instead of the compressed visual height
                            const realValue = entry.payload[`${entry.dataKey}_real`]
                            const isFaded = selectedTokenSymbol && selectedTokenSymbol !== entry.dataKey

                            // Hide from tooltip if another token is explicitly selected globally
                            if (isFaded) return null

                            return (
                                <div key={index} className="flex items-center justify-between gap-4 mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span className="text-muted-foreground">{entry.name}</span>
                                    </div>
                                    <span className="font-medium">{formatCurrency(realValue)}</span>
                                </div>
                            )
                        })}
                </div>
            )
        }
        return null
    }

    return (
        <Card className="w-full border-none bg-background shadow-none mb-6">
            <CardContent className="p-0 space-y-8">
                {/* Balance Area */}
                <div>
                    <span className="text-sm font-medium text-muted-foreground block mb-2">Net Worth</span>
                    {isLoading ? (
                        <Skeleton className="h-14 w-64" />
                    ) : (
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-bold tracking-tight text-foreground">
                                {formatCurrency(totalValueUsd)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Area Chart Container */}
                {(!isLoading && chartData.length > 0) && (
                    <div className="w-full h-[240px] mt-4 relative focus:outline-none focus:ring-0 [&_*]:focus:outline-none [&_*]:outline-none">
                        <ResponsiveContainer width="100%" height="100%" className="focus:outline-none focus:ring-0 outline-none">
                            <AreaChart
                                data={chartData}
                                margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
                                style={{ outline: 'none' }}
                            >
                                <defs>
                                    {distributionData.map((item) => (
                                        <linearGradient key={`gradient-${item.symbol}`} id={`color-${item.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={item.color} stopOpacity={0.8} />
                                            <stop offset="95%" stopColor={item.color} stopOpacity={0.1} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#a1a1aa' }}
                                    dy={10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />

                                {[...distributionData].reverse().map((item) => {
                                    const isHidden = selectedTokenSymbol && selectedTokenSymbol !== item.symbol;
                                    return (
                                        <Area
                                            key={item.symbol}
                                            type="monotone"
                                            dataKey={item.symbol}
                                            stackId="1"
                                            stroke={isHidden ? 'transparent' : item.color}
                                            fill={isHidden ? 'transparent' : `url(#color-${item.symbol})`}
                                            strokeWidth={isHidden ? 0 : 2}
                                            activeDot={isHidden ? false : { r: 6, strokeWidth: 0, fill: item.color }}
                                            isAnimationActive={true}
                                            animationDuration={800}
                                            style={{ transition: 'opacity 0.3s ease' }}
                                        />
                                    );
                                })}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Tokens Legend Tabs */}
                {(!isLoading && distributionData.length > 0) && (
                    <div className="flex flex-wrap items-center gap-3 pt-4">
                        <span className="text-xs text-muted-foreground mr-2 font-medium">Assets distribution</span>
                        {distributionData.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedTokenSymbol(prev => prev === item.symbol ? null : item.symbol)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border
                                    ${selectedTokenSymbol === item.symbol
                                        ? 'bg-[#27272a] text-white border-border/50 shadow-md scale-105'
                                        : selectedTokenSymbol
                                            ? 'bg-transparent border-transparent text-muted-foreground opacity-30 grayscale hover:opacity-100'
                                            : 'bg-transparent border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                                    }`}
                            >
                                <div
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: item.color }}
                                />
                                {item.symbol}
                            </button>
                        ))}
                    </div>
                )}

                {!isLoading && distributionData.length === 0 && (
                    <div className="text-sm text-muted-foreground">No distribution data available.</div>
                )}
            </CardContent>
        </Card>
    )
}
