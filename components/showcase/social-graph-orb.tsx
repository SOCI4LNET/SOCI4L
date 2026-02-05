'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

/**
 * Premium Social Graph Orb.
 * Features:
 * - Orbital mechanics visualization
 * - Pulsing connection lines
 * - Interactive node scaling
 */
export function SocialGraphOrb() {
    const nodes = Array.from({ length: 6 }).map((_, i) => ({
        angle: (i * 60) * (Math.PI / 180),
        delay: i * 0.2,
        size: i % 2 === 0 ? 12 : 8,
        color: i % 2 === 0 ? 'bg-cyan-500' : 'bg-purple-500'
    }))

    return (
        <div className="relative w-full h-[320px] flex items-center justify-center bg-black/5 rounded-xl overflow-hidden">
            {/* Background Grid (Subtle) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)] pointer-events-none" />

            {/* Central Node */}
            <div className="relative z-10 w-24 h-24 flex items-center justify-center">
                {/* Ripples */}
                {[1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border border-primary/10"
                        animate={{
                            scale: [1, 1.5, 1.5],
                            opacity: [0.5, 0, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: "easeOut"
                        }}
                    />
                ))}

                {/* Core */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 shadow-2xl flex items-center justify-center relative z-20 hover:scale-105 transition-transform cursor-pointer">
                    <div className="w-14 h-14 rounded-full bg-background flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-primary" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Orbital Nodes */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {nodes.map((node, i) => (
                    <OrbitalNode
                        key={i}
                        angle={node.angle}
                        delay={node.delay}
                        size={node.size}
                        color={node.color}
                    />
                ))}
            </div>

            {/* Connection Lines (Simulated SVG underneath) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                <circle cx="50%" cy="50%" r="80" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-muted-foreground animate-spin-slow" />
            </svg>
        </div>
    )
}

function OrbitalNode({ angle, delay, size, color }: { angle: number, delay: number, size: number, color: string }) {
    // We offset the rotation to simulate orbiting
    return (
        <motion.div
            className="absolute w-full h-full flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: -delay * 5 }}
        >
            <div
                className="relative"
                style={{ transform: `translateX(100px) rotate(-${angle}rad)` }} // Push out to orbit radius
            >
                {/* The Node itself - Counter rotate to stay upright if needed, or just let it spin */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay }}
                    className={`rounded-full ${color} shadow-[0_0_15px_rgba(100,200,255,0.5)]`}
                    style={{ width: size, height: size }}
                />

                {/* Connection Line to Center */}
                <div className="absolute top-1/2 right-1/2 w-[100px] h-[1px] bg-gradient-to-l from-transparent via-primary/20 to-transparent origin-right -z-10"
                    style={{ transform: 'translate(50%, -50%) rotate(180deg)' }}
                >
                    <motion.div
                        className="w-2 h-[2px] bg-primary absolute top-0 right-0"
                        animate={{ right: ['0%', '100%'], opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay, ease: "linear" }}
                    />
                </div>
            </div>
        </motion.div>
    )
}
