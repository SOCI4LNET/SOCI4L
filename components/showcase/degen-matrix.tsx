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
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)' // Fade effect
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.fillStyle = '#0F0' // Green text
            ctx.font = `${fontSize}px monospace`

            for (let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length))
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
        <div className="relative w-full h-[300px] rounded-xl bg-black border border-green-900/50 overflow-hidden flex flex-col items-center justify-center overflow-hidden group">

            {/* Matrix Canvas Background */}
            <canvas ref={canvasRef} className="absolute inset-0 opacity-40 z-0" />

            {/* Glitch Overlay */}
            <div className="absolute inset-0 z-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />

            {/* Floating Content */}
            <div className="relative z-10 text-center space-y-4">

                <div className="relative inline-block group/icon">
                    <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-20 group-hover/icon:opacity-50 transition-opacity animate-pulse" />
                    <div className="w-16 h-16 bg-black rounded-full border-2 border-green-500 flex items-center justify-center relative shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                        <Skull className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className="space-y-1">
                    <h2 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] [text-shadow:0_0_10px_rgba(34,197,94,0.5)]">
                        DEGEN MODE
                    </h2>
                    <p className="text-green-500/70 font-mono text-xs tracking-[0.2em] uppercase">Coming Soon // Phase 3</p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-black font-bold font-mono text-sm rounded-none border border-green-400 shadow-[4px_4px_0px_#000] relative overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        JOIN WAITLIST <Rocket className="w-4 h-4" />
                    </span>
                </motion.button>
            </div>

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,black_120%)] z-10 pointer-events-none" />
        </div>
    )
}
