'use client'

import React from 'react'
import { motion } from 'framer-motion'

import { MousePointer2, Plus, Users, Wallet, ArrowUpRight, LayoutDashboard, QrCode } from 'lucide-react'

export function OrbitConnection() {
    return (
        <div className="w-full h-[280px] relative overflow-hidden pointer-events-none perspective-[1000px] flex justify-center">
            {/* Fade out to bottom */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background to-transparent z-10" />

            {/* SVG Container */}
            {/* 
                Taller Arches:
                SVG 1400x800. Center y=400.
                Outer ry=350. Top Apex = 400-350 = 50.
                Container h=280.
                Old top: -120px => Apex at 50 - 120 = -70px (CLIPPED).
                New top: -30px => Apex at 50 - 30 = 20px (VISIBLE).
                Equator (y=400) => 400 - 30 = 370px (Below container bottom, valid).
            */}
            <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[1400px] h-[800px] opacity-100">
                <svg className="w-full h-full" viewBox="0 0 1400 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        {/* Clip to top half (Arch) */}
                        <clipPath id="top-half-clip">
                            <rect x="0" y="0" width="1400" height="400" />
                        </clipPath>
                    </defs>

                    <g clipPath="url(#top-half-clip)" className="stroke-muted-foreground/40 dark:stroke-white/40">
                        {/* Orbit 1: Outer - Very Tall */}
                        <ellipse cx="700" cy="400" rx="600" ry="350" strokeWidth="1" strokeDasharray="4 4" />

                        {/* Orbit 2: Middle */}
                        <ellipse cx="700" cy="400" rx="450" ry="260" strokeWidth="1" strokeDasharray="4 4" />

                        {/* Orbit 3: Inner */}
                        <ellipse cx="700" cy="400" rx="300" ry="180" strokeWidth="1" />
                    </g>
                </svg>
            </div>

            {/* Orbiting Elements */}
            <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[1400px] h-[800px]">
                {ORBIT_ITEMS.map((item, i) => (
                    <OrbitItem
                        key={i}
                        rx={item.rx}
                        ry={item.ry}
                        duration={item.duration}
                        initialAngle={item.angle}
                        reverse={item.reverse}
                    >
                        {item.content}
                    </OrbitItem>
                ))}
            </div>
        </div>
    )
}

// Helper for centering dots/pills exactly on the line
const Centered = ({ children }: { children: React.ReactNode }) => (
    <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto cursor-pointer group hover:scale-110 transition-transform duration-300">
        {/* Hover Highlight/Glow */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-full blur-md transition-colors duration-300" />
        {children}
    </div>
)

// Helper for Icon + Label where Icon is on the line, Label is offset
const IconAnchor = ({ icon, label, className }: { icon: React.ReactNode, label: React.ReactNode, className?: string }) => (
    <div className={`absolute left-0 top-0 pointer-events-auto cursor-pointer group ${className}`}>
        {/* Icon centered on 0,0 */}
        <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            {/* Glow behind icon on hover */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 rounded-full blur-lg transition-colors duration-300" />
            {icon}
        </div>
        {/* Label offset to right */}
        <div className="absolute left-5 top-0 -translate-y-1/2 w-max pl-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
            {label}
        </div>
    </div>
)

// Data-driven configuration to ensure >5 visible items (Density) and Uniqueness
const ORBIT_ITEMS = [
    // --- Outer Orbit (Data & Eco) - rx: 600, ry: 350 ---
    {
        rx: 600, ry: 350, duration: 80, angle: 0, reverse: false,
        content: (
            <IconAnchor
                icon={
                    <div className="bg-background/90 backdrop-blur-md border border-border p-2 rounded-full shadow-sm">
                        <ArrowUpRight className="w-4 h-4 text-foreground" />
                    </div>
                }
                label={
                    <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">TRANSACTIONS</span>
                }
            />
        )
    },
    {
        rx: 600, ry: 350, duration: 80, angle: 90, reverse: false,
        content: (
            <Centered>
                <div className="bg-background/90 backdrop-blur-md border border-border px-3 py-1.5 rounded-full hover:border-primary/50 transition-colors">
                    <span className="text-muted-foreground text-xs font-mono">0x71...3a9</span>
                </div>
            </Centered>
        )
    },
    {
        rx: 600, ry: 350, duration: 80, angle: 180, reverse: false,
        content: (
            <IconAnchor
                icon={
                    <div className="bg-background/90 border border-border p-2 rounded-full">
                        <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                    </div>
                }
                label={
                    <span className="text-muted-foreground text-xs font-medium">Dashboard</span>
                }
            />
        )
    },
    {
        rx: 600, ry: 350, duration: 80, angle: 270, reverse: false,
        content: (
            <Centered>
                <div className="bg-background/90 border border-border/60 p-2 rounded-full">
                    <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse" />
                </div>
            </Centered>
        )
    },

    // --- Middle Orbit (Social) - rx: 450, ry: 260 ---
    {
        rx: 450, ry: 260, duration: 60, angle: 45, reverse: true,
        content: (
            <IconAnchor
                icon={
                    <div className="bg-background/90 backdrop-blur-md border border-pink-500/30 p-2 rounded-full shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                        <Users className="w-4 h-4 text-pink-500" />
                    </div>
                }
                label={
                    <span className="text-foreground text-xs font-medium">Social Graph</span>
                }
            />
        )
    },
    {
        rx: 450, ry: 260, duration: 60, angle: 135, reverse: true,
        content: (
            // Refactored to IconAnchor for consistent single-line "Pattern"
            <IconAnchor
                icon={
                    <div className="bg-background/90 border border-border p-2 rounded-full shadow-sm">
                        <Plus className="w-3.5 h-3.5 text-foreground" />
                    </div>
                }
                label={
                    <div className="bg-background/80 backdrop-blur-sm border border-border px-2.5 py-1 rounded-md">
                        <span className="text-foreground text-xs font-medium whitespace-nowrap">1 Follower</span>
                    </div>
                }
            />
        )
    },
    {
        rx: 450, ry: 260, duration: 60, angle: 225, reverse: true,
        content: (
            <IconAnchor
                icon={
                    <div className="bg-background/90 border border-border p-2 rounded-full">
                        <QrCode className="w-4 h-4 text-muted-foreground" />
                    </div>
                }
                label={
                    <span className="text-muted-foreground text-xs">QR Scanned</span>
                }
            />
        )
    },
    {
        rx: 450, ry: 260, duration: 60, angle: 315, reverse: true,
        content: (
            <IconAnchor
                icon={
                    <div className="bg-background/90 border border-border p-2 rounded-full">
                        <MousePointer2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                }
                label={
                    <span className="text-muted-foreground text-xs">Link Clicked</span>
                }
            />
        )
    },

    // --- Inner Orbit (Assets) - rx: 300, ry: 180 ---
    {
        rx: 300, ry: 180, duration: 40, angle: 0, reverse: false,
        content: (
            <IconAnchor
                icon={
                    <div className="bg-background/90 backdrop-blur-md border border-blue-500/30 p-2 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <Wallet className="w-4 h-4 text-blue-500" />
                    </div>
                }
                label={
                    <div className="bg-background/80 backdrop-blur-sm border border-border px-2 py-0.5 rounded-md">
                        <span className="text-foreground text-xs font-mono">$AVAX</span>
                    </div>
                }
            />
        )
    },
    {
        rx: 300, ry: 180, duration: 40, angle: 120, reverse: false,
        content: (
            <Centered>
                <div className="bg-background/90 border border-border px-2 py-1 rounded-md group-hover:bg-muted transition-colors">
                    <span className="text-muted-foreground text-xs font-medium">NFTs</span>
                </div>
            </Centered>
        )
    },
    {
        rx: 300, ry: 180, duration: 40, angle: 240, reverse: false,
        content: (
            <Centered>
                <div className="bg-background/90 border border-border p-2 rounded-full group-hover:border-primary/50 transition-colors">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                </div>
            </Centered>
        )
    }
]

function OrbitItem({ rx, ry, duration, initialAngle = 0, reverse = false, children }: { rx: number, ry: number, duration: number, initialAngle?: number, reverse?: boolean, children: React.ReactNode }) {
    // Generate smooth keyframes (120 steps)
    const steps = 120
    const keyframes = {
        x: [] as number[],
        y: [] as number[],
        scale: [] as number[],
        opacity: [] as number[],
        zIndex: [] as number[]
    }

    for (let i = 0; i <= steps; i++) {
        const progress = i / steps
        const totalAngle = (reverse ? -1 : 1) * (progress * 2 * Math.PI) + (initialAngle * Math.PI / 180)

        const x = rx * Math.cos(totalAngle)
        const y = ry * Math.sin(totalAngle)

        // Depth & Visibility Logic (Arch Mode)
        const isVisible = y <= 0 // Only visible in top half (Arch)
        const normalizedY = y / ry // -1 (top/far) to 0 (equator/near)

        // Scale map: -1 (Far) -> 0.6.  0 (Equator) -> 1.0.
        const scale = 0.6 + 0.4 * (normalizedY + 1)

        // Opacity: High visibility.
        const opacity = isVisible ? (0.6 + 0.4 * (normalizedY + 1)) : 0
        const zIndex = isVisible ? 20 : 0

        keyframes.x.push(x)
        keyframes.y.push(y)
        keyframes.scale.push(scale)
        keyframes.opacity.push(opacity)
        keyframes.zIndex.push(zIndex)
    }

    return (
        <motion.div
            className="absolute top-1/2 left-1/2 origin-center"
            animate={{
                x: keyframes.x,
                y: keyframes.y,
                scale: keyframes.scale,
                opacity: keyframes.opacity,
                zIndex: keyframes.zIndex
            }}
            transition={{
                duration: duration,
                repeat: Infinity,
                ease: "linear",
            }}
        >
            {/* 
                REMOVED: className="-translate-x-1/2 -translate-y-1/2"
                We now want (0,0) of this div to be the point on the orbit.
                The children (Centered or IconAnchor) manage their own centering relative to this point.
            */}
            {children}
        </motion.div>
    )
}
