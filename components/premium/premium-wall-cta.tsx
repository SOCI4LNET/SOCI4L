'use client'

import React, { useEffect, useState } from 'react'
import { ShieldCheck, ArrowRight, UserPlus, Star, ChevronRight, Check } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

// --- Helper to generate random address ---
const generateRandomAddress = () => {
    const chars = '0123456789abcdef'
    let addr = '0x'
    for (let i = 0; i < 4; i++) addr += chars[Math.floor(Math.random() * 16)]
    addr += '...'
    for (let i = 0; i < 3; i++) addr += chars[Math.floor(Math.random() * 16)]
    return addr
}

// Reuse mock avatars and data from ProfileWallSection for consistent style
const MOCK_AVATARS = [
    'https://effigy.im/a/0x8ab0cf264df99d83525e9e11c7e4db01558ae1b1.svg',
    'https://effigy.im/a/0xd8da6bf26964af9d7eed9e03e53415d37aa96045.svg',
    'https://effigy.im/a/0x1f9090aaE28b8a3dCeaDf281B0F1282B40256C8a.svg',
    'https://effigy.im/a/0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE.svg',
    'https://effigy.im/a/0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97.svg',
    'https://effigy.im/a/0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5.svg',
    'https://effigy.im/a/0x52906dbe9de9Bd70295175608d070b40Fa86A461.svg',
    'https://effigy.im/a/0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D.svg',
]

const DESCRIPTIONS = [
    "Exploring the Avalanche ecosystem, one subnet at a time.",
    "Digital art collector and web3 enthusiast.",
    "Building decentralized applications. 🔺",
    "Governance participant and voter.",
    "Just here for the vibes and the technology.",
    "Web3 developer exploring cross-chain solutions.",
    "Showcasing my on-chain identity.",
    "Validating the network since genesis.",
    "Privacy advocate and node operator.",
    "Gaming on subnets and collecting loot.",
    "Decentralization maximalist.",
    "Writing smart contracts and breaking things.",
    "Pixel art connoisseur.",
    "Early adopter of new protocols.",
    "Snapshot voter and DAO member.",
    "Yield farmer exploring new opportunities.",
    "Learning about blockchain technology.",
    "On-chain explorer.",
    "Designing user experiences for web3."
]

const HEADER_COLORS = [
    'bg-pink-500/20 border-pink-500/30',
    'bg-blue-500/20 border-blue-500/30',
    'bg-emerald-500/20 border-emerald-500/30',
    'bg-violet-500/20 border-violet-500/30',
    'bg-orange-500/20 border-orange-500/30',
    'bg-indigo-500/20 border-indigo-500/30',
    'bg-rose-500/20 border-rose-500/30',
    'bg-cyan-500/20 border-cyan-500/30',
]

const ROLES = ['OG', 'Whale', 'Builder', 'Artist', 'Collector', 'Voter', 'Degen']
const SCORE_TIERS = ['Starter', 'Newcomer', 'Rising', 'Established', 'Elite', 'Legendary']

interface ProfileData {
    id: string
    address: string
    avatar: string
    headerColor: string
    description: string
    followers: string
    collectibles: string
    hasButtons: boolean
    isOnline: boolean
    role: string
    scoreTier: string
    isPrivate: boolean
    isVerified: boolean
    isPremium?: boolean // Added for premium context
}

// --- Modified ProfileCard (Simpler, maybe highlight "Premium" visually?) ---
function PremiumProfileCard({ data, index }: { data: ProfileData; index: number }) {
    const [isStarred, setIsStarred] = useState(false)

    return (
        <TooltipProvider delayDuration={100}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={cn(
                    "group relative w-full rounded-2xl bg-card border shadow-sm flex flex-col hover:shadow-2xl hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 overflow-visible",
                    data.isPremium ? "border-primary/40 ring-1 ring-primary/20" : "border-border/50"
                )}
            >
                {/* Cover / Header Area */}
                <div className={cn("h-24 w-full relative rounded-t-2xl overflow-hidden border-b", data.headerColor)}>
                    {/* Noise texture overlay */}
                    <div className="absolute inset-0 opacity-[0.10] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                    {/* Premium Glint for Premium Profiles */}
                    {data.isPremium && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent animate-shimmer" />
                    )}
                </div>

                {/* Content Body */}
                <div className={cn("flex-1 px-6 pt-2 relative flex flex-col rounded-b-2xl pb-6")}>
                    {/* Avatar - Overlapping Header */}
                    <div className="absolute -top-8 left-6 z-10">
                        <Avatar className={cn(
                            "h-16 w-16 border-4 border-card shadow-sm group-hover:scale-105 transition-transform duration-300",
                            data.isPremium && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                        )}>
                            <AvatarImage src={data.avatar} />
                            <AvatarFallback>0x</AvatarFallback>
                        </Avatar>
                        {/* Status Dot */}
                        <div className={cn(
                            "absolute bottom-1 right-1 w-3.5 h-3.5 border-2 border-card rounded-full",
                            data.isOnline ? "bg-emerald-500" : "bg-rose-500"
                        )} />
                    </div>

                    {/* Top Right Actions */}
                    <div className="flex justify-end mb-2 gap-2 items-center">
                        {/* Premium Badge if applicable */}
                        {data.isPremium && (
                            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary px-2 py-0.5 text-[10px] h-6 uppercase tracking-wider font-bold">
                                Premium
                            </Badge>
                        )}
                        {!data.isPremium && !data.isPrivate && (
                            <Badge variant="secondary" className="bg-primary/5 text-primary/80 border border-primary/10 px-2 py-0.5 text-[10px] h-6 uppercase tracking-wider font-medium">
                                {data.scoreTier}
                            </Badge>
                        )}

                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setIsStarred(!isStarred)}
                            className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground backdrop-blur-sm transition-colors"
                        >
                            <Star className={cn("w-3.5 h-3.5 transition-all", isStarred && "fill-yellow-400 text-yellow-400")} />
                        </Button>
                    </div>

                    {/* Identity Info */}
                    <div className="mt-4 space-y-4 flex-1 flex flex-col">
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-mono text-base font-semibold text-foreground group-hover:text-primary transition-colors">{data.address}</h4>
                                {data.isVerified && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <ShieldCheck className="w-4 h-4 text-emerald-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent><p>Verified Address</p></TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[40px]">
                                {data.description}
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 py-2 border-y border-border/40 transition-all duration-300">
                            <div className="text-center">
                                <span className="block text-lg font-bold text-foreground">{data.followers}</span>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Followers</span>
                            </div>
                            <div className="text-center border-l border-border/40">
                                <span className="block text-lg font-bold text-foreground">{data.collectibles}</span>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Collectibles</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto pt-3 grid grid-cols-2 gap-3">
                            <Button size="sm" variant="outline" className="w-full text-xs h-9 bg-transparent border-border/60 hover:bg-muted">
                                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                                Follow
                            </Button>
                            <Button size="sm" className="w-full text-xs h-9 bg-primary/10 text-primary hover:bg-primary/20 border-0">
                                View
                                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </TooltipProvider>
    )
}

interface PremiumWallCtaProps {
    onUpgrade: () => void;
    isPremium?: boolean;
}

export function PremiumWallCta({ onUpgrade, isPremium }: PremiumWallCtaProps) {
    const [columns, setColumns] = useState<ProfileData[][]>([[], [], [], []])

    useEffect(() => {
        const shuffledDescriptions = [...DESCRIPTIONS].sort(() => 0.5 - Math.random());
        // Generate enough items to fill background
        const items: ProfileData[] = Array.from({ length: 12 }).map((_, i) => ({
            id: `p-cta-${i}`,
            address: generateRandomAddress(),
            avatar: MOCK_AVATARS[i % MOCK_AVATARS.length],
            headerColor: HEADER_COLORS[i % HEADER_COLORS.length],
            description: shuffledDescriptions[i % shuffledDescriptions.length],
            followers: (Math.floor(Math.random() * 900) + 100).toLocaleString(),
            collectibles: (Math.floor(Math.random() * 50) + 10).toString(),
            hasButtons: true,
            isPrivate: false,
            isOnline: Math.random() > 0.4,
            role: ROLES[Math.floor(Math.random() * ROLES.length)],
            scoreTier: SCORE_TIERS[Math.floor(Math.random() * SCORE_TIERS.length)],
            isVerified: Math.random() > 0.6,
            isPremium: Math.random() > 0.5 // Many premium users in this view to encourage upgrade
        }))

        const cols: ProfileData[][] = [[], [], [], []]
        items.forEach((item, i) => {
            cols[i % 4].push(item)
        })
        setColumns(cols)
    }, [])

    if (columns[0].length === 0) return null

    return (
        <section className="relative w-full py-24 bg-background overflow-hidden">
            {/* Column-Based Masonry Grid - Vivid and clear */}
            <div className={cn(
                "container mx-auto px-4 relative z-0 origin-bottom transition-all duration-1000",
                isPremium ? "opacity-100" : "opacity-70 pointer-events-none select-none"
            )}>
                {/* Top fade gradient */}
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-background to-transparent z-10" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {columns.map((col, colIndex) => (
                        <div key={colIndex} className="flex flex-col gap-6">
                            {col.map((item, i) => (
                                <PremiumProfileCard key={item.id} data={item} index={i} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Gradient Overlay + CTA Content */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent/10 z-10 transition-opacity duration-1000",
                isPremium ? "opacity-40" : "opacity-100"
            )} />

            <div className="absolute bottom-0 inset-x-0 pb-24 z-20 flex justify-center items-end h-full pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center space-y-8 max-w-3xl px-6 pointer-events-auto"
                >
                    {!isPremium ? (
                        <>
                            <div className="space-y-4">
                                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground drop-shadow-sm">
                                    Ready to upgrade?
                                </h2>
                                <p className="text-xl text-muted-foreground leading-relaxed">
                                    Join hundreds of premium creators who own their data and understand their audience.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button
                                    onClick={onUpgrade}
                                    size="lg"
                                    className="h-14 px-8 rounded-full text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
                                >
                                    Get Premium Now
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => window.open('https://docs.soci4l.id', '_blank')}
                                    className="h-14 px-8 rounded-full text-lg font-medium border-border/50 hover:bg-muted/50 transition-all hover:border-foreground/20 w-full sm:w-auto bg-background/50 backdrop-blur-sm"
                                >
                                    Read Documentation
                                </Button>
                            </div>

                            <div className="pt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Cancel anytime</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>30-day guarantee</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-background/40 backdrop-blur-md px-8 py-4 rounded-full border border-primary/20 shadow-xl shadow-primary/5 flex items-center gap-3 animate-in fade-in zoom-in duration-700">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-foreground leading-tight">SOCI4L Premium Active</p>
                                <p className="text-xs text-muted-foreground">Thank you for being part of the ecosystem.</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </section>
    )
}
