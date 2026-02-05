'use client'

import { motion } from 'framer-motion'
import { Globe2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export function GlobalNetworkMap() {
    // Mouse tracking for crosshair effect
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)

    // Generate random dots
    const [dots, setDots] = useState<Array<{ x: number, y: number, delay: number }>>([])

    useEffect(() => {
        // Generate 30 random points roughly in a world-map distribution (very rough mock)
        const newDots = Array.from({ length: 30 }).map(() => ({
            x: Math.random() * 100, // %
            y: Math.random() * 100, // %
            delay: Math.random() * 2,
        }))
        setDots(newDots)
    }, [])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2
        setMousePosition({ x, y })
    }

    return (
        <div
            className="w-full max-w-[400px] h-[300px] rounded-[32px] bg-black border border-white/10 relative overflow-hidden flex flex-col items-center justify-center group cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
                setIsHovering(false)
                setMousePosition({ x: 0, y: 0 })
            }}
        >

            {/* Header Overlay */}
            <div className="absolute top-6 left-6 z-20 flex flex-col pointer-events-none">
                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Global Graph</span>
                <span className="text-xs text-neutral-500">Live Activity</span>
            </div>

            <div className="absolute top-6 right-6 z-20 animate-pulse pointer-events-none">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span className="text-[9px] font-bold text-green-500">ONLINE</span>
                </div>
            </div>

            {/* Map Container */}
            <div className="relative w-full h-full opacity-50 contrast-125 saturate-0 group-hover:saturate-100 transition-all duration-700 pointer-events-none">
                {/* Abstract World Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(60,60,60,0.5),transparent_80%)]" />

                {/* Grid Lines */}
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />

                {/* Animated Dots */}
                {dots.map((dot, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
                    >
                        <div className="absolute inset-0 animate-ping bg-white/50 rounded-full" style={{ animationDelay: `${dot.delay}s`, animationDuration: '3s' }} />
                    </div>
                ))}

                {/* Connection Lines (SVGs) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {dots.slice(0, 10).map((dot, i) => {
                        const target = dots[(i + 1) % dots.length]
                        return (
                            <motion.line
                                key={i}
                                x1={`${dot.x}%`} y1={`${dot.y}%`}
                                x2={`${target.x}%`} y2={`${target.y}%`}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="0.5"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 2, delay: i * 0.2, repeat: Infinity, repeatType: "reverse", repeatDelay: 1 }}
                            />
                        )
                    })}
                </svg>
            </div>

            {/* Central Globe Icon Overlay - Acts as Crosshair */}
            <motion.div
                className="absolute z-30 p-4 bg-black/50 backdrop-blur-md rounded-full border border-white/10 shadow-2xl flex items-center justify-center"
                animate={{
                    x: mousePosition.x,
                    y: mousePosition.y,
                    scale: isHovering ? 1.1 : 1
                }}
                transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
            >
                {/* HUD Crosshairs interactions */}
                {isHovering && (
                    <>
                        <motion.div layoutId="crosshair-v" className="absolute w-[1px] h-[500px] bg-white/10 pointer-events-none" />
                        <motion.div layoutId="crosshair-h" className="absolute h-[1px] w-[500px] bg-white/10 pointer-events-none" />
                        <div className="absolute inset-0 border border-white/30 rounded-full animate-ping opacity-20" />
                    </>
                )}

                <Globe2 className="w-8 h-8 text-neutral-400 group-hover:text-white transition-colors relative z-10" strokeWidth={1} />
            </motion.div>

            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 pointer-events-none" />
        </div>
    )
}
