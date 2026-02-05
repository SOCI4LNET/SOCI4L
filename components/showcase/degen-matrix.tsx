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
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)' // Fade effect
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Hacker Green
            ctx.fillStyle = '#0F0'
            ctx.font = `${fontSize}px monospace`

            for (let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length))

                // Randomly highlight characters in bright white for glitch effect
                if (Math.random() > 0.98) {
                    ctx.fillStyle = '#FFF'
                } else {
                    ctx.fillStyle = '#0F0' // Standard Matrix Green
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
        <div className="relative w-full h-[300px] rounded-[24px] bg-black border border-green-500/20 overflow-hidden flex flex-col items-center justify-center group hover:border-green-500/40 transition-colors">

            {/* Matrix Canvas Background */}
            <canvas ref={canvasRef} className="absolute inset-0 opacity-25 z-0" />

            {/* Glitch Overlay */}
            <div className="absolute inset-0 z-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />

            {/* Floating Content */}
            <div className="relative z-10 text-center space-y-6">

                <div className="relative inline-block group/icon">
                    <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-10 group-hover/icon:opacity-30 transition-opacity animate-pulse" />
                    <div className="w-16 h-16 bg-black rounded-full border border-green-500/30 flex items-center justify-center relative backdrop-blur-sm">
                        <Skull className="w-6 h-6 text-green-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-green-400 drop-shadow-[0_2px_10px_rgba(34,197,94,0.5)]">
                        DEGEN MODE
                    </h2>
                    <p className="text-green-500/80 font-mono text-[10px] tracking-[0.3em] uppercase animate-pulse">System Override // Active</p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 bg-green-500 text-black font-bold font-mono text-xs tracking-widest uppercase rounded-sm hover:bg-green-400 transition-colors"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        Join Waitlist <Rocket className="w-3 h-3" />
                    </span>
                </motion.button>
            </div>

            {/* Vignette - Stronger for focus */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] z-10 pointer-events-none" />
        </div>
    )
}
