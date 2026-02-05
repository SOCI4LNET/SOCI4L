'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, ShieldCheck, Wallet } from 'lucide-react'
import { useState, useEffect } from 'react'

/**
 * Premium Wallet Scanner Component.
 * Features:
 * - Scanning beam animation
 * - Success state transition
 * - Tech/Cyber aesthetic
 */
export function WalletScanner() {
    const [status, setStatus] = useState<'scanning' | 'verified'>('scanning')

    useEffect(() => {
        const interval = setInterval(() => {
            setStatus(prev => prev === 'scanning' ? 'verified' : 'scanning')
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="w-full max-w-[300px] aspect-square rounded-[24px] bg-black border border-white/10 relative overflow-hidden flex flex-col items-center justify-center p-6 group">

            {/* Background Grid - Increased visibility slightly */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Center Icon */}
            <div className="relative z-10 w-24 h-24 flex items-center justify-center mb-6">
                <motion.div
                    className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl"
                    animate={{ opacity: status === 'scanning' ? [0.3, 0.6, 0.3] : 0 }}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                <div className="w-20 h-20 bg-neutral-900 rounded-2xl border border-white/10 flex items-center justify-center z-20 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    {status === 'scanning' ? (
                        <Wallet className="w-8 h-8 text-white/70" />
                    ) : (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 20 }}
                        >
                            <ShieldCheck className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Status Text - Monospace */}
            <div className="text-center z-10 space-y-2">
                <motion.h4
                    className="text-white text-xs font-mono font-medium tracking-[0.2em] uppercase"
                    animate={{ opacity: status === 'scanning' ? [0.5, 1, 0.5] : 1 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    {status === 'scanning' ? 'VERIFYING...' : 'VERIFIED'}
                </motion.h4>
                <div className="h-px w-8 bg-white/20 mx-auto" />
                <p className="text-[10px] text-neutral-400 font-mono tracking-widest">0x8ab...1a2b</p>
            </div>

            {/* Scanning Beam (Only when scanning) - Stronger visibility */}
            {status === 'scanning' && (
                <motion.div
                    className="absolute top-0 left-0 w-full h-[40%]"
                    style={{
                        background: 'linear-gradient(180deg, transparent 0%, rgba(16, 185, 129, 0.3) 100%)', // Emerald tint
                        borderBottom: '2px solid rgba(16, 185, 129, 0.8)' // Stronger edge
                    }}
                    animate={{ top: ['-40%', '140%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
            )}

            {/* Corner Brackets - More visible */}
            <div className="absolute top-5 left-5 w-3 h-3 border-t border-l border-white/40" />
            <div className="absolute top-5 right-5 w-3 h-3 border-t border-r border-white/40" />
            <div className="absolute bottom-5 left-5 w-3 h-3 border-b border-l border-white/40" />
            <div className="absolute bottom-5 right-5 w-3 h-3 border-b border-r border-white/40" />

            {/* Verified Flash - White Flash */}
            {status === 'verified' && (
                <motion.div
                    className="absolute inset-0 bg-white/5 z-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.3 }}
                />
            )}
        </div>
    )
}
