'use client'

import { Soci4LLogo } from '@/components/logos/soci4l-logo'
import { Button } from '@/components/ui/button'
import { ArrowRight, Download } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function BrandPage() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <div className="min-h-screen bg-background pt-24 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-3xl mb-24"
                >
                    <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">
                        Brand Guidelines
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        These assets allow you to consistently represent the SOCI4L brand.
                        Please do not modify the logos or colors in any way.
                    </p>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-32"
                >

                    {/* LOGOS SECTION */}
                    <section>
                        <div className="flex items-end justify-between mb-12 border-b border-border/40 pb-6">
                            <h2 className="text-2xl font-mono uppercase tracking-widest text-muted-foreground">01. Logomark</h2>
                            <Button variant="outline" size="sm" asChild>
                                <a href="/logos/icon.png" download="SOCI4L_Icon.png" className="gap-2">
                                    <Download className="w-4 h-4" /> Download Assets
                                </a>
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Dark Mode Preview */}
                            <motion.div variants={item} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0B] p-12 md:p-24 flex items-center justify-center min-h-[400px]">
                                <div className="absolute top-6 left-6 text-xs font-mono text-zinc-500 uppercase tracking-wider">Dark Background</div>
                                <div className="relative z-10 scale-150 transition-transform duration-500 group-hover:scale-125">
                                    {/* Explicitly using icon variant, logo is white by default in dark mode content */}
                                    <Soci4LLogo variant="icon" width={120} height={120} className="invert-0" />
                                </div>
                            </motion.div>

                            {/* Light Mode Preview */}
                            <motion.div variants={item} className="group relative overflow-hidden rounded-3xl border border-black/5 bg-[#F9F9F9] p-12 md:p-24 flex items-center justify-center min-h-[400px]">
                                <div className="absolute top-6 left-6 text-xs font-mono text-zinc-400 uppercase tracking-wider">Light Background</div>
                                <div className="relative z-10 scale-150 transition-transform duration-500 group-hover:scale-125">
                                    {/* Invert for light background to match brand usage */}
                                    <Soci4LLogo variant="icon" width={120} height={120} className="invert" />
                                </div>
                            </motion.div>
                        </div>
                    </section>

                    {/* COMBINATION LOGO SECTION */}
                    <section>
                        <div className="flex items-end justify-between mb-12 border-b border-border/40 pb-6">
                            <h2 className="text-2xl font-mono uppercase tracking-widest text-muted-foreground">02. Combination</h2>
                            <Button variant="outline" size="sm" asChild>
                                <a href="/logos/combination.png" download="SOCI4L_Logo_Full.png" className="gap-2">
                                    <Download className="w-4 h-4" /> Download Assets
                                </a>
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {/* Dark Mode Full */}
                            <motion.div variants={item} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0B] p-16 md:p-32 flex items-center justify-center">
                                <div className="absolute top-6 left-6 text-xs font-mono text-zinc-500 uppercase tracking-wider">Primary</div>
                                <Soci4LLogo variant="combination" width={400} height={120} className="w-full max-w-[400px] invert-0" />
                            </motion.div>

                            {/* Light Mode Full */}
                            <motion.div variants={item} className="group relative overflow-hidden rounded-3xl border border-black/5 bg-[#F9F9F9] p-16 md:p-32 flex items-center justify-center">
                                <div className="absolute top-6 left-6 text-xs font-mono text-zinc-400 uppercase tracking-wider">Secondary</div>
                                <Soci4LLogo variant="combination" width={400} height={120} className="w-full max-w-[400px] invert" />
                            </motion.div>
                        </div>
                    </section>

                    {/* COLORS SECTION */}
                    <section>
                        <div className="flex items-end justify-between mb-12 border-b border-border/40 pb-6">
                            <h2 className="text-2xl font-mono uppercase tracking-widest text-muted-foreground">03. Colors</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <ColorCard name="Primary" hex="#ffffff" bg="bg-white" text="text-black" border="border-white/20" />
                            <ColorCard name="Background" hex="#09090b" bg="bg-[#09090b]" text="text-white" border="border-white/10" />
                            <ColorCard name="Card" hex="#18181b" bg="bg-[#18181b]" text="text-white" border="border-white/10" />
                            <ColorCard name="Accent" hex="#27272a" bg="bg-[#27272a]" text="text-white" border="border-white/10" />
                        </div>
                    </section>

                    {/* TYPOGRAPHY SECTION */}
                    <section>
                        <div className="flex items-end justify-between mb-12 border-b border-border/40 pb-6">
                            <h2 className="text-2xl font-mono uppercase tracking-widest text-muted-foreground">04. Typography</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Headings */}
                            <div className="space-y-8">
                                <div className="pb-4 border-b border-border/20">
                                    <span className="text-sm font-mono text-muted-foreground">Font Family</span>
                                    <h3 className="text-3xl font-semibold mt-2">Outfit</h3>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <div className="text-6xl font-bold tracking-tight mb-2">Aa</div>
                                        <div className="text-sm text-muted-foreground font-mono">Bold / 700</div>
                                    </div>
                                    <div>
                                        <div className="text-6xl font-semibold tracking-tight mb-2">Aa</div>
                                        <div className="text-sm text-muted-foreground font-mono">Semibold / 600</div>
                                    </div>
                                    <div>
                                        <div className="text-6xl font-medium tracking-tight mb-2">Aa</div>
                                        <div className="text-sm text-muted-foreground font-mono">Medium / 500</div>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="space-y-8">
                                <div className="pb-4 border-b border-border/20">
                                    <span className="text-sm font-mono text-muted-foreground">Monospace</span>
                                    <h3 className="text-3xl font-mono mt-2">Geist Mono</h3>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-lg leading-relaxed text-muted-foreground">
                                        The quick brown fox jumps over the lazy dog.
                                        SOCI4L uses Geist Mono for technical details, data display, and badges.
                                        It provides a precise, engineered feel.
                                    </p>
                                    <p className="font-mono text-sm text-muted-foreground pt-4 block">
                                        0123456789 () [] {'{}'} ? ! @ # $ % &
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                </motion.div>
            </div>
        </div>
    )
}

function ColorCard({ name, hex, bg, text, border }: { name: string, hex: string, bg: string, text: string, border: string }) {
    return (
        <div className={`p-6 rounded-2xl border ${border} ${bg} aspect-square flex flex-col justify-between group transition-transform hover:-translate-y-1`}>
            <div className={`text-lg font-medium ${text}`}>{name}</div>
            <div className="space-y-1">
                <div className={`text-sm font-mono opacity-60 ${text}`}>{hex}</div>
                <div className={`text-xs opacity-40 ${text}`}>RGB: 255 255 255</div>
            </div>
        </div>
    )
}
