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
        <div className="w-full max-w-[340px] rounded-xl bg-black border border-white/10 p-6 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-white rounded-full" /> {/* Minimalist indicator */}
                    <div>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Active Users</p>
                        <h4 className="text-xl font-medium tracking-tight text-white tabular-nums">12,842</h4>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                    </span>
                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">Live</span>
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative h-[100px] w-full">
                <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgb(255, 255, 255)" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="rgb(255, 255, 255)" stopOpacity="0" />
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
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        // filter="drop-shadow(0 0 2px rgba(255, 255, 255, 0.3))" 
                        animate={{ d: `M ${points.split(' ')[0]} L ${points.split(' ').slice(1).join(' ')}` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />

                    {/* Interactive Dot (Last Point) */}
                    <motion.circle
                        cx={width}
                        cy={height - (dataPoints[dataPoints.length - 1] / 100) * height}
                        r="3"
                        fill="black"
                        stroke="white"
                        strokeWidth="2"
                        animate={{
                            cy: height - (dataPoints[dataPoints.length - 1] / 100) * height,
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                </svg>
            </div>
        </div>
    )
}
