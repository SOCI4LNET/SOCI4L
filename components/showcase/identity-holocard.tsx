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

    const rotateX = useTransform(mouseY, [-200, 200], [10, -10]) // Reduced tilt for more weight
    const rotateY = useTransform(mouseX, [-200, 200], [-10, 10])
    const sheenGradient = useTransform(
        mouseX,
        [-200, 200],
        [
            'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 100%)',
            'linear-gradient(135deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 60%)', // Subtle sheen
        ]
    )

    return (
        <motion.div
            className="relative w-80 h-[420px] rounded-[24px] [perspective:1000px] group"
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
                className="relative w-full h-full rounded-[24px] bg-neutral-950 border border-white/5 shadow-2xl overflow-hidden"
            >
                {/* Abstract Background - Subtle Monochrome */}
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 z-0" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_40%)] z-0" />

                {/* Content Layer */}
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 space-y-8 [transform:translateZ(30px)]">

                    {/* Avatar Ring - Minimalist */}
                    <div className="relative">
                        {/* Outer Ring */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            className="absolute -inset-6 rounded-full border border-white/5"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                            className="absolute -inset-3 rounded-full border border-dashed border-white/10"
                        />

                        {/* Core Avatar */}
                        <div className="w-24 h-24 rounded-full bg-neutral-900 border border-white/10 p-1 relative shadow-inner">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10" />
                                <span className="text-2xl font-medium tracking-tighter text-white">S4</span>
                            </div>

                            {/* Verified Badge - Monochrome */}
                            <div className="absolute -bottom-1 -right-1 bg-white text-black rounded-full p-1 border-4 border-neutral-950">
                                <Check className="w-3 h-3" strokeWidth={3} />
                            </div>
                        </div>
                    </div>

                    {/* User Info - Clean Typography */}
                    <div className="text-center space-y-3">
                        <h2 className="text-2xl font-medium tracking-tight text-white flex items-center justify-center gap-2">
                            satoshi.avax
                        </h2>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">0x8ab...1a2b</span>
                        </div>
                    </div>

                    {/* Stats Row - Text Only, No Emojis */}
                    <div className="grid grid-cols-2 gap-px bg-white/5 w-full rounded-lg overflow-hidden border border-white/5 mt-auto">
                        <div className="bg-neutral-900/50 p-3 flex flex-col items-center gap-0.5 group/stat cursor-pointer hover:bg-white/5 transition-colors">
                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-medium">Score</span>
                            <span className="text-base font-semibold text-white tracking-tight">980</span>
                        </div>
                        <div className="bg-neutral-900/50 p-3 flex flex-col items-center gap-0.5 group/stat cursor-pointer hover:bg-white/5 transition-colors">
                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-medium">Rank</span>
                            <span className="text-base font-semibold text-white tracking-tight">#42</span>
                        </div>
                    </div>

                </div>

                {/* Glare/Sheen Layer */}
                <motion.div
                    style={{ background: sheenGradient }}
                    className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay opacity-50"
                />

                {/* Subtle Border Gradient Accent */}
                <div className="absolute inset-0 rounded-[24px] border border-white/10 z-30 pointer-events-none mix-blend-overlay" />

            </motion.div>
        </motion.div>
    )
}
