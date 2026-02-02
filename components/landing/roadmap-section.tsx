'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const ROADMAP_ITEMS = [
    {
        phase: 'NOW',
        title: 'Foundation & Data',
        description: 'Building the core operations and data integrity layer.',
        status: 'active',
        items: [
            'Gasless Profile Engine',
            'Admin Panel & User Management',
            'Server-side Analytics (verified views)',
            'OpenSea NFT Integration'
        ]
    },
    {
        phase: 'NEXT',
        title: 'Growth & Economy',
        description: 'Monetization tools for creators and gamification.',
        status: 'upcoming',
        items: [
            'Token-Gated Access (Web3 Patreon)',
            'Creator Tipping & Subscriptions',
            'SOCI4L Score v2',
            'Luma Events Integration'
        ]
    },
    {
        phase: 'LATER',
        title: 'Protocol Layer',
        description: 'Moving social graph and reputation on-chain.',
        status: 'future',
        items: [
            'On-chain Social Graph (Portability)',
            'Portable Reputation (Attestations)',
            'Multi-chain Support',
            'Developer API'
        ]
    }
]

export function RoadmapSection() {
    const targetRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: targetRef,
    })

    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-55%"])

    return (
        <section ref={targetRef} className="relative h-[250vh] bg-background">
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">
                <div className="absolute top-12 left-4 md:left-12 z-10 max-w-sm pointer-events-none">
                    <h2 className="text-sm font-mono uppercase tracking-widest text-primary mb-4">
                        Roadmap
                    </h2>
                    <h3 className="text-3xl font-semibold tracking-tight md:text-4xl text-foreground mb-4">
                        The Future
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Building a living identity standard. Not just a feature, but a protocol.
                    </p>
                </div>

                <motion.div
                    style={{ x }}
                    className="flex gap-16 md:gap-32 px-12 md:px-32 items-center"
                >
                    {/* Intro Spacer */}
                    <div className="w-[15vw] shrink-0" />

                    {ROADMAP_ITEMS.map((item, index) => (
                        <div key={item.phase} className="relative shrink-0 w-[70vw] md:w-[500px] group/section">
                            {/* Horizontal Line Segment */}
                            <div className="absolute top-[11px] left-0 w-full h-[1px] bg-white/5 -z-10 overflow-hidden">
                                {item.status === 'active' && (
                                    <motion.div
                                        initial={{ x: '-100%' }}
                                        whileInView={{ x: '0%' }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent w-full h-full"
                                    />
                                )}
                            </div>

                            {/* Connection to previous */}
                            {index > 0 && <div className="absolute top-[11px] -left-32 w-32 h-[1px] bg-white/5 -z-10" />}

                            <div className="relative z-10">
                                {/* Timeline Node */}
                                <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 mb-8 bg-background relative z-20 group-hover/section:scale-110",
                                    item.status === 'active'
                                        ? "border-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] ring-4 ring-primary/10"
                                        : "border-zinc-800 group-hover/section:border-zinc-700"
                                )}>
                                    {item.status === 'active' ? (
                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                    ) : (
                                        <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full transition-colors group-hover/section:bg-zinc-600" />
                                    )}
                                </div>

                                <div className="space-y-4 pr-8">
                                    {/* Header */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={cn(
                                                "text-[10px] tracking-[0.2em] font-mono uppercase font-medium transition-colors",
                                                item.status === 'future' ? "text-muted-foreground group-hover/section:text-zinc-500" : "text-primary"
                                            )}>
                                                {item.phase}
                                            </span>
                                        </div>
                                        <h3 className={cn(
                                            "text-2xl font-semibold tracking-tight mb-2 transition-colors",
                                            item.status === 'active' ? "text-foreground" : "text-muted-foreground group-hover/section:text-zinc-300"
                                        )}>
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed opacity-80 group-hover/section:opacity-100 transition-opacity">
                                            {item.description}
                                        </p>
                                    </div>

                                    {/* Items List */}
                                    <ul className="grid grid-cols-1 gap-y-2.5 pt-4 border-t border-border/10">
                                        {item.items.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-3 text-xs md:text-sm text-muted-foreground/60 transition-all duration-300 hover:text-foreground hover:translate-x-1 cursor-default group/item">
                                                <div className={cn(
                                                    "w-1 h-1 rounded-full transition-all duration-300 group-hover/item:scale-150",
                                                    item.status === 'active' ? "bg-primary/50 group-hover/item:bg-primary" : "bg-zinc-800 group-hover/item:bg-zinc-600"
                                                )} />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* End Spacer */}
                    <div className="w-[10vw] shrink-0" />
                </motion.div>
            </div>
        </section>
    )
}
