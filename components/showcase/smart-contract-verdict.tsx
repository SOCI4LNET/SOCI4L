'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { FileCode, ShieldCheck, CheckCircle2, Lock, Terminal, Shield } from 'lucide-react'

export function SmartContractVerdict() {
    const [step, setStep] = useState<'scanning' | 'analyzing' | 'verified'>('scanning')

    useEffect(() => {
        const cycle = async () => {
            while (true) {
                setStep('scanning')
                await new Promise(r => setTimeout(r, 2000))
                setStep('analyzing')
                await new Promise(r => setTimeout(r, 1500))
                setStep('verified')
                await new Promise(r => setTimeout(r, 4000))
            }
        }
        cycle()
    }, [])

    const codeSnippet = `// Network: Avalanche C-Chain
// Verification: SGX-Enclave

contract Identity {
  address public owner;
  
  function verify(bytes sig) public {
    require(msg.sender != address(0));
    _validateAvalancheSig(sig);
    emit Verified(msg.sender);
  }
}`

    return (
        <div className="w-full max-w-[400px] h-[300px] rounded-[32px] bg-black border border-white/10 relative overflow-hidden flex flex-col p-6 group">

            {/* Header */}
            <div className="flex items-center justify-between mb-4 z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                        {/* Red for AVAX branding nuance */}
                        <Terminal className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="text-xs font-mono text-neutral-300">AVAX_Identity.sol</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                </div>
            </div>

            {/* Code View Window */}
            <div className="relative flex-1 bg-neutral-900/30 rounded-xl border border-white/5 p-4 font-mono text-[10px] text-neutral-400 overflow-hidden">
                <pre className="relative z-10 font-medium">
                    {codeSnippet.split('\n').map((line, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0.3 }}
                            animate={{
                                opacity: step === 'scanning' ? [0.3, 1, 0.3] : 1,
                                color: step === 'verified' && line.includes('Verify') ? '#4ade80' : '#a3a3a3'
                            }}
                            transition={{ delay: i * 0.1, duration: 2 }}
                        >
                            <span className="mr-3 text-neutral-700 select-none text-[8px]">{i + 1}</span>
                            {line}
                        </motion.div>
                    ))}
                </pre>

                {/* Scanning Bar */}
                {step === 'scanning' && (
                    <motion.div
                        className="absolute top-0 left-0 right-0 h-1 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] z-20"
                        animate={{ top: ['0%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                )}
            </div>

            {/* Verdict Stamp - Redesigned to be "Pro" */}
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                {step === 'verified' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative flex flex-col items-center"
                    >
                        {/* Glowing Background Blur - Increased Opacity for Readability */}
                        <div className="absolute inset-0 bg-black/80 blur-xl rounded-full scale-150" />
                        <div className="absolute inset-0 bg-emerald-950/90 blur-xl rounded-full scale-125" />

                        {/* Hexagon Shield Container - Solid Background */}
                        <div className="relative z-10 p-8 flex flex-col items-center justify-center bg-black/90 rounded-2xl border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] backdrop-blur-xl">
                            {/* Animated Rings */}
                            <motion.div
                                className="absolute inset-0 border border-emerald-500/50 rounded-2xl"
                                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />

                            {/* Icon */}
                            <ShieldCheck className="w-12 h-12 text-emerald-400 mb-2 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" strokeWidth={2} />

                            {/* Main Text - High Contrast */}
                            <h3 className="text-2xl font-black text-white tracking-[0.25em] font-sans drop-shadow-[0_2px_10px_rgba(0,0,0,1)] flex items-center gap-2">
                                SECURE
                            </h3>

                            {/* Subtext */}
                            <div className="flex items-center gap-2 mt-2 bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-widest">
                                    Audit Passed
                                </span>
                            </div>

                            {/* Mock Hash */}
                            <div className="mt-4 px-3 py-1.5 bg-neutral-950 rounded border border-emerald-500/20 flex items-center gap-2">
                                <Terminal className="w-3 h-3 text-emerald-600" />
                                <span className="text-[9px] font-mono text-emerald-500/80">0x7f...3a9c</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Footer Status */}
            <div className="mt-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    {step === 'verified' ? (
                        <Lock className="w-3 h-3 text-emerald-500" />
                    ) : (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                            <CheckCircle2 className="w-3 h-3 text-neutral-600" />
                        </motion.div>
                    )}
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">
                        {step === 'scanning' ? 'Scanning C-Chain...' : step === 'analyzing' ? 'Verifying Logic...' : 'Contract Locked'}
                    </span>
                </div>
            </div>
        </div>
    )
}
