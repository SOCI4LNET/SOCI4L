'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

import { Copy, ExternalLink, MoreHorizontal, Activity } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AvatarImage } from '@/components/ui/avatar'


export function ComparisonSection() {
    return (
        <section className="container mx-auto px-4 py-24 relative overflow-hidden">
            {/* Background Texture */}
            {/* Background Texture Removed */}

            {/* Section Header */}
            <div className="text-center mb-16 space-y-4 relative z-10">
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl font-semibold tracking-tight sm:text-4xl text-foreground"
                >
                    Wallet address is data. <span className="text-muted-foreground">Profile is identity.</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-muted-foreground text-sm max-w-lg mx-auto"
                >
                    Stop sharing hex strings. Start sharing who you are.
                </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 max-w-5xl mx-auto items-center relative z-10">
                {/* Left: The "Data" (Explorer View) */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="relative group rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden flex flex-col h-[480px] shadow-xl dark:shadow-none"
                >
                    {/* Fake Browser Header */}
                    <div className="h-10 border-b border-border/10 bg-muted/40 flex items-center px-4 gap-2">
                        <div className="flex gap-1.5 opacity-50">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        </div>
                        <div className="ml-4 h-6 px-3 bg-background/50 rounded text-[10px] items-center flex text-muted-foreground font-mono w-full max-w-[240px] border border-border/10">
                            snowtrace.io/address/0x1e4a...
                        </div>
                    </div>

                    {/* Explorer Content */}
                    <div className="p-6 font-mono text-xs space-y-6 text-muted-foreground">
                        {/* Header Row */}
                        <div className="flex items-center justify-between border-b border-border/10 pb-4">
                            <div className="space-y-1.5">
                                <div className="text-muted-foreground/70 uppercase tracking-wider text-[9px] font-semibold">Address</div>
                                <div className="flex items-center gap-2 text-foreground bg-muted/40 px-2 py-1 rounded border border-border/10">
                                    0x1e4a3d...5f92dd5
                                    <Copy className="w-3 h-3 ml-auto opacity-30" />
                                </div>
                            </div>
                            <div className="h-8 w-8 rounded bg-muted/40 flex items-center justify-center border border-border/10">
                                <div className="w-4 h-4 rounded-sm bg-muted-foreground/20" />
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1 p-3 bg-muted/20 rounded border border-border/10">
                                <div className="text-muted-foreground/70 text-[9px] uppercase">Balance</div>
                                <div className="text-foreground font-medium">145.2 AVAX</div>
                            </div>
                            <div className="space-y-1 p-3 bg-muted/20 rounded border border-border/10">
                                <div className="text-muted-foreground/70 text-[9px] uppercase">Tx Count</div>
                                <div className="text-foreground font-medium">1,204</div>
                            </div>
                        </div>

                        {/* Tx Table Header */}
                        <div className="space-y-3 pt-2">
                            <div className="flex gap-4 text-[9px] text-muted-foreground/70 border-b border-border/10 pb-2 uppercase tracking-wide">
                                <span className="w-1/3">Tx Hash</span>
                                <span className="w-1/6">Block</span>
                                <span className="w-1/6">Method</span>
                                <span className="text-right flex-1">Age</span>
                            </div>
                            {/* Rows */}
                            <div className="space-y-3 opacity-80">
                                <div className="flex items-center text-[10px] gap-4">
                                    <span className="text-blue-500 w-1/3 truncate font-medium">0x8a2f...91b</span>
                                    <span className="text-muted-foreground w-1/6">129384</span>
                                    <span className="w-1/6"><span className="bg-muted px-1.5 py-0.5 rounded text-[8px] border border-border/10 text-muted-foreground">Transfer</span></span>
                                    <span className="text-right flex-1 text-muted-foreground">2m ago</span>
                                </div>
                                <div className="flex items-center text-[10px] gap-4">
                                    <span className="text-blue-500 w-1/3 truncate font-medium">0x1d9c...4e2</span>
                                    <span className="text-muted-foreground w-1/6">129381</span>
                                    <span className="w-1/6"><span className="bg-muted px-1.5 py-0.5 rounded text-[8px] border border-border/10 text-muted-foreground">Swap</span></span>
                                    <span className="text-right flex-1 text-muted-foreground">5m ago</span>
                                </div>
                                <div className="flex items-center text-[10px] gap-4">
                                    <span className="text-blue-500 w-1/3 truncate font-medium">0x7b3a...f01</span>
                                    <span className="text-muted-foreground w-1/6">129375</span>
                                    <span className="w-1/6"><span className="bg-muted px-1.5 py-0.5 rounded text-[8px] border border-border/10 text-muted-foreground">Approval</span></span>
                                    <span className="text-right flex-1 text-muted-foreground">12m ago</span>
                                </div>
                                <div className="flex items-center text-[10px] gap-4">
                                    <span className="text-blue-500 w-1/3 truncate font-medium">0x9e2d...c34</span>
                                    <span className="text-muted-foreground w-1/6">129362</span>
                                    <span className="w-1/6"><span className="bg-muted px-1.5 py-0.5 rounded text-[8px] border border-border/10 text-muted-foreground">Transfer</span></span>
                                    <span className="text-right flex-1 text-muted-foreground">24m ago</span>
                                </div>
                                <div className="flex items-center text-[10px] gap-4">
                                    <span className="text-blue-500 w-1/3 truncate font-medium">0x5f1a...b98</span>
                                    <span className="text-muted-foreground w-1/6">129340</span>
                                    <span className="w-1/6"><span className="bg-muted px-1.5 py-0.5 rounded text-[8px] border border-border/10 text-muted-foreground">Mint</span></span>
                                    <span className="text-right flex-1 text-muted-foreground">1h ago</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Label Tag */}
                    <div className="absolute bottom-4 left-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border/50">
                            <Activity className="w-3 h-3" />
                            Raw Data
                        </span>
                    </div>
                </motion.div>

                {/* Right: The "Identity" (SOCI4L Profile) */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="relative group rounded-2xl border border-border bg-card text-card-foreground flex flex-col h-[480px] overflow-hidden shadow-xl dark:shadow-none"
                >
                    {/* Profile Header (Cover) */}
                    <div className="h-32 w-full relative bg-muted/40">
                        {/* Abstract Cover Pattern */}
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500 via-purple-500 to-transparent" />

                        {/* More Menu */}
                        <div className="absolute top-4 right-4">
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-background/40 hover:bg-background/60 text-foreground/80 hover:text-foreground backdrop-blur-md">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="px-8 flex-1 flex flex-col relative pb-8">
                        {/* Avatar - Rounded Square for "Real Wallet" / NFT look */}
                        <div className="absolute -top-12 left-8">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                                className="relative group/avatar cursor-pointer"
                            >
                                <div className="w-24 h-24 rounded-2xl border-[4px] border-card bg-muted overflow-hidden shadow-xl dark:shadow-none">
                                    <AvatarImage src="https://effigy.im/a/0x8ab0cf264df99d83525e9e11c7e4db01558ae1b1.svg" className="object-cover w-full h-full" />
                                </div>
                                <div className="absolute bottom-0 -right-1 w-6 h-6 bg-emerald-500 border-4 border-card rounded-full" />
                            </motion.div>
                        </div>

                        <div className="mt-14 space-y-1">
                            <div className="flex items-center gap-2">
                                {/* Name replaced with formatted Address as requested */}
                                <h3 className="text-2xl font-bold text-foreground tracking-tight font-mono">0x1e4a...2dd5</h3>
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20 px-1.5 py-0.5 text-[9px] h-5 uppercase tracking-wider font-semibold">
                                    Whale
                                </Badge>
                            </div>
                        </div>

                        {/* Bio - No bottom margin/space */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="mt-4 text-sm text-muted-foreground leading-relaxed font-medium pr-4"
                        >
                            Building the future of finance on Avalanche 🔺. Collector of rare abstract art.
                        </motion.div>

                        {/* Social Signals - Micro-animations added */}
                        <div className="grid grid-cols-3 gap-4 py-6 border-t border-border mt-auto">
                            {[
                                { val: '12.4k', label: 'Followers' },
                                { val: '842', label: 'Collected' },
                                { val: 'Elite', label: 'Rank' }
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    className={cn(
                                        "text-center group/stat cursor-pointer hover:bg-muted/50 rounded-lg py-2 transition-colors",
                                        i > 0 && "border-l border-border"
                                    )}
                                >
                                    <div className="text-lg font-bold text-foreground group-hover/stat:scale-110 transition-transform origin-center">{stat.val}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="flex gap-3"
                        >
                            <Button className="flex-1 gap-2 font-semibold shadow-lg shadow-black/5 dark:shadow-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 transition-transform active:scale-95">
                                Follow Profile
                            </Button>
                            <Button variant="outline" size="icon" className="h-10 w-10 border-border bg-background/50 text-foreground hover:bg-muted rounded-lg transition-transform active:scale-95">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </Button>
                            <Button variant="outline" size="icon" className="h-10 w-10 border-border bg-background/50 text-foreground hover:bg-muted rounded-lg transition-transform active:scale-95">
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </motion.div>
                    </div>

                    {/* Label Tag */}
                    <div className="absolute top-4 left-4">
                        {/* Optional: Add a label if needed, or keep clean */}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
