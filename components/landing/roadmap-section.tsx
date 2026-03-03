'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

const ROADMAP_ITEMS = [
    {
        phase: 'DONE',
        title: 'Foundation & Data',
        description: 'Core identity layer, analytics and admin infrastructure shipped.',
        status: 'done',
        items: [
            'Gasless Profile Engine',
            'Admin Panel & User Management',
            'Server-side Analytics (verified views)',
            'OpenSea NFT Integration'
        ]
    },
    {
        phase: 'NOW',
        title: 'Growth & Economy',
        description: 'Social features, on-chain interactions and community tools.',
        status: 'active',
        items: [
            'Post Feed & On-chain Signed Posts',
            'Comment System (TX-generating)',
            'Bounty & Job Board',
            'On-chain Reference System',
            'Announcement / Pinned Duyuru',
            'On-chain Poll & Voting',
            'Gated Content (Token-Gated Access)'
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
                    className="flex gap-16 md:gap-32 px-12 md:px-32 items-start pt-40"
                >
                    {/* Intro Spacer */}
                    <div className="w-[15vw] shrink-0" />

                    {ROADMAP_ITEMS.map((item, index) => (
                        <div key={item.phase} className="relative shrink-0 w-[70vw] md:w-[500px] group/section">
                            {/* Horizontal Line Segment */}
                            <div className={cn(
                                "absolute top-[11px] left-0 w-full h-[1px] -z-10 overflow-hidden",
                                item.status === 'done' ? "bg-emerald-500/40" : "bg-border"
                            )}>
                                {item.status === 'active' && (
                                    <motion.div
                                        initial={{ x: '-100%' }}
                                        whileInView={{ x: '0%' }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent w-full h-full"
                                    />
                                )}
                            </div>

                            {/* Connection to previous — green if previous was done */}
                            {index > 0 && (
                                <div className={cn(
                                    "absolute top-[11px] -left-32 w-32 h-[1px] -z-10",
                                    ROADMAP_ITEMS[index - 1].status === 'done' ? "bg-emerald-500/40" : "bg-border"
                                )} />
                            )}

                            <div className="relative z-10">
                                {/* Timeline Node */}
                                <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 mb-8 bg-background relative z-20 group-hover/section:scale-110",
                                    item.status === 'active'
                                        ? "border-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] ring-4 ring-primary/10"
                                        : item.status === 'done'
                                            ? "border-emerald-500/50 bg-emerald-500/5"
                                            : "border-border group-hover/section:border-primary/50"
                                )}>
                                    {item.status === 'active' ? (
                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                    ) : item.status === 'done' ? (
                                        <div className="w-2 h-2 bg-emerald-500/70 rounded-full" />
                                    ) : (
                                        <div className="w-1.5 h-1.5 bg-muted rounded-full transition-colors group-hover/section:bg-muted-foreground" />
                                    )}
                                </div>

                                <div className="space-y-4 pr-8">
                                    {/* Header */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={cn(
                                                "text-[10px] tracking-[0.2em] font-mono uppercase font-medium transition-colors",
                                                item.status === 'future' ? "text-muted-foreground group-hover/section:text-foreground" : "text-primary"
                                            )}>
                                                {item.phase}
                                            </span>
                                        </div>
                                        <h3 className={cn(
                                            "text-2xl font-semibold tracking-tight mb-2 transition-colors",
                                            item.status === 'active' ? "text-foreground" : item.status === 'done' ? "text-muted-foreground/60" : "text-muted-foreground group-hover/section:text-foreground"
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
                                                    item.status === 'active' ? "bg-primary/50 group-hover/item:bg-primary" : "bg-muted group-hover/item:bg-muted-foreground"
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
