'use client'

import { motion } from 'framer-motion'
import { Wallet, Fingerprint, BarChart3, Trophy, Globe, Check } from 'lucide-react'
import { useState, useEffect } from 'react'

export function LinkIntelligenceNode() {
    const [activeNode, setActiveNode] = useState(0)

    // Cycle through nodes to mock active scanning/verification
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveNode((prev) => (prev + 1) % 4)
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    // Reflected SOCI4L System Pillars
    const satellites = [
        { icon: Wallet, label: 'Wallet', sub: 'Source', color: '#FFFFFF', angle: 0 },         // White (Base)
        { icon: Fingerprint, label: 'Identity', sub: 'Unified', color: '#A855F7', angle: 90 }, // Purple (Identity)
        { icon: Trophy, label: 'Reputation', sub: 'Score', color: '#EAB308', angle: 180 },     // Gold (Score)
        { icon: BarChart3, label: 'Analytics', sub: 'Insights', color: '#22C55E', angle: 270 }, // Green (Data)
    ]

    return (
        <div className="w-full max-w-[400px] aspect-square rounded-[32px] bg-black border border-white/10 relative overflow-hidden flex items-center justify-center group">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)] opacity-50" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            {/* Central Hub */}
            <div className="relative z-20">
                <motion.div
                    animate={{ boxShadow: ['0 0 20px rgba(255,255,255,0.1)', '0 0 40px rgba(255,255,255,0.3)', '0 0 20px rgba(255,255,255,0.1)'] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-24 h-24 bg-black rounded-full border border-white/30 flex items-center justify-center relative z-20 shadow-2xl"
                >
                    <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse" />
                    <Globe className="w-10 h-10 text-white" strokeWidth={1.5} />

                    {/* Ring Animations */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        className="absolute -inset-2 border border-white/20 border-t-transparent rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                        className="absolute -inset-4 border border-dashed border-white/10 rounded-full"
                    />
                </motion.div>
            </div>

            {/* Satellites */}
            {satellites.map((sat, index) => {
                const radius = 120
                const isActive = activeNode === index

                // Position Logic (Center 0,0 relative to container center)
                const x = Math.cos((sat.angle * Math.PI) / 180) * radius
                const y = Math.sin((sat.angle * Math.PI) / 180) * radius

                return (
                    <div key={index} className="absolute z-10 flex items-center justify-center pointer-events-none" style={{
                        transform: `translate(${x}px, ${y}px)`,
                        left: '50%',
                        top: '50%',
                        marginTop: -24,
                        marginLeft: -24
                    }}>
                        {/* Connection Line & Data Flow */}
                        <svg className="absolute w-[200px] h-[200px] overflow-visible pointer-events-none" style={{
                            left: 24,
                            top: 24,
                            transform: `rotate(${sat.angle + 180}deg)`,
                            transformOrigin: '0 0'
                        }}>
                            <defs>
                                <linearGradient id={`grad-${index}`} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor={sat.color} stopOpacity="0" />
                                    <stop offset="50%" stopColor={sat.color} stopOpacity="1" />
                                    <stop offset="100%" stopColor={sat.color} stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {/* Base Line */}
                            <line
                                x1="0" y1="0"
                                x2={radius} y2="0"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                            />

                            {/* Active Data Flow packet (Core -> Satellite) */}
                            {isActive && (
                                <motion.g>
                                    {/* Glowing Head */}
                                    <motion.circle
                                        r="3"
                                        fill="white"
                                        initial={{ cx: 40, opacity: 0 }} // Start near core
                                        animate={{
                                            cx: [40, radius], // Move to satellite
                                            opacity: [0, 1, 0]
                                        }}
                                        transition={{
                                            duration: 0.8,
                                            repeat: Infinity,
                                            ease: "linear"
                                        }}
                                    />
                                    {/* Trailing Tail */}
                                    <motion.rect
                                        x="0" y="-1"
                                        height="2"
                                        fill={`url(#grad-${index})`}
                                        initial={{ x: 40, width: 0, opacity: 0 }}
                                        animate={{
                                            x: [40, radius],
                                            width: [0, 60, 0],
                                            opacity: [0, 0.8, 0]
                                        }}
                                        transition={{
                                            duration: 0.8,
                                            repeat: Infinity,
                                            ease: "linear"
                                        }}
                                    />
                                </motion.g>
                            )}
                        </svg>

                        {/* Satellite Node */}
                        <motion.div
                            animate={{
                                scale: isActive ? 1.1 : 1,
                                borderColor: isActive ? sat.color : 'rgba(255,255,255,0.1)',
                                backgroundColor: isActive ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)'
                            }}
                            className="w-12 h-12 rounded-xl border flex items-center justify-center relative shadow-xl backdrop-blur-md transition-colors duration-300 z-20"
                        >
                            <sat.icon className="w-5 h-5 transition-colors duration-300" style={{ color: isActive ? sat.color : '#666' }} />

                            {/* Verified Checkmark */}
                            {isActive && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 bg-white text-black rounded-full p-0.5 border-2 border-black z-30"
                                >
                                    <Check className="w-2.5 h-2.5" strokeWidth={4} />
                                </motion.div>
                            )}

                            {/* Label (Only when active or hover) */}
                            <motion.div
                                className="absolute -bottom-8 whitespace-nowrap flex flex-col items-center"
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: isActive ? 1 : 0.5, y: 0 }}
                            >
                                <span className="text-[10px] font-medium uppercase tracking-wider text-white font-sans">{sat.label}</span>
                                <span className="text-[8px] text-neutral-500 font-sans">{sat.sub}</span>
                            </motion.div>
                        </motion.div>
                    </div>
                )
            })}
        </div>
    )
}
