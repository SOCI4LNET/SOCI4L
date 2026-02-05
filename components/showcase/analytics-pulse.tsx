'use client'

import { motion } from 'framer-motion'
import { Activity, ArrowUpRight } from 'lucide-react'
import { useState, useEffect } from 'react'

/**
 * Premium Analytics Pulse Component.
 * Features:
 * - Simulated live data chart
 * - Glowing line effects
 * - Real-time activity ticker
 */
export function AnalyticsPulse() {
    const [dataPoints, setDataPoints] = useState<number[]>([20, 45, 12, 65, 30, 80, 45, 90, 30, 60, 20, 50])

    // Simulated live data update
    useEffect(() => {
        const interval = setInterval(() => {
            setDataPoints(prev => {
                const next = [...prev.slice(1), Math.floor(Math.random() * 80) + 10]
                return next
            })
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    // Generate path string for SVG
    const width = 300
    const height = 100
    const points = dataPoints.map((val, i) => {
        const x = (i / (dataPoints.length - 1)) * width
        const y = height - (val / 100) * height
        return `${x},${y}`
    }).join(' ')

    return (
        <div className="w-full max-w-[340px] rounded-xl bg-card border border-border shadow-xl p-5 relative overflow-hidden group hover:border-primary/50 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Live Activity</p>
                        <h4 className="text-lg font-bold tracking-tight">2,842</h4>
                    </div>
                </div>
                <div className="bg-green-500/10 text-green-500 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +12%
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative h-[120px] w-full">
                <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area Fill */}
                    <motion.path
                        d={`M 0,${height} ${points} L ${width},${height} Z`}
                        fill="url(#chartGradient)"
                        stroke="none"
                        animate={{ d: `M 0,${height} ${points} L ${width},${height} Z` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />

                    {/* Line Stroke */}
                    <motion.path
                        d={`M ${points.split(' ')[0]} L ${points.split(' ').slice(1).join(' ')}`}
                        fill="none"
                        stroke="rgb(34, 197, 94)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="drop-shadow(0 0 4px rgba(34, 197, 94, 0.5))"
                        animate={{ d: `M ${points.split(' ')[0]} L ${points.split(' ').slice(1).join(' ')}` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />

                    {/* Interactive Dot (Last Point) */}
                    <motion.circle
                        cx={width}
                        cy={height - (dataPoints[dataPoints.length - 1] / 100) * height}
                        r="4"
                        fill="white"
                        stroke="rgb(34, 197, 94)"
                        strokeWidth="2"
                        animate={{
                            cy: height - (dataPoints[dataPoints.length - 1] / 100) * height,
                            r: [4, 6, 4]
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                </svg>
            </div>

            {/* Footer / Context */}
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
                <span className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Real-time
                </span>
                <span>Last 30m</span>
            </div>
        </div>
    )
}
