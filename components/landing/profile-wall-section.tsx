'use client'

import React, { useEffect, useState } from 'react'
import { ShieldCheck, ArrowUpRight, Wallet, Globe, Twitter, ArrowRight, UserPlus, Star, Sparkles, Lock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

// --- Helper to generate random addresses ---
const generateRandomAddress = () => {
    const chars = '0123456789abcdef'
    let addr = '0x'
    for (let i = 0; i < 4; i++) addr += chars[Math.floor(Math.random() * 16)]
    addr += '...'
    for (let i = 0; i < 3; i++) addr += chars[Math.floor(Math.random() * 16)]
    return addr
}

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

// Enhanced gradients/colors for the "premium" solid header look
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
}

function ProfileCard({ data, index }: { data: ProfileData; index: number }) {
    const [isStarred, setIsStarred] = useState(false)

    return (
        <TooltipProvider delayDuration={100}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group relative w-full rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col hover:shadow-2xl hover:border-border/80 hover:-translate-y-1 transition-all duration-300 overflow-visible"
            >
                {/* Cover / Header Area */}
                <div className={cn("h-24 w-full relative rounded-t-2xl overflow-hidden border-b", data.headerColor)}>
                    {/* Noise texture overlay */}
                    <div className="absolute inset-0 opacity-[0.10] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                    {/* Micro-interaction: Shine effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                </div>

                {/* Content Body */}
                <div className={cn("flex-1 px-6 pt-2 relative flex flex-col rounded-b-2xl", data.hasButtons ? "pb-6" : "pb-8")}>
                    {/* Avatar - Overlapping Header */}
                    <div className="absolute -top-8 left-6 z-10">
                        <Avatar className="h-16 w-16 border-4 border-card shadow-sm group-hover:scale-105 transition-transform duration-300">
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
                        {/* Badges */}
                        {!data.isPrivate && (
                            <div className="flex gap-1.5">
                                {/* Role Badge */}
                                <Badge variant="outline" className="bg-background/50 backdrop-blur-sm px-2 py-0.5 text-[10px] h-6 border-primary/20 text-primary uppercase tracking-wider font-medium">
                                    {data.role}
                                </Badge>
                                {/* Score Badge */}
                                <Badge variant="secondary" className="bg-primary/5 text-primary/80 border border-primary/10 px-2 py-0.5 text-[10px] h-6 uppercase tracking-wider font-medium">
                                    {data.scoreTier}
                                </Badge>
                            </div>
                        )}
                        {data.isPrivate && (
                            <Badge variant="secondary" className="bg-muted px-2 py-0.5 text-[10px] h-6 flex gap-1 items-center uppercase tracking-wider font-medium">
                                <Lock className="w-3 h-3" />
                                Private
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
                                            <div className="cursor-help">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Verified Address</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[40px]">
                                {data.description}
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="relative">
                            <div className={cn(
                                "grid grid-cols-2 gap-3 py-2 border-y border-border/40 transition-all duration-300",
                                data.isPrivate ? "filter blur-[4px] opacity-40 select-none" : ""
                            )}>
                                <div className="text-center">
                                    <span className="block text-lg font-bold text-foreground">{data.isPrivate ? '259' : data.followers}</span>
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Followers</span>
                                </div>
                                <div className="text-center border-l border-border/40">
                                    <span className="block text-lg font-bold text-foreground">{data.isPrivate ? '9' : data.collectibles}</span>
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Collectibles</span>
                                </div>
                            </div>

                            {/* Private Overlay */}
                            {data.isPrivate && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <span className="text-xs font-semibold text-foreground bg-background/80 px-3 py-1 rounded-full border border-border/50 backdrop-blur-sm shadow-sm">
                                        This profile is private
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Bottom Actions - Conditionally Rendered */}
                        {data.hasButtons && (
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
                        )}
                    </div>
                </div>
            </motion.div>
        </TooltipProvider>
    )
}

export function ProfileWallSection() {
    const router = useRouter()
    // We'll store columns of items instead of a flat list for masonry layout
    const [columns, setColumns] = useState<ProfileData[][]>([[], [], [], []])

    useEffect(() => {
        // Shuffle descriptions to ensure uniqueness
        const shuffledDescriptions = [...DESCRIPTIONS].sort(() => 0.5 - Math.random());

        // Generate a random set of items
        const items: ProfileData[] = Array.from({ length: 12 }).map((_, i) => {
            // Logic for top row (first 4 items):
            // Index 0/2: No Buttons (Private). Index 1/3: Yes Buttons (Public).

            let hasButtons: boolean;
            let isPrivate: boolean;

            if (i < 4) {
                // Even indices (0, 2) -> PRIVATE. Odd indices (1, 3) -> PUBLIC.
                isPrivate = i % 2 === 0;
            } else {
                // Random for the rest
                isPrivate = Math.random() > 0.7; // 30% private
            }

            hasButtons = !isPrivate;

            return {
                id: `p-grid-${i}`,
                address: generateRandomAddress(),
                avatar: MOCK_AVATARS[i % MOCK_AVATARS.length],
                headerColor: HEADER_COLORS[i % HEADER_COLORS.length],
                description: shuffledDescriptions[i % shuffledDescriptions.length],
                followers: (Math.floor(Math.random() * 290) + 10).toLocaleString(), // 10 - 300
                collectibles: (Math.floor(Math.random() * 50) + 2).toString(), // 2 - 52 (reduced range slightly too)
                hasButtons: hasButtons,
                isPrivate: isPrivate,
                isOnline: Math.random() > 0.3, // 70% chance of being online
                role: ROLES[Math.floor(Math.random() * ROLES.length)],
                scoreTier: SCORE_TIERS[Math.floor(Math.random() * SCORE_TIERS.length)],
                isVerified: Math.random() > 0.7 // 30% Verified chance
            }
        })

        // Distribute items into 4 columns for masonry effect
        const cols: ProfileData[][] = [[], [], [], []]
        items.forEach((item, i) => {
            cols[i % 4].push(item)
        })
        setColumns(cols)
    }, [])

    if (columns[0].length === 0) return null

    return (
        <section className="relative w-full py-24 bg-background overflow-hidden">
            {/* Header Content */}
            <div className="container mx-auto px-4 mb-20 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto space-y-4"
                >
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
                        Join the network
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Claim your specialized profile and start building your on-chain reputation today.
                    </p>
                </motion.div>
            </div>

            {/* Column-Based Masonry Grid */}
            <div className="container mx-auto px-4 relative z-10 pb-32 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {columns.map((col, colIndex) => (
                        <div key={colIndex} className="flex flex-col gap-6">
                            {col.map((item, i) => (
                                <ProfileCard key={item.id} data={item} index={i} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Gradient Overlay + CTA */}
            <div className="absolute inset-x-0 bottom-0 h-[600px] bg-gradient-to-t from-background via-background/95 to-transparent z-20 pointer-events-none" />

            <div className="absolute bottom-0 inset-x-0 pb-24 z-30 flex justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="text-center space-y-6 max-w-2xl px-4"
                >
                    <div className="space-y-2">
                        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
                            Ready to claim your on-chain identity?
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Join the wallet-first profile layer for Avalanche.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                        <Button
                            size="lg"
                            variant="default"
                            className="w-full sm:w-auto gap-2 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                            onClick={() => router.push('/demo')}
                        >
                            <Sparkles className="h-4 w-4" />
                            Try Demo
                        </Button>

                        {/* 
                            NOTE: In a real integration we would import WalletConnectButtons here.
                            For now, since we are inside a client component that might not have access to the context providers 
                            wrappers in the same way, we'll simulate the button or duplicate the logic if needed.
                            However, since ProfileWallSection is 'use client', we can just use a placeholder button 
                            that looks like the wallet connect button if we don't want to import the full complexity,
                            OR we can import the actual component if it's compatible.
                            
                            Let's try to stick to the visual: "Connect Wallet" with an icon.
                         */}
                        <Button
                            size="lg"
                            variant="outline"
                            className="w-full sm:w-auto gap-2 text-base border-border/60 transition-all hover:-translate-y-0.5 hover:bg-accent/50"
                        >
                            <Wallet className="h-4 w-4" />
                            Connect Wallet
                        </Button>
                    </div>


                </motion.div>
            </div>
        </section>
    )
}
