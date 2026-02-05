'use client'

import { motion } from 'framer-motion'
import { Lock, Fingerprint, Key } from 'lucide-react'
import { useState, useEffect } from 'react'

export function DidVault() {
    const [isUnlocked, setIsUnlocked] = useState(false)

    // Auto toggle state to demonstrate animation
    useEffect(() => {
        const interval = setInterval(() => {
            setIsUnlocked(prev => !prev)
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="w-full max-w-[400px] aspect-square rounded-[32px] bg-card border border-border relative overflow-hidden flex items-center justify-center group select-none">

            {/* Ambient Background - Very subtle brand tint */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--accent-primary)),transparent_70%)] opacity-[0.05]" />

            {/* Diagonal Stripes Pattern */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,hsl(var(--border))_0,hsl(var(--border))_1px,transparent_0,transparent_10px)] opacity-20 pointer-events-none" />

            {/* Status Indicator */}
            <div className="absolute top-6 flex items-center gap-2 z-20">
                <motion.div
                    initial={false}
                    animate={{ backgroundColor: isUnlocked ? '#22c55e' : 'hsl(var(--muted-foreground))' }}
                    className="w-2 h-2 rounded-full"
                />
                <motion.span
                    key={isUnlocked ? 'public' : 'private'}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground"
                >
                    {isUnlocked ? 'IDENTITY: PUBLIC' : 'IDENTITY: ENCRYPTED'}
                </motion.span>
            </div>

            {/* The Vault Construction */}
            <div className="relative w-48 h-48 flex items-center justify-center">

                {/* Outer Ring - Static decor */}
                <div className="absolute inset-0 rounded-full border border-border" />

                {/* Ring 1 - Rotating Clockwise */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 rounded-full border border-dashed border-muted-foreground/20"
                />

                {/* Ring 2 - Rotating Counter-Clockwise */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-6 rounded-full border-2 border-border border-t-muted-foreground/50 border-r-transparent"
                />

                {/* Ring 3 - The Lock Mechanism */}
                <motion.div
                    animate={{
                        rotate: isUnlocked ? 0 : 180,
                        borderColor: isUnlocked ? 'hsl(var(--accent-primary))' : 'hsl(var(--muted-foreground))'
                    }}
                    transition={{ duration: 0.8, type: "spring" }}
                    className="absolute inset-10 rounded-full border-4 border-l-transparent transition-colors duration-500"
                />

                {/* Central Core */}
                <div className="absolute inset-0 m-auto w-24 h-24 bg-card rounded-full border border-border flex items-center justify-center z-10 overflow-hidden">

                    {/* Locked State Content */}
                    <motion.div
                        initial={false}
                        animate={{
                            opacity: isUnlocked ? 0 : 1,
                            scale: isUnlocked ? 0.8 : 1
                        }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center flex-col gap-1"
                    >
                        <Lock className="w-8 h-8 text-muted-foreground mb-1" strokeWidth={1.5} />
                        <div className="flex gap-0.5">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            ))}
                        </div>
                    </motion.div>

                    {/* Unlocked State Content */}
                    <motion.div
                        initial={false}
                        animate={{
                            opacity: isUnlocked ? 1 : 0,
                            scale: isUnlocked ? 1 : 0.8,
                            filter: isUnlocked ? 'blur(0px)' : 'blur(4px)'
                        }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center bg-muted/10"
                    >
                        <Fingerprint className="w-10 h-10 text-[hsl(var(--accent-primary))]" strokeWidth={1.5} />
                    </motion.div>
                </div>

                {/* Floating "Keys" or access tokens */}
                {[0, 120, 240].map((angle, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            scale: isUnlocked ? 0 : 1,
                            opacity: isUnlocked ? 0 : 1,
                            x: [0, 5, 0],
                            y: [0, 5, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.5
                        }}
                        className="absolute w-8 h-8 rounded-full bg-card/80 border border-border flex items-center justify-center backdrop-blur-sm"
                        style={{
                            top: '50%',
                            left: '50%',
                            marginTop: -16,
                            marginLeft: -16,
                            transform: `rotate(${angle}deg) translate(80px) rotate(-${angle}deg)` // Position on circle
                        }}
                    >
                        <Key className="w-3 h-3 text-muted-foreground" />
                    </motion.div>
                ))}

            </div>

            {/* Bottom Label */}
            <div className="absolute bottom-8 text-center z-20">
                <div className="text-foreground text-sm font-semibold tracking-wide">DeID Vault</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Self-Sovereign Storage</div>
            </div>

        </div>
    )
}
