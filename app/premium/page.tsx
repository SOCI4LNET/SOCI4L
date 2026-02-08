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
    Globe,
    MousePointerClick,
    Eye,
    ExternalLink,
    ChevronRight,
    CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PremiumUpgradeModal } from "@/components/premium/premium-upgrade-modal"
import { PageShell } from "@/components/dashboard/page-shell"

// --- MOCK DATA FOR PREMIUM SHOWCASE ---
const MOCK_SOURCES = [
    { name: "Twitter / X", value: 45, color: "bg-blue-500" },
    { name: "Instagram", value: 30, color: "bg-pink-500" },
    { name: "Direct", value: 15, color: "bg-green-500" },
    { name: "LinkedIn", value: 10, color: "bg-blue-700" },
]

const MOCK_TOP_LINKS = [
    { id: 1, title: "My Portfolio Website", clicks: 1245 },
    { id: 2, title: "Latest YouTube Video", clicks: 890 },
    { id: 3, title: "Schedule a Call", clicks: 560 },
    { id: 4, title: "Gumroad Store", clicks: 320 },
    { id: 5, title: "Newsletter Sign-up", clicks: 210 },
]

const MOCK_CATEGORIES = [
    { id: 1, name: "Socials", totalClicks: 2100 },
    { id: 2, name: "Work", totalClicks: 1500 },
    { id: 3, name: "Content", totalClicks: 900 },
    { id: 4, name: "Contact", totalClicks: 600 },
]

const MOCK_ACTIVITY = [
    { type: "profile_view", timestamp: "Just now", label: "Profile View" },
    { type: "link_click", timestamp: "2 mins ago", label: "Link Click", detail: "My Portfolio Website" },
    { type: "profile_view", timestamp: "5 mins ago", label: "Profile View" },
    { type: "link_click", timestamp: "12 mins ago", label: "Link Click", detail: "Latest YouTube Video" },
    { type: "profile_view", timestamp: "18 mins ago", label: "Profile View" },
]

export default function PremiumPage() {
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const router = useRouter()

    const handleUpgradeClick = () => {
        setShowUpgradeModal(true)
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-yellow-500/30">
            {/* Navigation / Header Placeholder (Optional, strictly speaking we might just want to be standalone) */}
            <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-black fill-current" />
                        </div>
                        SOCI4L<span className="text-yellow-500">Premium</span>
                    </div>
                    <Button
                        variant="ghost"
                        className="text-sm text-muted-foreground hover:text-white"
                        onClick={() => router.push('/dashboard')}
                    >
                        Back to Dashboard
                    </Button>
                </div>
            </header>

            <main className="pt-32 pb-20">
                {/* HERO SECTION */}
                <section className="max-w-4xl mx-auto px-6 text-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <Badge className="mb-6 bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-4 py-1.5 rounded-full text-sm hover:bg-yellow-500/20 transition-colors">
                            <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                            Official Premium Upgrade
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                            Unlock the full power <br /> of your digital identity.
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                            Gain deep visibility into your audience with source breakdowns, referrer tracking, and real-time history. One-time payment, forever yours.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                onClick={handleUpgradeClick}
                                size="lg"
                                className="h-14 px-10 rounded-full text-lg font-semibold bg-white text-black hover:bg-gray-100 transition-all shadow-2xl shadow-yellow-500/20"
                            >
                                Unlock for 0.5 AVAX
                                <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                            <p className="text-xs text-muted-foreground mt-4 sm:mt-0 sm:ml-4">
                                Lifetime Access • No Recurring Fees
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* FEATURE 1: SOURCE ATTRIBUTION */}
                <section className="max-w-6xl mx-auto px-6 mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-3xl font-bold mb-4">Know exactly where your traffic comes from.</h2>
                            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                Stop guessing. See precise breakdowns of your traffic sources—whether it's from Twitter, Instagram bio links, or direct QR code scans. Optimize your reach with data-backed decisions.
                            </p>
                            <ul className="space-y-4 mb-8">
                                {['Granular source tracking', 'Referrer analysis', 'Platform-specific breakdown'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-medium">
                                        <CheckCircle2 className="w-5 h-5 text-yellow-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/30 to-orange-600/30 rounded-2xl blur-2xl opacity-50" />
                            <Card className="bg-black/90 border border-white/10 backdrop-blur-xl relative">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base">Top Sources</CardTitle>
                                            <CardDescription className="text-xs">Traffic attribution by origin</CardDescription>
                                        </div>
                                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-500">Premium</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {MOCK_SOURCES.map((source) => (
                                        <div key={source.name} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{source.name}</span>
                                                <span className="text-muted-foreground">{source.value}%</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${source.value}%` }}
                                                    transition={{ duration: 1, delay: 0.2 }}
                                                    className={`h-full ${source.color}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </section>

                {/* FEATURE 2: PERFORMANCE BREAKDOWNS */}
                <section className="max-w-6xl mx-auto px-6 mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        {/* Visual Side (Left on Desktop) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative order-2 md:order-1"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-l from-blue-500/20 to-purple-600/20 rounded-2xl blur-2xl opacity-50" />
                            <div className="grid gap-4 relative">
                                {/* Top Links Card */}
                                <Card className="bg-black/90 border border-white/10 backdrop-blur-xl">
                                    <CardHeader className="pb-3"><CardTitle className="text-sm">Top Links</CardTitle></CardHeader>
                                    <CardContent>
                                        {MOCK_TOP_LINKS.slice(0, 3).map((link) => (
                                            <div key={link.id} className="flex justify-between py-3 border-b border-white/5 last:border-0 text-sm">
                                                <span className="truncate">{link.title}</span>
                                                <span className="font-mono text-muted-foreground">{link.clicks}</span>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                                {/* Top Categories Card */}
                                <Card className="bg-black/90 border border-white/10 backdrop-blur-xl">
                                    <CardHeader className="pb-3"><CardTitle className="text-sm">Top Categories</CardTitle></CardHeader>
                                    <CardContent>
                                        {MOCK_CATEGORIES.slice(0, 3).map((cat) => (
                                            <div key={cat.id} className="flex justify-between py-3 border-b border-white/5 last:border-0 text-sm">
                                                <span>{cat.name}</span>
                                                <span className="font-mono text-muted-foreground">{cat.totalClicks}</span>
                                            </div>
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
                            <h2 className="text-3xl font-bold mb-4">Identify what resonates. Eliminate what doesn't.</h2>
                            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                Discover your highest-performing links and content categories. Understand user intent and restructure your profile to maximize engagement where it matters most.
                            </p>
                            <ul className="space-y-4 mb-8">
                                {['Link-level performance metrics', 'Category affinity analysis', 'Conversion tracking'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-medium">
                                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </section>

                {/* FEATURE 3: REAL-TIME ACTIVITY */}
                <section className="max-w-6xl mx-auto px-6 mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-3xl font-bold mb-4">Pulse of your audience. <br /> In real-time.</h2>
                            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                Watch interactions as they happen. The Real-time Event Log gives you a live feed of who is viewing your profile and what they are clicking on, exactly when it happens.
                            </p>
                            <Button
                                variant="outline"
                                className="border-white/10 hover:bg-white/5 text-white"
                                onClick={handleUpgradeClick}
                            >
                                See it in action
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-br from-green-500/20 to-teal-600/20 rounded-2xl blur-2xl opacity-50" />
                            <Card className="bg-black/90 border border-white/10 backdrop-blur-xl relative h-[320px] overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        Recent Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {MOCK_ACTIVITY.map((act, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex items-start gap-4"
                                        >
                                            <div className={`mt-1 p-1.5 rounded-full ${act.type === 'profile_view' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'}`}>
                                                {act.type === 'profile_view' ? <Eye size={14} /> : <MousePointerClick size={14} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{act.label}</span>
                                                    <span className="text-xs text-muted-foreground">• {act.timestamp}</span>
                                                </div>
                                                {act.detail && <p className="text-xs text-muted-foreground mt-0.5">{act.detail}</p>}
                                            </div>
                                        </motion.div>
                                    ))}
                                </CardContent>
                                {/* Fade out bottom */}
                                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black via-black/80 to-transparent" />
                            </Card>
                        </motion.div>
                    </div>
                </section>

                {/* FINAL CTA */}
                <section className="max-w-3xl mx-auto px-6 text-center mb-20">
                    <Card className="bg-gradient-to-b from-yellow-900/10 to-transparent border-yellow-500/20 backdrop-blur-sm">
                        <CardContent className="pt-12 pb-12">
                            <h2 className="text-3xl font-bold mb-6">Ready to upgrade?</h2>
                            <p className="text-muted-foreground mb-8 text-lg">
                                Join hundreds of creators who own their data and understand their audience.
                                <br />
                                <span className="text-white font-medium">0.5 AVAX / year. Trusted. Decentralized.</span>
                            </p>
                            <Button
                                onClick={handleUpgradeClick}
                                size="lg"
                                className="bg-white text-black hover:bg-gray-100 px-12 h-12 rounded-full font-semibold shadow-xl shadow-yellow-500/10"
                            >
                                Get Premium Now
                            </Button>
                        </CardContent>
                    </Card>
                </section>

                <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-white/10 text-center text-sm text-muted-foreground">
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
    )
}
