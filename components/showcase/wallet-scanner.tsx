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
        <div className="w-full max-w-[300px] aspect-square rounded-2xl bg-black border border-white/10 relative overflow-hidden flex flex-col items-center justify-center p-6 group">

            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,100,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,100,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Center Icon */}
            <div className="relative z-10 w-24 h-24 flex items-center justify-center mb-6">
                <motion.div
                    className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                    animate={{ opacity: status === 'scanning' ? [0.5, 0.8, 0.5] : 0.2 }}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                <div className="w-20 h-20 bg-background rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl z-20">
                    {status === 'scanning' ? (
                        <Wallet className="w-8 h-8 text-muted-foreground" />
                    ) : (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring' }}
                        >
                            <ShieldCheck className="w-10 h-10 text-emerald-500" />
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Status Text */}
            <div className="text-center z-10 space-y-1">
                <motion.h4
                    className="text-white font-mono font-bold tracking-wider"
                    animate={{ opacity: status === 'scanning' ? 1 : 1 }}
                >
                    {status === 'scanning' ? 'VERIFYING OWNERSHIP' : 'WALLET VERIFIED'}
                </motion.h4>
                <p className="text-xs text-white/50 font-mono">0x8ab...1a2b</p>
            </div>

            {/* Scanning Beam (Only when scanning) */}
            {status === 'scanning' && (
                <motion.div
                    className="absolute top-0 left-0 w-full h-[50%]"
                    style={{
                        background: 'linear-gradient(180deg, transparent 0%, rgba(16, 185, 129, 0.2) 100%)',
                        borderBottom: '2px solid rgba(16, 185, 129, 0.8)'
                    }}
                    animate={{ top: ['-50%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
            )}

            {/* Corner Brackets */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-500/30" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-500/30" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-500/30" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-500/30" />

            {/* Verified Flash */}
            {status === 'verified' && (
                <motion.div
                    className="absolute inset-0 bg-emerald-500/10 z-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.5 }}
                />
            )}
        </div>
    )
}
