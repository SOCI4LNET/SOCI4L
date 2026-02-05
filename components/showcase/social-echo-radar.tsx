'use client'

import { motion } from 'framer-motion'
import { Radio, Users, MessageCircle, Heart, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

export function SocialEchoRadar() {
    // Mock data points
    const [blips, setBlips] = useState<{ id: number, x: number, y: number, type: 'user' | 'like' | 'msg' }[]>([])

    // Add random blips
    useEffect(() => {
        const interval = setInterval(() => {
            const newBlip = {
                id: Date.now(),
                x: Math.random() * 80 + 10, // 10-90%
                y: Math.random() * 80 + 10,
                type: Math.random() > 0.6 ? 'user' : (Math.random() > 0.5 ? 'like' : 'msg') as 'user' | 'like' | 'msg'
            }
            // Keep last 8 blips for richer visual
            setBlips(prev => [...prev.slice(-7), newBlip])
        }, 600) // Much faster interval for "Echo" effect
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="w-full max-w-[400px] aspect-square rounded-[32px] bg-card border border-border relative overflow-hidden flex items-center justify-center group flex-col">

            {/* Radar Grid Background - Fixed HSL wrapping */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,hsl(var(--border))_30%,hsl(var(--border))_31%,transparent_31%,transparent_50%,hsl(var(--border))_50%,hsl(var(--border))_51%,transparent_51%,transparent_70%,hsl(var(--border))_70%,hsl(var(--border))_71%,transparent_71%)] pointer-events-none opacity-50" />

            {/* Crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-[1px] bg-border" />
                <div className="h-full w-[1px] bg-border absolute" />
            </div>

            {/* Radar Sweep Animation - Fixed HSL wrapping */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 pointer-events-none"
            >
                <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,hsl(var(--accent-primary))_360deg)] opacity-20 rounded-full" />
            </motion.div>

            {/* Central Hub */}
            <div className="relative z-20 w-12 h-12 bg-card rounded-full border border-border flex items-center justify-center">
                <Radio className="w-5 h-5 text-[hsl(var(--accent-primary))]" />
            </div>

            {/* Blips */}
            {blips.map((blip) => (
                <motion.div
                    key={blip.id}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: [0, 1.5], opacity: [1, 0] }}
                    transition={{ duration: 2 }}
                    className="absolute z-10 flex items-center justify-center"
                    style={{ left: `${blip.x}%`, top: `${blip.y}%` }}
                >
                    <div className={`w-3 h-3 rounded-full ${blip.type === 'user' ? 'bg-sky-500' :
                        blip.type === 'like' ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />

                    {/* Echo Ring */}
                    <div className="absolute inset-0 border border-muted-foreground/30 rounded-full animate-ping" />

                    {/* Icon Label (Fade in/out rapidly) */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: [0, 1, 0], y: [10, -10] }}
                        transition={{ duration: 2 }}
                        className="absolute bottom-4 whitespace-nowrap"
                    >
                        {blip.type === 'user' && <Users className="w-3 h-3 text-sky-500" />}
                        {blip.type === 'like' && <Heart className="w-3 h-3 text-rose-500" />}
                        {blip.type === 'msg' && <MessageCircle className="w-3 h-3 text-amber-500" />}
                    </motion.div>
                </motion.div>
            ))}

            {/* Stats Overlay */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-30">
                <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-mono uppercase">Range</span>
                    <span className="text-sm font-mono text-[hsl(var(--accent-primary))]">GLOBAL</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-muted-foreground font-mono uppercase">Activity</span>
                    <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-mono text-foreground">HIGH</span>
                    </div>
                </div>
            </div>

        </div>
    )
}
