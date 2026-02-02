'use client'

import { motion } from 'framer-motion'
import { Copy, ExternalLink, Twitter, Star, MoreHorizontal, ArrowRightLeft, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

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
                    className="relative group rounded-2xl border border-border/40 bg-zinc-950/80 overflow-hidden flex flex-col h-[480px] shadow-2xl"
                >
                    {/* Fake Browser Header */}
                    <div className="h-10 border-b border-white/5 bg-zinc-900/50 flex items-center px-4 gap-2 backdrop-blur-md">
                        <div className="flex gap-1.5 opacity-50">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        </div>
                        <div className="ml-4 h-6 px-3 bg-zinc-950/50 rounded text-[10px] items-center flex text-zinc-500 font-mono w-full max-w-[240px] border border-white/5">
                            snowtrace.io/address/0x1e4a...
                        </div>
                    </div>

                    {/* Explorer Content */}
                    <div className="p-6 font-mono text-xs space-y-6 text-zinc-400">
                        {/* Header Row */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div className="space-y-1.5">
                                <div className="text-zinc-600 uppercase tracking-wider text-[9px] font-semibold">Address</div>
                                <div className="flex items-center gap-2 text-zinc-300 bg-zinc-900/80 px-2 py-1 rounded border border-white/5">
                                    0x1e4a3d...5f92dd5
                                    <Copy className="w-3 h-3 ml-auto opacity-30" />
                                </div>
                            </div>
                            <div className="h-8 w-8 rounded bg-zinc-900 flex items-center justify-center border border-white/5">
                                <div className="w-4 h-4 rounded-sm bg-zinc-800" />
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1 p-3 bg-zinc-900/30 rounded border border-white/5">
                                <div className="text-zinc-600 text-[9px] uppercase">Balance</div>
                                <div className="text-zinc-300 font-medium">145.2 AVAX</div>
                            </div>
                            <div className="space-y-1 p-3 bg-zinc-900/30 rounded border border-white/5">
                                <div className="text-zinc-600 text-[9px] uppercase">Tx Count</div>
                                <div className="text-zinc-300 font-medium">1,204</div>
                            </div>
                        </div>

                        {/* Tx Table Header */}
                        <div className="space-y-3 pt-2">
                            <div className="flex gap-4 text-[9px] text-zinc-600 border-b border-white/5 pb-2 uppercase tracking-wide">
                                <span className="text-zinc-400 font-medium w-1/3">Tx Hash</span>
                                <span className="w-1/6">Block</span>
                                <span className="w-1/6">Method</span>
                                <span className="text-right flex-1">Age</span>
                            </div>
                            {/* Rows */}
                            <div className="space-y-3 opacity-60">
                                <div className="flex items-center text-[10px] gap-4">
                                    <span className="text-blue-500/80 w-1/3 truncate font-medium">0x8a2f...91b</span>
                                    <span className="text-zinc-500 w-1/6">129384</span>
                                    <span className="w-1/6"><span className="bg-zinc-900 px-1.5 py-0.5 rounded text-[8px] border border-white/5 text-zinc-400">Transfer</span></span>
                                    <span className="text-right flex-1 text-zinc-600">2m ago</span>
                                </div>
                                <div className="flex items-center text-[10px] gap-4">
                                    <span className="text-blue-500/80 w-1/3 truncate font-medium">0x1d9c...4e2</span>
                                    <span className="text-zinc-500 w-1/6">129381</span>
                                    <span className="w-1/6"><span className="bg-zinc-900 px-1.5 py-0.5 rounded text-[8px] border border-white/5 text-zinc-400">Swap</span></span>
                                    <span className="text-right flex-1 text-zinc-600">5m ago</span>
                                </div>
                                <div className="flex items-center text-[10px] gap-4">
                                    <span className="text-blue-500/80 w-1/3 truncate font-medium">0x7b3a...f01</span>
                                    <span className="text-zinc-500 w-1/6">129375</span>
                                    <span className="w-1/6"><span className="bg-zinc-900 px-1.5 py-0.5 rounded text-[8px] border border-white/5 text-zinc-400">Approval</span></span>
                                    <span className="text-right flex-1 text-zinc-600">12m ago</span>
                                </div>
                                <div className="flex items-center text-[10px] gap-4">
                                    <span className="text-blue-500/80 w-1/3 truncate font-medium">0x9e2d...c34</span>
                                    <span className="text-zinc-500 w-1/6">129362</span>
                                    <span className="w-1/6"><span className="bg-zinc-900 px-1.5 py-0.5 rounded text-[8px] border border-white/5 text-zinc-400">Transfer</span></span>
                                    <span className="text-right flex-1 text-zinc-600">24m ago</span>
                                </div>
                                <div className="flex items-center text-[10px] gap-4">
                                    <span className="text-blue-500/80 w-1/3 truncate font-medium">0x5f1a...b98</span>
                                    <span className="text-zinc-500 w-1/6">129340</span>
                                    <span className="w-1/6"><span className="bg-zinc-900 px-1.5 py-0.5 rounded text-[8px] border border-white/5 text-zinc-400">Mint</span></span>
                                    <span className="text-right flex-1 text-zinc-600">1h ago</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Label Tag */}
                    <div className="absolute bottom-4 left-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-zinc-900 text-zinc-500 border border-zinc-800">
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
                    className="relative group rounded-2xl border border-zinc-900 bg-black flex flex-col h-[480px] overflow-hidden shadow-2xl"
                >
                    {/* Profile Header (Cover) */}
                    <div className="h-32 w-full relative bg-black">
                        {/* More Menu */}
                        <div className="absolute top-4 right-4">
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="px-8 flex-1 flex flex-col relative pb-8">
                        {/* Avatar */}
                        <div className="absolute -top-12 left-8">
                            <div className="relative group/avatar cursor-pointer">
                                <div className="w-24 h-24 rounded-2xl border-[4px] border-black bg-zinc-900 overflow-hidden shadow-xl">
                                    <AvatarImage src="https://api.dicebear.com/9.x/pixel-art/svg?seed=CryptoKing" className="object-cover w-full h-full" />
                                </div>
                                <div className="absolute bottom-0 -right-1 w-6 h-6 bg-emerald-500 border-4 border-black rounded-full" />
                            </div>
                        </div>

                        <div className="mt-14 space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-bold text-white tracking-tight">CryptoKing.avax</h3>
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 px-1.5 py-0.5 text-[9px] h-5 uppercase tracking-wider font-semibold">
                                    Whale
                                </Badge>
                            </div>
                            <div className="text-sm text-zinc-500 font-mono flex items-center gap-2 group/address cursor-pointer">
                                0x1e4a...5f92dd5
                                <Copy className="w-3 h-3 opacity-0 group-hover/address:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        <div className="mt-5 text-sm text-zinc-400 leading-relaxed font-medium pr-4">
                            Building the future of finance on Avalanche 🔺. Collector of rare abstract art & governance delegate.
                        </div>

                        {/* Social Signals */}
                        <div className="grid grid-cols-3 gap-4 py-6 border-t border-zinc-900 mt-auto">
                            <div className="text-center group/stat cursor-pointer hover:bg-zinc-900/50 rounded-lg py-2 transition-colors">
                                <div className="text-lg font-bold text-white">12.4k</div>
                                <div className="text-[9px] text-zinc-600 uppercase tracking-widest font-semibold">Followers</div>
                            </div>
                            <div className="text-center border-l border-zinc-900 group/stat cursor-pointer hover:bg-zinc-900/50 rounded-lg py-2 transition-colors">
                                <div className="text-lg font-bold text-white">842</div>
                                <div className="text-[9px] text-zinc-600 uppercase tracking-widest font-semibold">Collected</div>
                            </div>
                            <div className="text-center border-l border-zinc-900 group/stat cursor-pointer hover:bg-zinc-900/50 rounded-lg py-2 transition-colors">
                                <div className="text-lg font-bold text-white">Elite</div>
                                <div className="text-[9px] text-zinc-600 uppercase tracking-widest font-semibold">Rank</div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button className="flex-1 gap-2 font-semibold shadow-lg shadow-white/5 bg-white text-black hover:bg-zinc-200 h-10">
                                Follow Profile
                            </Button>
                            <Button variant="outline" size="icon" className="h-10 w-10 border-zinc-800 bg-zinc-900/50 text-white hover:bg-zinc-900 hover:text-white rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </Button>
                            <Button variant="outline" size="icon" className="h-10 w-10 border-zinc-800 bg-zinc-900/50 text-white hover:bg-zinc-900 hover:text-white rounded-lg">
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </div>
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
