'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

import { Code2, PenTool, Users, ArrowRight } from 'lucide-react'
import Image from 'next/image'

export function UseCaseSection() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    const cases = [
        {
            title: 'Builders',
            icon: Code2,
            description: 'Integrate Web3 identity with a few lines of code.',
            keywords: ['SDKs', 'API', 'Docs'],
            color: 'text-emerald-500',
            bgGlow: 'bg-emerald-500/10',
            cta: 'Read the docs',
            colSpan: 'md:col-span-2',
            // Mock Visual: Code Snippet - Adjusted for Light/Dark
            visual: (
                <div className="absolute right-6 top-1/2 -translate-y-[40%] translate-x-12 w-[280px] bg-card backdrop-blur-md rounded-lg border border-border p-3 shadow-2xl dark:shadow-none opacity-60 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 rotate-1 group-hover:rotate-0 hidden md:block z-20">
                    <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500/20" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                            <div className="w-2 h-2 rounded-full bg-green-500/20" />
                        </div>
                        <span className="text-[9px] text-muted-foreground font-mono">profile.ts</span>
                    </div>
                    {/* Syntax highlighting adapted for legibility on both, or we prefer dark code block on light? Keeping it "code-like" mostly dark or high contrast. Let's try a clean light theme code block. */}
                    <div className="space-y-1.5 font-mono text-[9px] leading-relaxed text-muted-foreground">
                        <div className="flex"><span className="w-4 text-muted-foreground opacity-50">1</span><span><span className="text-purple-600 dark:text-purple-400">import</span> <span className="text-blue-600 dark:text-blue-300">{`{ resolve }`}</span> <span className="text-purple-600 dark:text-purple-400">from</span> <span className="text-green-600 dark:text-green-300">'@soci4l/sdk'</span></span></div>
                        <div className="flex"><span className="w-4 text-muted-foreground opacity-50">2</span><span></span></div>
                        <div className="flex"><span className="w-4 text-muted-foreground opacity-50">3</span><span><span className="text-purple-600 dark:text-purple-400">const</span> user <span className="text-pink-600 dark:text-pink-400">=</span> <span className="text-blue-600 dark:text-blue-400">await</span> resolve(<span className="text-orange-600 dark:text-orange-300">address</span>)</span></div>
                        <div className="flex"><span className="w-4 text-muted-foreground opacity-50">4</span><span><span className="text-blue-600 dark:text-blue-300">console</span>.<span className="text-yellow-600 dark:text-yellow-300">log</span>(user.ens)</span></div>
                    </div>
                </div>
            )
        },
        {
            title: 'Creators',
            icon: PenTool,
            description: 'One link for all your NFTs and social content.',
            keywords: ['Bio', 'Gallery'],
            color: 'text-pink-500',
            bgGlow: 'bg-pink-500/10',
            cta: 'Claim profile',
            colSpan: 'md:col-span-1',
            // Mock Visual: Filled Media Cards (Detailed NFT-style cards)
            visual: (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full overflow-hidden pointer-events-none">
                    {/* Decorative blur */}
                    <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-pink-500/10 rounded-full blur-3xl opacity-50" />

                    {/* Back Card */}
                    <div className="absolute -bottom-10 -right-4 opacity-40 group-hover:opacity-60 transition-all duration-500 group-hover:-translate-y-2 group-hover:-translate-x-1 z-0">
                        <div className="w-36 h-48 bg-card border border-border rounded-2xl rotate-[5deg] overflow-hidden relative shadow-xl dark:shadow-none">
                            <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/10 via-indigo-500/10 to-purple-500/10" />
                        </div>
                    </div>

                    {/* Front Card */}
                    <div className="absolute -bottom-8 -right-8 opacity-90 group-hover:opacity-100 transition-all duration-500 group-hover:-translate-y-4 group-hover:-translate-x-4 z-10">
                        <div className="w-40 h-52 bg-card/90 backdrop-blur-md border border-border rounded-2xl rotate-[-6deg] overflow-hidden shadow-2xl dark:shadow-none relative flex flex-col">
                            {/* Image Placeholder */}
                            <div className="h-32 w-full bg-gradient-to-tr from-pink-500/20 via-rose-500/10 to-transparent relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mixed-blend-overlay" />
                                <div className="absolute bottom-2 right-2 p-1 bg-background/40 rounded-md backdrop-blur-md border border-border/20">
                                    <div className="w-3 h-3 rounded-full bg-pink-500/50" />
                                </div>
                            </div>

                            {/* Card Meta */}
                            <div className="flex-1 p-3 flex flex-col justify-center gap-2">
                                <div className="h-2 w-2/3 bg-muted rounded-full" />
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-linear-to-r from-pink-500 to-purple-500 opacity-80" />
                                    <div className="h-1.5 w-1/3 bg-muted rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'DAOs, Teams & Clubs',
            icon: Users,
            description: 'Create team profiles, manage university clubs and aggregate member activity.',
            keywords: ['Governance', 'Squads', 'University'],
            color: 'text-sky-500',
            bgGlow: 'bg-sky-500/10',
            cta: 'Create squad',
            colSpan: 'md:col-span-3',
            // Mock Visual: Real Avatars with hover expansion
            visual: (
                <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-6 opacity-60 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                    <div className="flex items-center gap-3 bg-card/80 border border-border rounded-full px-4 py-2 backdrop-blur-md shadow-xl dark:shadow-none hover:scale-105 transition-transform duration-300">
                        <div className="flex -space-x-3">
                            <Image src="https://effigy.im/a/0x8ab0cf264df99d83525e9e11c7e4db01558ae1b1.svg" width={32} height={32} className="w-8 h-8 rounded-full border-2 border-background bg-muted" alt="Member" unoptimized />
                            <Image src="https://effigy.im/a/0xd8da6bf26964af9d7eed9e03e53415d37aa96045.svg" width={32} height={32} className="w-8 h-8 rounded-full border-2 border-background bg-muted" alt="Member" unoptimized />
                            <Image src="https://effigy.im/a/0x1f9090aaE28b8a3dCeaDf281B0F1282B40256C8a.svg" width={32} height={32} className="w-8 h-8 rounded-full border-2 border-background bg-muted" alt="Member" unoptimized />
                            <Image src="https://effigy.im/a/0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE.svg" width={32} height={32} className="w-8 h-8 rounded-full border-2 border-background bg-muted" alt="Member" unoptimized />
                        </div>
                        <div className="h-4 w-px bg-border" />
                        <span className="text-xs text-muted-foreground font-medium">+84 members</span>
                    </div>
                </div>
            )
        },
    ]

    return (
        <section className="container mx-auto px-4 py-24 relative">

            <div className="text-center space-y-3 mb-12 relative z-10">
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-3xl font-semibold tracking-tight sm:text-4xl text-foreground"
                >
                    Who is SOCI4L for?
                </motion.h2>

                <p className="text-muted-foreground max-w-2xl mx-auto pt-2">
                    Whether you&apos;re building the future, creating art, or governing the network, SOCI4L gives you the identity layer you need.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {cases.map((item, index) => {
                    const isHovered = hoveredIndex === index

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className={cn(
                                "relative group rounded-2xl overflow-hidden min-h-[220px] flex flex-col bg-card/40 hover:bg-card/60 border border-border/40 transition-all duration-500",
                                isHovered ? "shadow-lg dark:shadow-none border-border/60" : "shadow-sm dark:shadow-none",
                                item.colSpan
                            )}
                        >
                            {/* Subtle Glow */}
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-br from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none",
                                item.bgGlow.replace('bg-', 'from-')
                            )} />

                            {/* Noise */}
                            <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                            <div className="relative p-6 flex flex-col h-full z-10 w-full pointer-events-none">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={cn(
                                        "p-2 rounded-lg bg-background/50 border border-border/50 text-foreground/80 transition-colors duration-300",
                                        isHovered ? item.color : ""
                                    )}>
                                        <item.icon className="w-5 h-5" />
                                    </div>

                                    <div className={cn(
                                        "flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider transition-all duration-300 opacity-60 group-hover:translate-x-0 group-hover:opacity-100",
                                        isHovered ? "-translate-x-0 " + item.color : "translate-x-2 text-muted-foreground"
                                    )}>
                                        {item.cta}
                                        <ArrowRight className="w-3 h-3" />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-foreground mb-1.5">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[90%] font-medium">
                                        {item.description}
                                    </p>
                                </div>

                                <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
                                    {item.keywords.map((keyword, k) => (
                                        <div
                                            key={k}
                                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted/50 text-muted-foreground border border-border/30"
                                        >
                                            {keyword}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Background Visual Element */}
                            {item.visual}

                        </motion.div>
                    )
                })}
            </div>
        </section>
    )
}
