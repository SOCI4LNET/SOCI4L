'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface RoadmapItemFeature {
    text: string
    info?: string
}

interface RoadmapItem {
    phase: string
    title: string
    description: string
    status: 'done' | 'active' | 'future'
    items: (string | RoadmapItemFeature)[]
}

const ROADMAP_ITEMS: RoadmapItem[] = [
    {
        phase: 'DONE',
        title: 'Foundation & Data',
        description: 'Core identity layer, analytics and admin infrastructure shipped.',
        status: 'done',
        items: [
            { text: 'Gasless Profile Engine & Identity Resolution', info: 'Instant, cost-free profile creation and updates using meta-transactions on Avalanche.' },
            { text: 'Donate v1 via Web Extension', info: 'Send tips and donations directly to social profiles through our specialized Chrome/Brave extension.' },
            'Personalized Link Hub & Asset Showcase',
            'Admin Panel & User Management',
            'Server-side Analytics (verified views)',
            { text: 'OpenSea NFT Integration', info: 'Display your NFT collections from OpenSea directly on your profile with verified ownership links.' }
        ]
    },
    {
        phase: 'NOW',
        title: 'Growth & Economy',
        description: 'On-chain signed interactions that generate transactions and grow the ecosystem.',
        status: 'active',
        items: [
            { text: 'Post Feed & On-chain Signed Posts', info: 'Share updates using EIP-712 signatures, ensuring your thoughts are cryptographically tied to your wallet identity.' },
            'Comment System',
            { text: 'Bounty & Job Board', info: 'Find or post tasks for the community with automated smart-contract based reward distribution.' },
            'On-chain Reference System',
            'Pinned Announcements',
            { text: 'On-chain Poll & Voting', info: 'Participate in transparent, tamper-proof community polls where outcomes are recorded and verified on the blockchain.' },
            { text: 'Gated Content', info: 'Lock specific content or files behind NFT ownership or minimum token balance requirements.' },
            'Profile Customization & Premium Themes',
            { text: 'Universal AI Agent Identities', info: 'An open identity layer where AI agents from any project or ecosystem can have a verified SOCI4L profile, own assets, and interact with the social economy autonomously.' }
        ]
    },
    {
        phase: 'LATER',
        title: 'Protocol Layer',
        description: 'Moving social graph and reputation on-chain.',
        status: 'future',
        items: [
            { text: 'On-chain Social Graph (Portability)', info: 'Fully portable decentralized social network where you own your connections and data across the ecosystem.' },
            { text: 'Portable Reputation (Attestations)', info: 'Credential-based reputation system that travels with your wallet and profile.' },
            { text: 'Team & DAO Profile Pages', info: 'Official organizational profiles for DAOs, developer teams, and university student clubs/societies.' },
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
                                item.status === 'done' ? "bg-emerald-500/40" : "bg-foreground/20"
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
                                    ROADMAP_ITEMS[index - 1].status === 'done' ? "bg-emerald-500/40" : "bg-foreground/20"
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
                                        {item.items.map((feature, i) => {
                                            const isObject = typeof feature === 'object';
                                            const text = isObject ? feature.text : feature;
                                            const info = isObject ? feature.info : null;

                                            return (
                                                <li key={i} className="flex items-center gap-3 text-xs md:text-sm text-muted-foreground/60 transition-all duration-300 hover:text-foreground hover:translate-x-1 cursor-default group/item">
                                                    <div className={cn(
                                                        "w-1 h-1 rounded-full transition-all duration-300 group-hover/item:scale-150",
                                                        item.status === 'active' ? "bg-primary/50 group-hover/item:bg-primary" : "bg-muted group-hover/item:bg-muted-foreground"
                                                    )} />
                                                    <div className="flex items-center gap-2">
                                                        <span>{text}</span>
                                                        {info && (
                                                            <TooltipProvider delayDuration={100}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <button className="text-muted-foreground/40 hover:text-primary transition-colors focus:outline-none">
                                                                            <Info className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent
                                                                        side="right"
                                                                        className="max-w-[200px] bg-background border border-foreground/10 p-3 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                                                                    >
                                                                        <p className="text-[11px] leading-relaxed text-foreground/80">
                                                                            {info}
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                </li>
                                            )
                                        })}
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
