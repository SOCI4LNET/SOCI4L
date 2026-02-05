'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Zap } from 'lucide-react'
import Image from 'next/image'

/**
 * Premium Holocard Component for User Identity.
 * Features:
 * - 3D Tilt Effect on mouse move
 * - Holographic shimmer overlay
 * - Floating elements
 */
export function IdentityHolocard() {
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 })
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 })

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect()
        x.set(clientX - left - width / 2)
        y.set(clientY - top - height / 2)
    }

    const rotateX = useTransform(mouseY, [-200, 200], [15, -15])
    const rotateY = useTransform(mouseX, [-200, 200], [-15, 15])
    const sheenGradient = useTransform(
        mouseX,
        [-200, 200],
        [
            'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 100%)',
            'linear-gradient(135deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 60%)',
        ]
    )

    return (
        <motion.div
            className="relative w-80 h-[420px] rounded-3xl [perspective:1000px] group"
            onMouseMove={onMouseMove}
            onMouseLeave={() => {
                x.set(0)
                y.set(0)
            }}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                className="relative w-full h-full rounded-3xl bg-black border border-white/10 shadow-2xl overflow-hidden"
            >
                {/* Background Mesh Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-background to-background z-0" />

                {/* Animated Background Noise/Texture */}
                <div className="absolute inset-0 opacity-20 bg-[url('/noise.png')] mix-blend-overlay z-0" />

                {/* Content Layer */}
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 space-y-6 [transform:translateZ(20px)]">

                    {/* Avatar Ring */}
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                            className="absolute -inset-4 rounded-full border border-dashed border-white/20"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                            className="absolute -inset-2 rounded-full border border-dotted border-white/10"
                        />
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-[0_0_40px_-5px_rgba(124,58,237,0.5)]">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                <span className="text-3xl font-bold text-white">S4</span>
                            </div>
                        </div>

                        {/* Verified Badge */}
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-4 border-black shadow-lg">
                            <Check className="w-3 h-3 text-white" strokeWidth={4} />
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                            satoshi.avax
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </h2>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                            <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-xs px-2 h-5">OG</Badge>
                            <span className="text-xs text-muted-foreground font-mono">0x8ab...1a2b</span>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-white/5">
                        <div className="flex flex-col items-center gap-1 group/stat cursor-pointer">
                            <span className="text-xs text-muted-foreground uppercase tracking-widest group-hover/stat:text-primary transition-colors">Score</span>
                            <div className="flex items-center gap-1">
                                <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-lg font-bold">980</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 group/stat cursor-pointer">
                            <span className="text-xs text-muted-foreground uppercase tracking-widest group-hover/stat:text-primary transition-colors">Rank</span>
                            <div className="flex items-center gap-1">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                <span className="text-lg font-bold">#42</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Glare/Sheen Layer */}
                <motion.div
                    style={{ background: sheenGradient }}
                    className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
                />

                {/* Border Gradient Accent */}
                <div className="absolute inset-0 rounded-3xl border border-white/5 z-30 pointer-events-none" />

            </motion.div>
        </motion.div>
    )
}
