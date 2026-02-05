'use client'

import { motion } from 'framer-motion'
import { Rocket, Skull } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/**
 * Premium Degen Matrix Teaser.
 * Features:
 * - Canvas-based digital rain (Matrix effect)
 * - Cyberpunk glitch typography
 * - High-energy neon styling
 */
export function DegenMatrix() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Matrix Rain Effect
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = canvas.parentElement?.clientWidth || 300
        canvas.height = canvas.parentElement?.clientHeight || 200

        const chars = '0123456789ABCDEF'
        const fontSize = 14
        const columns = canvas.width / fontSize
        const drops: number[] = []

        for (let i = 0; i < columns; i++) drops[i] = 1

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)' // Stronger fade for cleaner look
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.fillStyle = '#333' // Dark Grey text for depth
            ctx.font = `${fontSize}px monospace`

            for (let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length))

                // Randomly highlight characters in white
                if (Math.random() > 0.98) {
                    ctx.fillStyle = '#FFF'
                } else {
                    ctx.fillStyle = '#333'
                }

                ctx.fillText(text, i * fontSize, drops[i] * fontSize)

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0
                }
                drops[i]++
            }
        }

        const interval = setInterval(draw, 33)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="relative w-full h-[300px] rounded-xl bg-black border border-white/10 overflow-hidden flex flex-col items-center justify-center overflow-hidden group">

            {/* Matrix Canvas Background */}
            <canvas ref={canvasRef} className="absolute inset-0 opacity-30 z-0" />

            {/* Glitch Overlay */}
            <div className="absolute inset-0 z-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />

            {/* Floating Content */}
            <div className="relative z-10 text-center space-y-6">

                <div className="relative inline-block group/icon">
                    <div className="absolute inset-0 bg-white rounded-full blur-2xl opacity-5 group-hover/icon:opacity-20 transition-opacity animate-pulse" />
                    <div className="w-16 h-16 bg-black rounded-full border border-white/20 flex items-center justify-center relative shadow-2xl">
                        <Skull className="w-6 h-6 text-white" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-neutral-700 drop-shadow-sm">
                        DEGEN MODE
                    </h2>
                    <p className="text-neutral-500 font-mono text-[10px] tracking-[0.3em] uppercase">Phase 3 // Classified</p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 bg-white hover:bg-neutral-200 text-black font-bold font-mono text-xs tracking-widest uppercase rounded-sm border-0 relative overflow-hidden transition-colors"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        Join Waitlist <Rocket className="w-3 h-3" />
                    </span>
                </motion.button>
            </div>

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,black_120%)] z-10 pointer-events-none" />
        </div>
    )
}
