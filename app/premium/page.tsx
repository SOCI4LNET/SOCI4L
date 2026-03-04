"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"
import { useProfile } from "@/hooks/use-profile"

import { BarChart2, ShieldCheck, TrendingUp, Zap, ChevronRight, Info, Link2, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PremiumUpgradeModal } from "@/components/premium/premium-upgrade-modal"
import { Soci4LLogo } from "@/components/logos/soci4l-logo"
import SiteFooter from "@/components/app-shell/site-footer"
import { HeaderActions } from "@/components/app-shell/header-actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PremiumWallCta } from "@/components/premium/premium-wall-cta"

// --- MOCK DATA ---
const MOCK_SOURCES = {
    "X": 450,
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

// Updated Mock Activity to match "Real" Feed style with diverse actions
const MOCK_ACTIVITY = [
    {
        id: 1,
        visitor: "0x8a80...1234",
        fullVisitor: "0x8a809876543210abcdef1234567890abcdef1234",
        action: "Shared your Profile",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
    },
    {
        id: 2,
        visitor: "0x71C7...99A2",
        fullVisitor: "0x71C7656EC7ab88b098defB751B7401B5f6d899A2",
        action: "viewed your Profile",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    {
        id: 3,
        visitor: "0x3B28...f12C",
        fullVisitor: "0x3B289134567890abcdef1234567890abcdef55",
        action: "copied your Wallet Address",
        timestamp: new Date(Date.now() - 1000 * 60 * 32).toISOString()
    },
    {
        id: 4,
        visitor: "0x9A12...1234",
        fullVisitor: "0x9A1234567890abcdef1234567890abcdef1234",
        action: "clicked on X",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
        id: 5,
        visitor: "0x4F56...7890",
        fullVisitor: "0x4F567890abcdef1234567890abcdef12345678",
        action: "scanned your QR Code",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString()
    },
    {
        id: 6,
        visitor: "0x1234...5678",
        fullVisitor: "0x1234567890abcdef1234567890abcdef123456",
        action: "clicked on Portfolio Website",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
        id: 7,
        visitor: "0x890a...bcde",
        fullVisitor: "0x890abcdef1234567890abcdef1234567890aa",
        action: "analyzed your Profile",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
    },
]

// Updated Avatar component using consistent App style (Effigy.im)
// Updated Avatar component using DiceBear for reliability
const PixelAvatar = ({ address }: { address: string }) => {
    return (
        <Avatar className="h-8 w-8 border border-border/50 ring-2 ring-background transition-transform hover:scale-105">
            <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${address}`} alt={address} />
            <AvatarFallback className="bg-muted text-[10px]">{address.slice(2, 4).toUpperCase()}</AvatarFallback>
        </Avatar>
    )
}


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
    const { address: connectedAddress } = useAccount()
    const { profile } = useProfile(connectedAddress)
    const router = useRouter()

    const isPremium = useMemo(() => {
        if (!profile?.premiumExpiresAt) return false;
        return new Date(profile.premiumExpiresAt) > new Date();
    }, [profile?.premiumExpiresAt]);

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
                            <Soci4LLogo variant="icon" className="w-8 h-8 transition-transform group-hover:scale-110" />
                            <span className="font-bold text-xl tracking-tight">SOCI4L</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {!isPremium && (
                                <Button
                                    onClick={handleUpgradeClick}
                                    className="bg-foreground hover:bg-foreground/90 text-background font-medium rounded-full px-6 transition-all hover:scale-105 active:scale-95 shadow-none hover:shadow-none hidden sm:flex"
                                >
                                    Upgrade
                                </Button>
                            )}
                            {isPremium && (
                                <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary rounded-full px-4 py-1 hidden sm:flex items-center gap-1.5 font-semibold">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Premium active
                                </Badge>
                            )}
                            <HeaderActions />
                        </div>
                    </div>
                </header>

                <main className="pt-32">
                    {/* HERO SECTION */}
                    <section className="max-w-5xl mx-auto px-6 text-center mb-32">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <Badge variant="outline" className="mb-6 border-border text-foreground px-4 py-1.5 rounded-full text-sm hover:bg-foreground/5 transition-colors cursor-default">
                                <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                                Official Premium Upgrade
                            </Badge>
                            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-8 text-foreground">
                                Turn your reputation into <br /> <span className="text-muted-foreground">identity capital.</span>
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                                Gain deep visibility into your audience with source breakdowns, referrer tracking, and real-time history.
                            </p>
                            {!isPremium ? (
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Button
                                        onClick={handleUpgradeClick}
                                        size="lg"
                                        className="h-14 px-10 rounded-full text-lg font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all hover:scale-105 active:scale-95 shadow-none"
                                    >
                                        Unlock for 0.5 AVAX
                                        <ChevronRight className="w-5 h-5 ml-2" />
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-4 sm:mt-0 sm:ml-4 font-mono uppercase tracking-wider">
                                        1 Year Access
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <div className="bg-primary/10 text-primary border border-primary/20 rounded-2xl px-8 py-4 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shadow-lg shadow-primary/10">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-bold">Premium Unlocked</h3>
                                            <p className="text-sm opacity-80 max-w-xs">All features are active. You can access detailed analytics on your dashboard.</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => router.push('/dashboard')}
                                        variant="outline"
                                        className="rounded-full px-8 h-12 border-border/60 hover:bg-muted"
                                    >
                                        Go to Dashboard
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </section>

                    {/* FEATURE 1: SOURCE ATTRIBUTION */}
                    <section className="max-w-6xl mx-auto px-6 mb-48">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-stretch">
                            {/* Visual Side */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                            >
                                <Card className="bg-card border-border/60 shadow-none h-full">
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
                                            <Badge variant="outline" className="text-[10px] font-medium opacity-70">Measurable Profile</Badge>
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
                                                                            className="h-full bg-foreground rounded-full"
                                                                        />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{val} views from {key}</p></TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </AnimatedListItem>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Text Side */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Analytics</span>
                                    </div>
                                    <h2 className="text-[30px] font-medium leading-tight mb-4 text-foreground">Know exactly where your traffic comes from.</h2>
                                    <p className="text-base text-muted-foreground leading-relaxed">
                                        Stop guessing. See precise breakdowns of your traffic sources â€” X, Instagram, Direct, and beyond.
                                    </p>
                                </div>
                                <div className="mt-8 pt-8 border-t border-border/30">
                                    <p className="text-xs font-semibold text-foreground mb-4">Source intelligence</p>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                        {['Referrer Tracking', 'Origin Breakdown', 'Platform Attribution', 'UTM Support'].map((item) => (
                                            <span key={item} className="text-sm text-muted-foreground">{item}</span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </section>

                    {/* SECTION DIVIDER */}
                    <div className="max-w-6xl mx-auto px-6 mb-48 flex items-center gap-6">
                        <span className="text-[11px] font-mono text-muted-foreground/40 tabular-nums">02</span>
                        <div className="flex-1 h-[1px] bg-border/30" />
                    </div>

                    {/* FEATURE 2: PERFORMANCE BREAKDOWNS */}
                    <section className="max-w-6xl mx-auto px-6 mb-48">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-stretch">
                            {/* Text Side */}
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <BarChart2 className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Performance</span>
                                    </div>
                                    <h2 className="text-[30px] font-medium leading-tight mb-4 text-foreground">Identify what resonates. Eliminate what doesn't.</h2>
                                    <p className="text-base text-muted-foreground leading-relaxed">
                                        Discover your highest-performing links and content categories. Understand user intent and restructure your profile.
                                    </p>
                                </div>
                                <div className="mt-8 pt-8 border-t border-border/30">
                                    <p className="text-xs font-semibold text-foreground mb-4">Full-stack understanding</p>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                        {['Top Links Ranking', 'Category Analytics', 'Click-through Rate', 'Profile Restructuring'].map((item) => (
                                            <span key={item} className="text-sm text-muted-foreground">{item}</span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Visual Side */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="grid gap-4 content-start"
                            >
                                <Card className="bg-card border border-border/60 shadow-none">
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
                                <Card className="bg-card border border-border/60 shadow-none">
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
                            </motion.div>
                        </div>
                    </section>

                    {/* SECTION DIVIDER */}
                    <div className="max-w-6xl mx-auto px-6 mb-48 flex items-center gap-6">
                        <span className="text-[11px] font-mono text-muted-foreground/40 tabular-nums">03</span>
                        <div className="flex-1 h-[1px] bg-border/30" />
                    </div>

                    {/* FEATURE 3: REAL-TIME ACTIVITY */}
                    <section className="max-w-6xl mx-auto px-6 mb-48">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-stretch">
                            {/* Visual Side */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                            >
                                <Card className="bg-card border border-border/60 shadow-none relative h-full overflow-hidden" style={{ minHeight: '380px' }}>
                                    <CardHeader className="pb-3 border-b border-border/40">
                                        <CardTitle className="text-base text-foreground">Recent Activity</CardTitle>
                                        <CardDescription className="text-xs">Latest events timeline (verified real-time activity)</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6 relative pl-10">
                                        <div className="absolute left-[24px] top-6 bottom-0 w-[1px] bg-border/40 h-full" />
                                        <div className="space-y-6">
                                            {MOCK_ACTIVITY.map((act, i) => (
                                                <AnimatedListItem key={act.id} index={i}>
                                                    <div className="flex items-start gap-4 relative group/item hover:bg-muted/30 p-2 rounded-lg -mx-2 transition-all duration-300">
                                                        <div className="absolute left-[-28px] top-[14px] w-2.5 h-2.5 rounded-full bg-border border-2 border-background z-10 group-hover/item:bg-primary group-hover/item:scale-125 transition-all duration-300" />
                                                        <div className="flex items-start gap-3 w-full">
                                                            <div className="relative">
                                                                <PixelAvatar address={act.fullVisitor} />
                                                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
                                                            </div>
                                                            <div className="flex-1 min-w-0 pt-0.5">
                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                                                    <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                                                                        <Badge variant="secondary" className="px-1.5 py-0 h-5 font-mono text-[10px] bg-muted/50 text-muted-foreground border-border">
                                                                            {act.visitor}
                                                                        </Badge>
                                                                        <span className="text-muted-foreground">{act.action}</span>
                                                                    </div>
                                                                    <span className="text-[10px] text-muted-foreground/60 font-mono">
                                                                        {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </AnimatedListItem>
                                            ))}
                                        </div>
                                    </CardContent>
                                    <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none" />
                                </Card>
                            </motion.div>

                            {/* Text Side */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Zap className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Real-time</span>
                                    </div>
                                    <h2 className="text-[30px] font-medium leading-tight mb-4 text-foreground">Track on-chain identities. In real-time.</h2>
                                    <p className="text-base text-muted-foreground leading-relaxed">
                                        See exactly who is interacting with your profile. Premium insights reveal wallet-level activity as it happens.
                                    </p>
                                </div>
                                <div className="mt-8 pt-8 border-t border-border/30">
                                    <p className="text-xs font-semibold text-foreground mb-4">Live visibility</p>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                        {['Wallet Identification', 'Action Timeline', 'QR Scan Tracking', 'Share Detection'].map((item) => (
                                            <span key={item} className="text-sm text-muted-foreground">{item}</span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </section>

                    {/* SECTION DIVIDER */}
                    <div className="max-w-6xl mx-auto px-6 mb-48 flex items-center gap-6">
                        <span className="text-[11px] font-mono text-muted-foreground/40 tabular-nums">04</span>
                        <div className="flex-1 h-[1px] bg-border/30" />
                    </div>

                    {/* FEATURE 4: INDIVIDUAL LINK ANALYTICS */}
                    <section className="max-w-6xl mx-auto px-6 mb-48">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-stretch">
                            {/* Text Side */}
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Link2 className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Link Analytics</span>
                                    </div>
                                    <h2 className="text-[30px] font-medium leading-tight mb-4 text-foreground">Detailed link performance. Down to the click.</h2>
                                    <p className="text-base text-muted-foreground leading-relaxed">
                                        Gain surgical precision with link-specific insights. Track source attribution, visitor wallets, and referrers for every link.
                                    </p>
                                </div>
                                <div className="mt-8 pt-8 border-t border-border/30">
                                    <p className="text-xs font-semibold text-foreground mb-4">Per-link precision</p>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                        {['Source Attribution', 'Visitor Wallets', 'Referrer Data', 'Click History'].map((item) => (
                                            <span key={item} className="text-sm text-muted-foreground">{item}</span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Visual Side */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="grid gap-4 content-start"
                            >
                                <Card className="bg-card border border-border/60 shadow-none">
                                    <CardHeader className="pb-3 px-6">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            Source Breakdown
                                            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">Link Specific</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6">
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs"><span className="text-muted-foreground">X</span><span className="text-foreground">65%</span></div>
                                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-foreground w-[65%]" /></div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Direct / Copy</span><span className="text-foreground">25%</span></div>
                                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-foreground w-[25%]" /></div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-card border border-border/60 shadow-none">
                                    <CardHeader className="pb-3 px-6">
                                        <CardTitle className="text-sm font-semibold">Visitor History</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-4">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-xs pb-2 border-b border-border/40">
                                                <span className="font-mono text-primary">0x123...890</span>
                                                <span className="text-muted-foreground">2m ago</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-mono text-primary">0xabc...def</span>
                                                <span className="text-muted-foreground">15m ago</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </section>

                    {/* FINAL CTA with WALL BACKGROUND */}
                    <PremiumWallCta onUpgrade={handleUpgradeClick} isPremium={isPremium} />

                    <SiteFooter />

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
