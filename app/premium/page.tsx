"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
    BarChart2,
    Lock,
    ShieldCheck,
    TrendingUp,
    Zap,
    MousePointerClick,
    Eye,
    ChevronRight,
    CheckCircle2,
    Wallet,
    Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PremiumUpgradeModal } from "@/components/premium/premium-upgrade-modal"
import { Soci4LLogo } from "@/components/logos/soci4l-logo"
import { formatDistanceToNow } from "date-fns"

// --- MOCK DATA MATCHING INSIGHTS PANEL STRUCTURE ---
const MOCK_SOURCES = {
    "Twitter / X": 450,
    "Instagram": 300,
    "Direct": 150,
    "LinkedIn": 100
}
const TOTAL_VIEWS_MOCK = 1000

const MOCK_TOP_LINKS = [
    { id: 1, title: "My Portfolio Website", clicks: 1245 },
    { id: 2, title: "Latest YouTube Video", clicks: 890 },
    { id: 3, title: "Schedule a Call", clicks: 560 },
    { id: 4, title: "Gumroad Store", clicks: 320 },
    { id: 5, title: "Newsletter Sign-up", clicks: 210 },
]

const MOCK_CATEGORIES = [
    { id: 1, name: "Socials", totalClicks: 2100, share: 0.4 },
    { id: 2, name: "Work", totalClicks: 1500, share: 0.3 },
    { id: 3, name: "Content", totalClicks: 900, share: 0.2 },
    { id: 4, name: "Contact", totalClicks: 600, share: 0.1 },
]

// Updated to match exactly what's available in InsightsPanel
// It uses `visitor` (likely generic) or just renders types
const MOCK_ACTIVITY = [
    { type: "profile_view", timestamp: new Date().toISOString(), label: "New Visit", linkTitle: null },
    { type: "link_click", timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), label: "Link Click", linkTitle: "My Portfolio Website" },
    { type: "profile_view", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), label: "New Visit", linkTitle: null },
    { type: "link_click", timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), label: "Link Click", linkTitle: "Latest YouTube Video" },
    { type: "profile_view", timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), label: "New Visit", linkTitle: null },
    { type: "link_click", timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), label: "Link Click", linkTitle: "Gumroad Store" },
]

// Animated List Item Component
const AnimatedListItem = ({ children, index }: { children: React.ReactNode, index: number }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
    >
        {children}
    </motion.div>
)

export default function PremiumPage() {
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const router = useRouter()

    const handleUpgradeClick = () => {
        setShowUpgradeModal(true)
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen text-foreground font-sans selection:bg-white/30">

                {/* HEADER / NAVIGATION */}
                <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => router.push('/')}>
                            <Soci4LLogo variant="icon" className="w-8 h-8 text-white invert-0 transition-transform group-hover:scale-110" />
                            <span className="font-bold text-xl tracking-tight">SOCI4L</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                className="text-sm text-muted-foreground hover:text-white hidden sm:flex"
                                onClick={() => router.push('/dashboard')}
                            >
                                Dashboard
                            </Button>
                            <Button
                                onClick={handleUpgradeClick}
                                className="bg-white hover:bg-zinc-200 text-black font-medium rounded-full px-6 transition-all hover:scale-105 active:scale-95"
                            >
                                Upgrade
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="pt-32 pb-20">
                    {/* HERO SECTION */}
                    <section className="max-w-5xl mx-auto px-6 text-center mb-32">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <Badge variant="outline" className="mb-6 border-white/20 text-white px-4 py-1.5 rounded-full text-sm hover:bg-white/5 transition-colors cursor-default">
                                <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                                Official Premium Upgrade
                            </Badge>
                            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-8 text-white">
                                Turn your reputation into <br /> <span className="text-zinc-500">identity capital.</span>
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                                Gain deep visibility into your audience with source breakdowns, referrer tracking, and real-time history.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button
                                    onClick={handleUpgradeClick}
                                    size="lg"
                                    className="h-14 px-10 rounded-full text-lg font-semibold bg-white text-black hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
                                >
                                    Unlock for 0.5 AVAX
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                                <p className="text-xs text-muted-foreground mt-4 sm:mt-0 sm:ml-4 font-mono uppercase tracking-wider">
                                    Lifetime Access
                                </p>
                            </div>
                        </motion.div>
                    </section>

                    {/* FEATURE 1: SOURCE ATTRIBUTION (1:1 with InsightsPanel) */}
                    <section className="max-w-6xl mx-auto px-6 mb-32">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <div className="flex items-center gap-2 text-white mb-4">
                                    <TrendingUp className="w-5 h-5" />
                                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Analytics</span>
                                </div>
                                <h2 className="text-3xl font-semibold mb-4 text-white">Know exactly where your traffic comes from.</h2>
                                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                    Stop guessing. See precise breakdowns of your traffic sources.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                            >
                                {/* EXACT REPLICA OF SOURCE ATTRIBUTION CARD */}
                                <Card className="bg-card border-border/60 shadow-sm relative z-10">
                                    <CardHeader className="pb-3 px-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                                    Top Sources
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Sources are tracked via referrer headers.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </CardTitle>
                                                <CardDescription className="text-[11px]">Traffic attribution by origin</CardDescription>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] font-medium opacity-70">
                                                Measurable Profile
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6">
                                        <div className="space-y-4">
                                            {Object.entries(MOCK_SOURCES).map(([key, val], i) => {
                                                const percentage = (val / TOTAL_VIEWS_MOCK) * 100
                                                return (
                                                    <AnimatedListItem key={key} index={i}>
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="font-medium text-muted-foreground capitalize">{key}</span>
                                                                <span className="font-mono text-foreground/80">{percentage.toFixed(0)}%</span>
                                                            </div>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden cursor-crosshair">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            whileInView={{ width: `${percentage}%` }}
                                                                            transition={{ duration: 1, delay: 0.2 }}
                                                                            className="h-full bg-white rounded-full"
                                                                        />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{val} views from {key}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </AnimatedListItem>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </section>

                    {/* FEATURE 2: PERFORMANCE BREAKDOWNS (1:1 with InsightsPanel) */}
                    <section className="max-w-6xl mx-auto px-6 mb-32">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                            {/* Visual Side (Left on Desktop) */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="relative order-2 md:order-1"
                            >
                                <div className="grid gap-4 relative z-10">
                                    {/* Top Links Card */}
                                    <Card className="bg-card border border-border/60 shadow-sm">
                                        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Top Links</CardTitle></CardHeader>
                                        <CardContent>
                                            {MOCK_TOP_LINKS.slice(0, 5).map((link, i) => (
                                                <AnimatedListItem key={link.id} index={i}>
                                                    <div className="flex justify-between py-2 border-b border-border/40 last:border-0 text-sm">
                                                        <span className="truncate max-w-[200px]">{link.title}</span>
                                                        <span className="font-mono">{link.clicks}</span>
                                                    </div>
                                                </AnimatedListItem>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    {/* Top Categories Card */}
                                    <Card className="bg-card border border-border/60 shadow-sm">
                                        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Top Categories</CardTitle></CardHeader>
                                        <CardContent>
                                            {MOCK_CATEGORIES.map((cat, i) => (
                                                <AnimatedListItem key={cat.id} index={i}>
                                                    <div className="flex justify-between py-2 border-b border-border/40 last:border-0 text-sm">
                                                        <span>{cat.name}</span>
                                                        <span className="font-mono">{cat.totalClicks}</span>
                                                    </div>
                                                </AnimatedListItem>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            </motion.div>

                            {/* Text Side */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="order-1 md:order-2"
                            >
                                <div className="flex items-center gap-2 text-white mb-4">
                                    <BarChart2 className="w-5 h-5" />
                                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Performance</span>
                                </div>
                                <h2 className="text-3xl font-semibold mb-4 text-white">Identify what resonates. Eliminate what doesn't.</h2>
                                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                    Discover your highest-performing links and content categories. Understand user intent and restructure your profile.
                                </p>
                            </motion.div>
                        </div>
                    </section>

                    {/* FEATURE 3: REAL-TIME ACTIVITY (1:1 with InsightsPanel) */}
                    <section className="max-w-6xl mx-auto px-6 mb-32">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <div className="flex items-center gap-2 text-white mb-4">
                                    <Zap className="w-5 h-5" />
                                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Real-time</span>
                                </div>
                                <h2 className="text-3xl font-semibold mb-4 text-white">Track on-chain identities. <br /> In real-time.</h2>
                                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                    See exactly who is interacting with your profile. Premium insights reveal real-time analytics.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="relative"
                            >
                                {/* EXACT REPLICA FROM INSIGHTS PANEL */}
                                <Card className="bg-card border border-border/60 shadow-sm relative z-10 h-[380px] overflow-hidden">
                                    <CardHeader className="pb-3 border-b border-white/5">
                                        <CardTitle className="text-base">Recent Activity</CardTitle>
                                        <CardDescription className="text-xs">Real-time event log</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        {MOCK_ACTIVITY.map((act, i) => (
                                            <AnimatedListItem key={i} index={i}>
                                                <div className="flex items-center gap-3 mb-4 text-xs last:mb-0">
                                                    <div className={`w-2 h-2 rounded-full ${act.type === 'profile_view' ? 'bg-blue-500' : 'bg-green-500'}`} />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between">
                                                            <span className="font-medium capitalize flex items-center gap-1">
                                                                {act.type === 'profile_view' ? <Eye className="w-3 h-3" /> : <MousePointerClick className="w-3 h-3" />}
                                                                {act.type.replace('_', ' ')}
                                                            </span>
                                                            <span className="text-muted-foreground">{formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}</span>
                                                        </div>
                                                        {act.linkTitle && <div className="text-muted-foreground mt-0.5 truncate max-w-[200px]">{act.linkTitle}</div>}
                                                    </div>
                                                </div>
                                            </AnimatedListItem>
                                        ))}
                                    </CardContent>
                                    {/* Fade out bottom to indicate scroll/flow */}
                                    <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none" />
                                </Card>
                            </motion.div>
                        </div>
                    </section>

                    {/* FINAL CTA */}
                    <section className="max-w-3xl mx-auto px-6 text-center mb-20">
                        <Card className="bg-gradient-to-b from-white/5 to-transparent border-white/10 backdrop-blur-sm transition-all duration-500">
                            <CardContent className="pt-12 pb-12">
                                <h2 className="text-3xl font-semibold mb-6 text-white">Ready to upgrade?</h2>
                                <p className="text-muted-foreground mb-8 text-lg">
                                    Join hundreds of creators who own their data and understand their audience.
                                </p>
                                <Button
                                    onClick={handleUpgradeClick}
                                    size="lg"
                                    className="bg-white text-black hover:bg-zinc-200 px-12 h-12 rounded-full font-semibold shadow-xl shadow-white/5 transition-all hover:scale-105 active:scale-95"
                                >
                                    Get Premium Now
                                </Button>
                            </CardContent>
                        </Card>
                    </section>

                    <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-white/5 text-center text-sm text-muted-foreground">
                        <p>&copy; {new Date().getFullYear()} SOCI4L. Built on Avalanche.</p>
                    </footer>

                    <PremiumUpgradeModal
                        open={showUpgradeModal}
                        onOpenChange={setShowUpgradeModal}
                        onSuccess={() => {
                            router.push('/dashboard')
                        }}
                    />
                </main>
            </div>
        </TooltipProvider>
    )
}
