'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Lock } from 'lucide-react'

import { Card } from '@/components/ui/card'

// --- 1. ORBITAL SYNC (Minimalist / Ethereal) ---
export const LoaderOrbitalSync = () => {
    return (
        <div className="relative flex h-32 w-32 items-center justify-center">
            {/* Outer Glow */}
            <div className="absolute inset-0 bg-cyan-500/5 blur-xl rounded-full animate-pulse" />

            {/* Outer Ring - Slow Rotate */}
            <motion.div
                className="absolute inset-0 rounded-full border-[2px] border-b-transparent border-l-transparent border-r-cyan-500/40 border-t-cyan-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Middle Ring - Reverse */}
            <motion.div
                className="absolute inset-[10px] rounded-full border-[1.5px] border-l-transparent border-r-transparent border-b-purple-500/80 border-t-purple-500/20"
                animate={{ rotate: -360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />

            {/* Inner Ring - Fast Sprint */}
            <motion.div
                className="absolute inset-[20px] rounded-full border-[2px] border-r-transparent border-l-transparent border-t-transparent border-b-cyan-300"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />

            {/* Core Pulse */}
            <motion.div
                className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-background border border-border/50 shadow-sm"
                animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                        "0 0 0px rgba(6,182,212,0)",
                        "0 0 15px rgba(6,182,212,0.2)",
                        "0 0 0px rgba(6,182,212,0)"
                    ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
                <Lock className="h-5 w-5 text-foreground" />
            </motion.div>

            {/* Orbiting Dot */}
            <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
                <div className="absolute top-0 left-1/2 -ml-1 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_cyan]" />
            </motion.div>
        </div>
    )
}

// --- 2. IDENTITY FORGE (Tech / Security) ---
export const LoaderIdentityForge = () => {
    return (
        <div className="relative flex flex-col items-center gap-6">
            <div className="relative h-24 w-24 flex items-center justify-center">
                {/* Central Shield Pulse - Simplified */}
                <div className="relative z-10">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8],
                            filter: ["drop-shadow(0 0 0px rgba(16,185,129,0))", "drop-shadow(0 0 10px rgba(16,185,129,0.5))", "drop-shadow(0 0 0px rgba(16,185,129,0))"]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <ShieldCheck className="h-10 w-10 text-emerald-500" />
                    </motion.div>
                </div>

                {/* Scanning Laser Vertical - Cleaner */}
                <motion.div
                    className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_15px_#10b981]"
                    initial={{ top: "10%", opacity: 0 }}
                    animate={{ top: "90%", opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* Status Text with Typing Cursor */}
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-mono font-medium text-emerald-500 tracking-[0.2em] uppercase">Identity Check</span>
                </div>

                {/* Sleek Progress Bar */}
                <div className="h-0.5 w-24 bg-emerald-500/10 rounded-full overflow-hidden relative">
                    <motion.div
                        className="absolute h-full w-1/3 bg-emerald-500 shadow-[0_0_10px_#10b981]"
                        animate={{ left: ["-33%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                </div>
            </div>
        </div>
    )
}

// --- 3. CRYSTAL FACET (Avalanche / Premium Brand) ---
export const LoaderCrystalFacet = () => {
    return (
        <div className="relative flex flex-col items-center justify-center gap-6">
            <div className="relative h-20 w-20 flex items-center justify-center">
                {/* Avalanche Red Glow */}
                <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full" />

                {/* Central Diamond */}
                <motion.div
                    className="relative z-10 bg-gradient-to-br from-red-500 to-rose-700 h-8 w-8 shadow-lg shadow-red-500/30"
                    animate={{
                        rotate: [45, 225],
                        scale: [1, 1.2, 1],
                        borderRadius: ["4px", "12px", "4px"]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transformOrigin: "center" }}
                />

                {/* Orbiting Squares 1 */}
                <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                    <div className="absolute top-0 left-1/2 w-3 h-3 bg-foreground/10 border border-foreground/20 backdrop-blur-sm -translate-x-1/2 -translate-y-1/2 rotate-45" />
                    <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-foreground/10 border border-foreground/20 backdrop-blur-sm -translate-x-1/2 translate-y-1/2 rotate-45" />
                </motion.div>

                {/* Orbiting Dots 2 (Counter) */}
                <motion.div
                    className="absolute inset-4"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                >
                    <div className="absolute left-0 top-1/2 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                </motion.div>

                {/* Connecting Lines (Svg overlay) */}
                <svg className="absolute inset-[-20%] w-[140%] h-[140%] pointer-events-none opacity-30">
                    <motion.circle
                        cx="50%" cy="50%" r="35%"
                        stroke="currentColor"
                        strokeWidth="1"
                        fill="none"
                        strokeDasharray="4 4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                </svg>
            </div>

            <div className="text-center space-y-1.5">
                <h3 className="text-sm font-semibold tracking-wide">Secure Link</h3>
                <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Waiting for Signature</span>
                    <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-red-500"
                    >●</motion.span>
                </div>
            </div>
        </div>
    )
}

export function WalletLoadersShowcase() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {/* 1. Orbital Sync */}
            <Card className="relative overflow-hidden group border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:border-cyan-500/30">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-[10px] font-mono border border-cyan-500/20 text-cyan-500 px-1.5 py-0.5 rounded uppercase tracking-wider bg-cyan-500/5">
                        Orbital
                    </div>
                </div>
                <div className="p-8 flex flex-col items-center justify-center min-h-[320px] gap-8">
                    <LoaderOrbitalSync />
                    <div className="text-center space-y-1">
                        <p className="font-medium text-sm">Orbital Sync</p>
                        <p className="text-xs text-muted-foreground">Minimalist / Ethereal</p>
                    </div>
                </div>
            </Card>

            {/* 2. Identity Forge */}
            <Card className="relative overflow-hidden group border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:border-emerald-500/30">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-[10px] font-mono border border-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded uppercase tracking-wider bg-emerald-500/5">
                        System
                    </div>
                </div>
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03]" />

                <div className="p-8 flex flex-col items-center justify-center min-h-[320px] gap-8 relative z-10">
                    <LoaderIdentityForge />
                    <div className="text-center space-y-1">
                        <p className="font-medium text-sm">Identity Forge</p>
                        <p className="text-xs text-muted-foreground">Tech / Security</p>
                    </div>
                </div>
            </Card>

            {/* 3. Crystal Facet */}
            <Card className="relative overflow-hidden group border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:border-red-500/30">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-[10px] font-mono border border-red-500/20 text-red-500 px-1.5 py-0.5 rounded uppercase tracking-wider bg-red-500/5">
                        Brand
                    </div>
                </div>
                <div className="p-8 flex flex-col items-center justify-center min-h-[320px] gap-8">
                    <LoaderCrystalFacet />
                    <div className="text-center space-y-1">
                        <p className="font-medium text-sm">Crystal Facet</p>
                        <p className="text-xs text-muted-foreground">Premium / Avalanche</p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
