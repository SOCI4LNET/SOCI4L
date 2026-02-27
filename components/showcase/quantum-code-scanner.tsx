'use client'

import { motion } from 'framer-motion'

import { QrCode, Share2, Smartphone } from 'lucide-react'

export function QuantumCodeScanner() {
    // Generate a static grid for the QR code base
    const gridSize = 6
    const modules = Array.from({ length: gridSize * gridSize })

    return (
        <div className="w-full max-w-[400px] aspect-square rounded-[32px] bg-card border border-border relative overflow-hidden flex items-center justify-center group flex-col">

            {/* Ambient Background - Subtle Cyan Tint using semantic vars if possible, or muted equivalent */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--accent-primary)),transparent_70%)] opacity-[0.05]" />

            {/* Tech Grid Background using border color */}
            <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none" />

            {/* Header/Status */}
            <div className="absolute top-6 left-0 right-0 flex justify-center z-20">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-3 py-1 rounded-full bg-muted/50 border border-border backdrop-blur-md flex items-center gap-2"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent-primary))] animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Ready to Pair</span>
                </motion.div>
            </div>

            {/* Main QR Container */}
            <div className="relative z-10 p-6 rounded-2xl bg-muted/20 border border-border backdrop-blur-sm overflow-hidden">
                {/* Corner Accents - Using Brand Cyan */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[hsl(var(--accent-primary))] rounded-tl-lg opacity-50" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[hsl(var(--accent-primary))] rounded-tr-lg opacity-50" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[hsl(var(--accent-primary))] rounded-bl-lg opacity-50" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[hsl(var(--accent-primary))] rounded-br-lg opacity-50" />

                {/* The QR Modules */}
                <div className="relative grid grid-cols-6 gap-1.5 w-32 h-32">
                    {modules.map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0.3, scale: 0.8 }}
                            animate={{
                                opacity: [0.3, 0.8, 0.3],
                                scale: [0.8, 1, 0.8],
                                backgroundColor: ['hsl(var(--muted-foreground))', 'hsl(var(--accent-primary))', 'hsl(var(--muted-foreground))']
                            }}
                            transition={{
                                duration: 2 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2
                            }}
                            className="rounded-[2px]"
                        />
                    ))}

                    {/* Central Logo/Icon Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-card rounded-lg border border-border flex items-center justify-center z-10">
                            <QrCode className="w-5 h-5 text-[hsl(var(--accent-primary))]" />
                        </div>
                    </div>
                </div>

                {/* Scanning Beam - No shadow, just gradient */}
                <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                    className="absolute left-0 right-0 h-[2px] bg-[hsl(var(--accent-primary))] opacity-50 z-20"
                />
            </div>

            {/* Interaction Hints */}
            <div className="absolute bottom-8 flex gap-8 z-20">
                <div className="flex flex-col items-center gap-2 group/icon">
                    <div className="w-10 h-10 rounded-full bg-muted/20 border border-border flex items-center justify-center group-hover/icon:bg-muted/40 transition-all duration-300">
                        <Share2 className="w-4 h-4 text-muted-foreground group-hover/icon:text-[hsl(var(--accent-primary))]" />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono tracking-wider">SHARE</span>
                </div>
                <div className="flex flex-col items-center gap-2 group/icon">
                    <div className="w-10 h-10 rounded-full bg-muted/20 border border-border flex items-center justify-center group-hover/icon:bg-muted/40 transition-all duration-300">
                        <Smartphone className="w-4 h-4 text-muted-foreground group-hover/icon:text-[hsl(var(--accent-primary))]" />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono tracking-wider">SAVE</span>
                </div>
            </div>

            {/* Floating Particles (Data Bits) - Using theme colors */}
            <motion.div
                animate={{ y: [0, -100], opacity: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1 }}
                className="absolute bottom-20 right-20 w-1 h-1 bg-[hsl(var(--accent-primary))] rounded-full"
            />
            <motion.div
                animate={{ y: [0, -80], opacity: [0, 1, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                className="absolute bottom-24 left-24 w-1 h-1 bg-muted-foreground rounded-full"
            />

        </div>
    )
}
