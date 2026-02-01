'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Sparkles, LayoutTemplate, Wallet, Eye, QrCode, Copy, Share2, Check, Activity, ArrowUpRight, Clock, ShieldCheck, MousePointer2, AlertCircle, EyeOff, Lock, Globe } from 'lucide-react'

// Feature Data
const FEATURES = [
    {
        id: 'ai',
        title: 'Know how your profile performs',
        description: "See who your shared wallet link reaches and what it converts into.",
        icon: Sparkles,
        color: "from-violet-500 to-purple-500",
        image: "/feature-1-bg.png"
    },
    {
        id: 'share-qr',
        title: 'Share with QR',
        description: "Create a public wallet profile, attach your links, and share everything through one QR code.",
        icon: QrCode,
        color: "from-blue-500 to-indigo-500",
        image: "/qr-feature-bg.png"
    },
    {
        id: 'design',
        title: 'Which link works?',
        description: "Adding links isn't enough. Know which one is clicked and which is ignored.",
        icon: LayoutTemplate,
        color: "from-blue-500 to-cyan-500",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1600&h=1200"
    },
    {
        id: 'context',
        title: 'Context, not Explorer',
        description: "Present your holdings with a readable summary instead of technical lists.",
        icon: Wallet,
        color: "from-orange-500 to-amber-500",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1600&h=1200"
    },
    {
        id: 'privacy',
        title: 'Privacy-First Visibility',
        description: "Your entire profile doesn't have to be public. You have the control.",
        icon: Eye,
        color: "from-pink-500 to-rose-500",
        image: "https://images.unsplash.com/photo-1517048676732-d65fa9374000?auto=format&fit=crop&q=80&w=1600&h=1200"
    }
]

export function FeatureScrollSection() {
    const [activeFeature, setActiveFeature] = useState(0)

    return (
        <section className="relative w-full bg-background border-t border-b border-border/40">
            <div className="mx-auto w-full max-w-6xl px-4 grid grid-cols-1 md:grid-cols-[0.6fr_1.4fr] gap-12 lg:gap-20 relative">

                {/* Left: Sticky Text Content */}
                <div className="hidden md:flex flex-col justify-center h-screen sticky top-0 py-24">
                    <div className="space-y-4 mb-12">
                        <h2 className="text-3xl md:text-3xl font-semibold tracking-tight text-foreground/90">
                            More than just<br />
                            connecting a wallet
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {FEATURES.map((feature, index) => {
                            const isActive = activeFeature === index

                            return (
                                <div
                                    key={feature.id}
                                    className="relative pl-8 py-2 cursor-pointer group"
                                    onClick={() => {
                                        const element = document.getElementById(`feature-img-${index}`)
                                        if (element) {
                                            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                        }
                                    }}
                                >
                                    {/* Vertical Line Indicator */}
                                    <div
                                        className={cn(
                                            "absolute left-0 top-0 bottom-0 w-[2px] rounded-full transition-all duration-300",
                                            isActive
                                                ? "bg-foreground shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                                                : "bg-white/5 w-[1px] group-hover:bg-white/10"
                                        )}
                                    />
                                    <h3 className={cn(
                                        "text-lg font-medium mb-2 transition-colors duration-300",
                                        isActive ? "text-foreground" : "text-muted-foreground/60 group-hover:text-muted-foreground"
                                    )}>
                                        {feature.title}
                                    </h3>

                                    <div
                                        className={cn(
                                            "overflow-hidden transition-all duration-500 ease-in-out",
                                            isActive ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                                        )}
                                    >
                                        <p className="text-muted-foreground leading-relaxed text-sm pr-4">
                                            {feature.description}
                                        </p>

                                        {isActive && (
                                            <div className="pt-4 flex items-center text-sm font-medium text-primary hover:underline cursor-pointer group">
                                                Learn more
                                                <span className="ml-1 transition-transform group-hover:translate-x-0.5">›</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Right: Scrolling Visuals */}
                <div className="flex flex-col gap-40 pt-40 pb-96">
                    {FEATURES.map((feature, index) => (
                        <FeatureImage
                            key={feature.id}
                            feature={feature}
                            index={index}
                            setActiveFeature={setActiveFeature}
                        />
                    ))}
                </div>

            </div>
        </section>
    )
}

function FeatureImage({ feature, index, setActiveFeature }: { feature: any, index: number, setActiveFeature: (i: number) => void }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { margin: "-50% 0px -50% 0px" })

    useEffect(() => {
        if (isInView) {
            setActiveFeature(index)
        }
    }, [isInView, index, setActiveFeature])

    // List of custom visual IDs
    const CUSTOM_VISUAL_IDS = ['ai', 'share-qr', 'design', 'context', 'privacy']
    const hasCustomVisual = CUSTOM_VISUAL_IDS.includes(feature.id)

    return (
        <div
            id={`feature-img-${index}`}
            ref={ref}
            className="w-full flex items-center justify-center min-h-[60vh]"
        >

            <div className="relative w-full aspect-square md:aspect-[16/10] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-muted/5">
                {/* Background Image - Only if NOT a custom visual */}
                {!hasCustomVisual && (
                    <div className={cn(
                        "absolute inset-0 opacity-20 bg-gradient-to-br mix-blend-overlay z-10",
                        feature.color
                    )} />
                )}

                {!hasCustomVisual ? (
                    <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-black" />
                )}

                {/* Chart Overlay (Analytics) */}
                {feature.id === 'ai' && (
                    <div className="absolute inset-0 z-20 p-6">
                        {/* "Gray Area" Container - Expanded to fill */}
                        <div className="w-full h-full bg-black rounded-xl border border-white/15 p-6 shadow-2xl overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <div className="space-y-1">
                                    <h4 className="text-base font-semibold text-foreground">Traffic Sources</h4>
                                    <p className="text-xs text-muted-foreground">Last 7 days</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 bg-violet-500/10 rounded-full px-2 py-1 border border-violet-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                        <span className="text-[10px] font-medium text-violet-400">Link</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-blue-500/10 rounded-full px-2 py-1 border border-blue-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <span className="text-[10px] font-medium text-blue-400">QR</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-pink-500/10 rounded-full px-2 py-1 border border-pink-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                        <span className="text-[10px] font-medium text-pink-400">Social</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-orange-500/10 rounded-full px-2 py-1 border border-orange-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                        <span className="text-[10px] font-medium text-orange-400">Search</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full flex-1 min-h-0">
                                <ProfileViewsChart />
                            </div>
                        </div>
                    </div>
                )}

                {/* Share QR Visual */}
                {feature.id === 'share-qr' && (
                    <div className="absolute inset-0 z-20 p-6">
                        <div className="w-full h-full bg-black rounded-xl border border-white/15 p-4 shadow-2xl overflow-hidden">
                            <ShareQRVisual />
                        </div>
                    </div>
                )}

                {/* Link Performance Visual */}
                {feature.id === 'design' && (
                    <div className="absolute inset-0 z-20 p-6">
                        <div className="w-full h-full bg-black rounded-xl border border-white/15 p-4 shadow-2xl overflow-hidden">
                            <LinkPerformanceVisual />
                        </div>
                    </div>
                )}

                {/* On-chain Context Visual */}
                {feature.id === 'context' && (
                    <div className="absolute inset-0 z-20 p-6">
                        <div className="w-full h-full bg-black rounded-xl border border-white/15 p-4 shadow-2xl overflow-hidden">
                            <OnChainContextVisual />
                        </div>
                    </div>
                )}

                {/* Privacy Control Visual */}
                {feature.id === 'privacy' && (
                    <div className="absolute inset-0 z-20 p-6">
                        <div className="w-full h-full bg-black rounded-xl border border-white/15 p-4 shadow-2xl overflow-hidden">
                            <PrivacyControlVisual />
                        </div>
                    </div>
                )}

                {/* UI Overlay Simulation */}
                {!hasCustomVisual && (
                    <div className="absolute inset-0 z-20 p-6 flex flex-col justify-between pointer-events-none">
                        {/* Top Bar Mock */}
                        <div className="w-full h-8 bg-background/40 backdrop-blur-md rounded-lg border border-white/10 flex items-center px-3 gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                        </div>

                        {/* Floating Label */}
                        <div className="self-end">
                            <div className="bg-background/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg shadow-lg">
                                <div className="flex items-center gap-2">
                                    <feature.icon className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-medium">{feature.title} Mode</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Chart Component using Recharts
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'


function PrivacyControlVisual() {
    return (
        <div className="w-full h-full flex flex-col gap-4">
            {/* Control Panel */}
            <div className="bg-zinc-950/50 rounded-lg border border-white/5 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-zinc-400" />
                        Visibility Settings
                    </h4>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-400">
                                <Wallet className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-zinc-200">Net Worth</p>
                                <p className="text-[10px] text-zinc-500">Total value display</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Private</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-400">
                                <Activity className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-zinc-200">Activity</p>
                                <p className="text-[10px] text-zinc-500">Transaction history</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Public</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="flex-1 bg-zinc-900/30 rounded-lg border border-white/5 p-4 relative overflow-hidden group">
                <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 z-20">
                    <Eye className="w-3 h-3 text-zinc-400" />
                    <span className="text-[10px] text-zinc-400 font-medium">Public View</span>
                </div>

                <div className="mt-4 space-y-3 opacity-60 pointer-events-none select-none relative">
                    {/* Stacked Cards Animation */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent z-10" />

                    {/* Blurred/Hidden Net Worth */}
                    <div className="flex items-center gap-3 transition-transform duration-500 group-hover:scale-[1.02] group-hover:translate-x-1">
                        <div className="w-10 h-10 rounded-full bg-zinc-800" />
                        <div className="space-y-2">
                            <div className="w-24 h-3 rounded bg-zinc-800" />
                            <div className="w-16 h-2 rounded bg-zinc-800" />
                        </div>
                    </div>

                    <div className="h-24 rounded-lg bg-zinc-800/50 border border-white/5 flex items-center justify-center relative transition-all duration-500 group-hover:rotate-1 group-hover:scale-[1.02] origin-center">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex flex-col items-center gap-2">
                            <EyeOff className="w-5 h-5 text-zinc-600 transition-transform duration-300 group-hover:scale-110 group-hover:text-zinc-500" />
                            <p className="text-xs text-zinc-600 font-medium group-hover:text-zinc-500 transition-colors">Hidden by User</p>
                        </div>
                    </div>

                    {/* Extra mocked content for depth */}
                    <div className="h-12 rounded-lg bg-zinc-800/30 border border-white/5 opacity-50 transition-all duration-700 delay-75 group-hover:-rotate-1 group-hover:translate-y-1" />
                </div>
            </div>
        </div>
    )
}

const CHART_DATA = [
    { name: 'Mon', value: 400, link: 200, qr: 50, social: 100, search: 50 },
    { name: 'Tue', value: 300, link: 150, qr: 40, social: 80, search: 30 },
    { name: 'Wed', value: 550, link: 250, qr: 80, social: 150, search: 70 },
    { name: 'Thu', value: 450, link: 200, qr: 60, social: 120, search: 70 },
    { name: 'Fri', value: 650, link: 300, qr: 100, social: 180, search: 70 },
    { name: 'Sat', value: 800, link: 350, qr: 120, social: 250, search: 80 },
    { name: 'Sun', value: 950, link: 450, qr: 150, social: 250, search: 100 },
]

function ProfileViewsChart() {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CHART_DATA}>
                <defs>
                    <linearGradient id="colorLink" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorQr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSocial" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSearch" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    dy={10}
                />
                <Tooltip
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="bg-black/95 border border-white/15 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[180px]">
                                    <p className="text-muted-foreground text-[10px] mb-3 font-medium uppercase tracking-wider">{label} Breakdown</p>
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                                <span className="text-xs text-zinc-300">Direct Link</span>
                                            </div>
                                            <span className="text-xs font-semibold text-white tabular-nums">{payload[0].payload.link}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                <span className="text-xs text-zinc-300">QR Scan</span>
                                            </div>
                                            <span className="text-xs font-semibold text-white tabular-nums">{payload[0].payload.qr}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                                <span className="text-xs text-zinc-300">Social</span>
                                            </div>
                                            <span className="text-xs font-semibold text-white tabular-nums">{payload[0].payload.social}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                <span className="text-xs text-zinc-300">Search</span>
                                            </div>
                                            <span className="text-xs font-semibold text-white tabular-nums">{payload[0].payload.search}</span>
                                        </div>
                                        <div className="pt-3 mt-1 border-t border-white/10 flex items-center justify-between gap-4">
                                            <span className="text-xs font-medium text-zinc-400">Total Views</span>
                                            <span className="text-xs font-bold text-white tabular-nums">{payload[0].value}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                    cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                    type="monotone"
                    dataKey="link"
                    stackId="1"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLink)"
                />
                <Area
                    type="monotone"
                    dataKey="qr"
                    stackId="1"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorQr)"
                />
                <Area
                    type="monotone"
                    dataKey="social"
                    stackId="1"
                    stroke="#ec4899"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSocial)"
                />
                <Area
                    type="monotone"
                    dataKey="search"
                    stackId="1"
                    stroke="#f97316"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSearch)"
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

const LINKS_DATA = [
    { name: "Portfolio", clicks: 1240, ctr: "12%", status: "active" },
    { name: "X (Twitter)", clicks: 856, ctr: "8.5%", status: "active" },
    { name: "Newsletter", clicks: 42, ctr: "0.8%", status: "warning" },
    { name: "Old Shop", clicks: 0, ctr: "0%", status: "dead" },
]

const SECTION_CTR_DATA = [
    { name: 'Profile Bio', value: 45 },
    { name: 'Link Grid', value: 32 },
    { name: 'Socials', value: 15 },
]

function LinkPerformanceVisual() {
    return (
        <div className="w-full h-full grid grid-rows-4 gap-3">
            {/* Top Links Card - Takes up 3/4 space */}
            <div className="row-span-3 bg-zinc-950/50 rounded-lg border border-white/5 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-blue-500" />
                        Top Links
                    </h4>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Ranked</span>
                </div>
                <div className="flex-1 flex flex-col justify-around">
                    {LINKS_DATA.map((link, i) => (
                        <div key={link.name} className="flex items-center justify-between group py-1">
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold",
                                    i === 0 ? "bg-yellow-500/20 text-yellow-500" :
                                        i === 1 ? "bg-zinc-800 text-zinc-400" :
                                            "bg-zinc-900 text-zinc-600"
                                )}>
                                    {i + 1}
                                </span>
                                <span className={cn("text-sm transition-colors", link.status === 'dead' ? 'text-zinc-500 line-through' : 'text-zinc-300 group-hover:text-white')}>{link.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {link.status === 'dead' ? (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                        Dead Link
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-500 font-medium tabular-nums">{link.clicks}</span>
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                            link.status === 'warning' ? "bg-orange-500/10 text-orange-500" : "bg-emerald-500/10 text-emerald-500"
                                        )}>
                                            {link.ctr}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTR By Section Bar Chart - Takes up 1/4 space */}
            <div className="row-span-1 bg-zinc-950/50 rounded-lg border border-white/5 px-4 pt-3 pb-2 flex flex-row items-center gap-4">
                <div className="w-24 shrink-0">
                    <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                        <MousePointer2 className="w-3.5 h-3.5 text-purple-500" />
                        CTR by Area
                    </h4>
                </div>
                <div className="flex-1 h-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={SECTION_CTR_DATA} layout="vertical" barSize={8}>
                            <XAxis type="number" hide />
                            <YAxis type="category" hide />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-zinc-950 border border-white/10 px-2 py-1.5 rounded-lg shadow-xl text-[10px]">
                                                <span className="text-zinc-400 font-medium">{payload[0].payload.name}:</span> <span className="text-white font-bold tabular-nums">{payload[0].value}%</span>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {SECTION_CTR_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#a855f7' : '#3f3f46'} fillOpacity={index === 0 ? 1 : 0.5} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

function OnChainContextVisual() {
    return (
        <div className="w-full h-full grid grid-rows-2 gap-4">
            {/* Top Row: Assets Snapshot */}
            <div className="grid grid-cols-2 gap-4">
                {/* Tokens Card */}
                <div className="bg-zinc-950/50 rounded-lg border border-white/5 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                            <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                            Assets
                        </h4>
                        <span className="text-[10px] text-zinc-500 font-medium">$12,450</span>
                    </div>
                    <div className="space-y-3 mt-2">
                        <div className="flex items-center justify-between group/token hover:bg-white/5 p-1 -mx-1 rounded transition-colors cursor-default">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[8px] font-bold text-white shadow-lg group-hover/token:scale-110 transition-transform">A</div>
                                <div>
                                    <p className="text-xs font-medium text-zinc-200 group-hover/token:text-white transition-colors">AVAX</p>
                                    <p className="text-[10px] text-zinc-500">Avalanche</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-medium text-zinc-200">145.2</p>
                                <p className="text-[10px] text-emerald-500">+2.4%</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between group/token hover:bg-white/5 p-1 -mx-1 rounded transition-colors cursor-default">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] font-bold text-white shadow-lg group-hover/token:scale-110 transition-transform">U</div>
                                <div>
                                    <p className="text-xs font-medium text-zinc-200 group-hover/token:text-white transition-colors">USDC</p>
                                    <p className="text-[10px] text-zinc-500">Circle</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-medium text-zinc-200">4,200</p>
                                <p className="text-[10px] text-zinc-500">0.0%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* NFT/Collectibles Card (Enhanced) */}
                <div className="bg-zinc-950/50 rounded-lg border border-white/5 p-4 flex flex-col relative overflow-hidden group hover:border-white/10 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <h4 className="text-xs font-semibold text-zinc-100">Collectibles</h4>
                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white group-hover:bg-white/20 transition-colors">32</span>
                    </div>

                    <div className="flex-1 relative group/stack">
                        {/* Stacked Cards Visualization */}
                        <div className="absolute bottom-0 left-0 right-0 h-16">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="absolute bottom-0 left-0 w-12 h-16 rounded-lg border border-white/10 shadow-lg transition-all duration-300 ease-out group-hover/stack:translate-x-1"
                                    style={{
                                        left: `${i * 24}px`,
                                        zIndex: i,
                                        transform: `rotate(${i * 4 - 4}deg) translateY(${i * -2}px)`,
                                        backgroundImage: i === 0 ? 'url(https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=100&h=100)' :
                                            i === 1 ? 'url(https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?auto=format&fit=crop&q=80&w=100&h=100)' :
                                                'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                >
                                    <div className="absolute inset-0 hover:z-20 hover:scale-110 hover:-translate-y-4 hover:rotate-0 transition-all duration-300 cursor-pointer shadow-xl rounded-lg" />
                                    {i === 2 && (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400 font-medium bg-zinc-900/90 backdrop-blur-sm pointer-events-none">
                                            +29
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Activity & Spam Filter */}
            <div className="bg-zinc-950/50 rounded-lg border border-white/5 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-orange-500" />
                        Activity Summary
                    </h4>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500">Last 30d</span>
                        <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3 text-green-500" />
                            <span className="text-[9px] font-semibold text-green-500 uppercase tracking-wide">Spam Filtered</span>
                        </div>
                    </div>
                </div>

                {/* Simulated Activity Chart */}
                <div className="flex-1 flex items-end gap-1 pb-1 px-1 h-12">
                    {[30, 45, 25, 60, 80, 50, 40, 70, 90, 65, 55, 40, 60, 75, 50, 85, 95, 70, 60, 80, 50, 40, 60, 70, 55, 45, 65, 80, 90, 75].map((h, i) => (
                        <div
                            key={i}
                            style={{ height: `${h}%` }}
                            className={cn(
                                "flex-1 rounded-t-sm transition-all duration-300 hover:scale-y-110 origin-bottom group/bar relative",
                                i > 25 ? "bg-orange-500 hover:bg-orange-400" : "bg-zinc-800/80 hover:bg-zinc-700"
                            )}
                        >
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-zinc-950 border border-white/10 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                {Math.floor(h * 1.5)} tx
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
                    <div className="text-[10px] text-zinc-500">126 Txns</div>
                    <div className="text-[10px] text-zinc-500">High Activity</div>
                </div>
            </div>
        </div>
    )
}

function ShareQRVisual() {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="w-full h-full flex items-center justify-center relative p-8 select-none">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-50" />

            {/* Left Card: Top Links (Simulated) */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 -translate-x-12 scale-90 opacity-60 hover:opacity-100 hover:scale-95 hover:z-20 transition-all duration-500 blur-[1px] hover:blur-0 group/left">
                <div className="w-[200px] bg-[#121214] rounded-xl border border-white/10 p-4 shadow-2xl">
                    <div className="flex items-center gap-2 mb-3 text-zinc-400">
                        <ArrowUpRight className="w-4 h-4" />
                        <span className="text-xs font-semibold">Top Links</span>
                    </div>
                    <div className="space-y-2">
                        {['My Website', 'X', 'Telegram'].map((link, i) => (
                            <div key={link} className="flex items-center justify-between text-[10px]">
                                <span className="text-zinc-300">{link}</span>
                                <span className="text-zinc-500 tabular-nums">{1240 - i * 300} clicks</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Card: Recent Activity (Simulated) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 translate-x-12 scale-90 opacity-60 hover:opacity-100 hover:scale-95 hover:z-20 transition-all duration-500 blur-[1px] hover:blur-0 group/right">
                <div className="w-[200px] bg-[#121214] rounded-xl border border-white/10 p-4 shadow-2xl">
                    <div className="flex items-center gap-2 mb-3 text-zinc-400">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-semibold">Activity</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-red-500">A</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-zinc-300">Sent AVAX</span>
                                    <span className="text-zinc-500">2m ago</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-blue-500">U</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-zinc-300">Swap USDC</span>
                                    <span className="text-zinc-500">1h ago</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-purple-500">N</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-zinc-300">Mint NFT</span>
                                    <span className="text-zinc-500">1d ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main QR Card */}
            <div className="w-full max-w-[280px] bg-[#121214] rounded-2xl p-4 shadow-2xl relative z-30 group transition-transform duration-500 hover:scale-[1.02] border border-white/10">
                {/* Card Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-[10px] shadow-lg font-mono">
                        0x
                    </div>
                    <div>
                        <h4 className="text-zinc-100 font-bold text-sm tracking-tight font-mono">0x71...3a9</h4>
                        <p className="text-zinc-500 text-[10px] font-medium font-mono">soci4l.net/0x71...3a9</p>
                    </div>
                    <div className="ml-auto">
                        <Share2 className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    </div>
                </div>

                {/* QR Code Area */}
                <div className="aspect-square bg-black/50 rounded-xl p-4 mb-4 relative overflow-hidden border border-white/5 group/qr">
                    {/* Simulated QR Pattern */}
                    <div className="w-full h-full grid grid-cols-7 grid-rows-7 gap-1">
                        {Array.from({ length: 49 }).map((_, i) => {
                            // Corner markers
                            const isCorner =
                                (i >= 0 && i <= 2) || (i >= 7 && i <= 9) || (i >= 14 && i <= 16) ||
                                (i >= 4 && i <= 6) || (i >= 11 && i <= 13) || (i >= 18 && i <= 20) ||
                                (i >= 28 && i <= 30) || (i >= 35 && i <= 37) || (i >= 42 && i <= 44);

                            return (
                                <div
                                    key={i}
                                    className={`rounded-[1px] transition-all duration-500 ${isCorner ? 'bg-zinc-200' : Math.random() > 0.4 ? 'bg-zinc-400/80' : 'bg-white/5'}`}
                                    style={{ opacity: Math.random() > 0.5 ? 1 : 0.3 }}
                                />
                            )
                        })}
                    </div>

                    {/* Central Logo Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-[#121214] p-2 rounded-full border border-white/10 shadow-xl group-hover/qr:scale-110 transition-transform">
                            <div className="w-5 h-5 bg-red-500 rounded-sm flex items-center justify-center">
                                <span className="text-white font-bold text-[9px]">A</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Button - Fake Copy */}
                <div
                    onClick={handleCopy}
                    className="flex items-center gap-2 bg-white/5 rounded-lg p-2 cursor-pointer hover:bg-white/10 active:scale-95 transition-all duration-200 group/btn border border-white/5 select-none"
                >
                    <div className={cn(
                        "flex-1 text-center text-xs font-medium transition-colors",
                        copied ? "text-emerald-400" : "text-zinc-300 group-hover/btn:text-white"
                    )}>
                        {copied ? "Copied!" : "Copy Link"}
                    </div>
                    <div className={cn(
                        "w-6 h-6 rounded flex items-center justify-center shadow-sm transition-colors",
                        copied ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-zinc-400 group-hover/btn:text-white"
                    )}>
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </div>
                </div>
            </div>
        </div>
    )
}
