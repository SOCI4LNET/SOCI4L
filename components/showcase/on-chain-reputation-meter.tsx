'use client'

import { motion } from 'framer-motion'

import { Trophy, TrendingUp, ShieldCheck } from 'lucide-react'

/**
 * Premium On-Chain Reputation Meter
 * Design Ref: Minimalist, Semi-Circle Gauge, Monochrome + Gold/Cyan Accent
 * No Shadows on Dark Theme as requested.
 */
export function OnChainReputationMeter() {
    const score = 850
    const maxScore = 1000
    const percentage = score / maxScore

    // Gauge Logic
    const radius = 90
    const circumference = Math.PI * radius // Semi-circle circumference
    const strokeDashoffset = circumference - (percentage * circumference)

    return (
        <div className="w-full max-w-[400px] h-[300px] rounded-[32px] bg-black border border-white/10 relative overflow-hidden flex flex-col items-center justify-start py-10 group">

            {/* Background Texture - Subtle Noise */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />

            {/* Main Gauge Container */}
            <div className="relative w-[220px] h-[130px] overflow-hidden mb-4 flex justify-center">
                <svg className="w-[220px] h-[220px] -rotate-180 transform origin-center">
                    {/* Track */}
                    <circle
                        cx="110" cy="110" r={radius}
                        fill="none"
                        stroke="#1a1a1a"
                        strokeWidth="12"
                        strokeLinecap="butt"
                    />
                    {/* Progress */}
                    <motion.circle
                        cx="110" cy="110" r={radius}
                        fill="none"
                        stroke="url(#monochrome-gradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference} // Start full offset (0%)
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "circOut", delay: 0.2 }}
                        style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.3))" }}
                    />
                    <defs>
                        <linearGradient id="monochrome-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#555" />
                            <stop offset="100%" stopColor="#fff" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Inner Labels positioned absolutely */}
                <div className="absolute top-[60px] left-0 right-0 flex flex-col items-center">
                    <span className="text-[8px] font-bold tracking-[0.2em] text-neutral-600 uppercase mb-1 font-sans">Trust Score</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white tracking-tighter font-sans">{score}</span>
                        <span className="text-[10px] text-neutral-600 font-medium font-sans">/{maxScore}</span>
                    </div>
                </div>
            </div>

            {/* Stats / Badges - Ultra Clean Row */}
            <div className="w-full px-12 flex items-center justify-between mt-8">
                <div className="flex flex-col items-center gap-1.5 group/stat cursor-pointer">
                    <ShieldCheck className="w-3.5 h-3.5 text-neutral-500 group-hover/stat:text-white transition-colors" />
                    <span className="text-[8px] uppercase tracking-widest text-neutral-600 font-medium group-hover/stat:text-neutral-400 transition-colors">Verified</span>
                </div>

                <div className="h-6 w-[1px] bg-white/5" />

                <div className="flex flex-col items-center gap-1.5 group/stat cursor-pointer">
                    <TrendingUp className="w-3.5 h-3.5 text-neutral-500 group-hover/stat:text-white transition-colors" />
                    <span className="text-[8px] uppercase tracking-widest text-neutral-600 font-medium group-hover/stat:text-neutral-400 transition-colors">Top 1%</span>
                </div>

                <div className="h-6 w-[1px] bg-white/5" />

                <div className="flex flex-col items-center gap-1.5 group/stat cursor-pointer">
                    <Trophy className="w-3.5 h-3.5 text-neutral-500 group-hover/stat:text-white transition-colors" />
                    <span className="text-[8px] uppercase tracking-widest text-neutral-600 font-medium group-hover/stat:text-neutral-400 transition-colors">Whale</span>
                </div>
            </div>

        </div>
    )
}
