'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import { Share2, Link, Fingerprint, BarChart3, Trophy, Wallet, Command } from 'lucide-react'

/**
 * Social Constellation
 * Concept: A living, breathing mesh of connections illustrating the SOCI4L ecosystem.
 * 
 * Updates:
 * - Central node is SOCI4L (Command icon).
 * - Satellite nodes are Features (Links, Identity, etc.).
 * - Labels are perfectly centered relative to dots.
 */
export function SocialConstellation() {
    const [state, setState] = useState<'idle' | 'scanning' | 'connected'>('idle')

    // SOCI4L Ecosystem Pillars
    const FEATURES = [
        { label: 'Links', icon: Link },
        { label: 'Identity', icon: Fingerprint },
        { label: 'Insights', icon: BarChart3 },
        { label: 'Score', icon: Trophy },
        { label: 'Wallet', icon: Wallet },
        { label: 'Network', icon: Share2 },
    ]

    useEffect(() => {
        const cycle = async () => {
            while (true) {
                setState('idle')
                await new Promise(r => setTimeout(r, 2000))
                setState('scanning')
                await new Promise(r => setTimeout(r, 2500))
                setState('connected')
                await new Promise(r => setTimeout(r, 5000))
            }
        }
        cycle()
    }, [])

    return (
        <div className="w-full max-w-[400px] h-[350px] rounded-[32px] bg-black border border-white/10 relative overflow-hidden flex flex-col items-center justify-center p-6 group">

            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            {/* Main Network Container */}
            <div className="relative w-full h-full flex items-center justify-center -translate-y-4">

                {/* Central Hub Node (SOCI4L Core) */}
                <motion.div
                    className="absolute z-20 w-16 h-16 bg-neutral-900 border border-white/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    animate={{
                        scale: state === 'connected' ? 1.1 : 1,
                        borderColor: state === 'connected' ? '#fff' : 'rgba(255,255,255,0.2)'
                    }}
                    transition={{ duration: 0.5 }}
                >
                    <Command className="w-8 h-8 text-white" strokeWidth={1.5} />

                    {/* Ripple/Radar Effect */}
                    {state === 'scanning' && (
                        <motion.div
                            className="absolute inset-0 rounded-full border border-white/20"
                            initial={{ scale: 1, opacity: 1 }}
                            animate={{ scale: 3, opacity: 0 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                        />
                    )}
                </motion.div>

                {/* Satellite Feature Nodes */}
                {FEATURES.map((feature, i) => {
                    const angle = (i * 60) * (Math.PI / 180)
                    const radius = 100
                    const x = Math.cos(angle) * radius
                    const y = Math.sin(angle) * radius

                    return (
                        <NodeItem
                            key={i}
                            index={i}
                            x={x}
                            y={y}
                            state={state}
                            label={feature.label}
                            Icon={feature.icon}
                        />
                    )
                })}
            </div>

            {/* Status Label */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                    {state === 'idle' ? 'System Idle' : state === 'scanning' ? 'Discovering Modules' : 'Ecosystem Synced'}
                </span>
                <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            className="w-1 h-1 rounded-full bg-white"
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

/**
 * Sub-component for individual nodes.
 */
function NodeItem({ index, x, y, state, label, Icon }: { index: number, x: number, y: number, state: 'idle' | 'scanning' | 'connected', label: string, Icon: any }) {
    return (
        <motion.div
            className="absolute z-10 flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2" // Centering fix
            style={{
                x,
                y,
                width: 0, // Zero width container to ensure absolute centering relative to x,y point
                height: 0
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
                scale: state === 'idle' ? 0.5 : 1,
                opacity: state === 'idle' ? 0.3 : 1
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: index * 0.1 }}
        >
            {/* The Node Dot / Icon Container */}
            <div className="w-8 h-8 shrink-0 rounded-full bg-black border border-white/20 flex items-center justify-center relative z-20 backdrop-blur-sm shadow-lg">
                <Icon className="w-4 h-4 text-neutral-300" />
            </div>

            {/* Connection Line to Center */}
            <svg className="absolute w-[200px] h-[200px] -z-10 pointer-events-none overflow-visible" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <motion.line
                    x1="100" y1="100" // Center of SVG (Node Center)
                    x2={100 - x} y2={100 - y} // Vector back to 0,0 (Hub Center)
                    stroke="white"
                    strokeWidth="1"
                    strokeOpacity="0.1"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: state === 'connected' ? 1 : 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                />
            </svg>

            {/* Floating Label (Centered below node) */}
            {state === 'connected' && (
                <motion.div
                    className="absolute top-6 bg-neutral-900/90 border border-white/10 px-2 py-1 rounded text-[8px] text-white font-medium uppercase tracking-wider backdrop-blur-md whitespace-nowrap"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                >
                    {label}
                </motion.div>
            )}
        </motion.div>
    )
}
