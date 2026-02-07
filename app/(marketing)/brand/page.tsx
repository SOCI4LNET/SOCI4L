'use client'

import { Soci4LLogo } from '@/components/logos/soci4l-logo'
import { Button } from '@/components/ui/button'
import { ArrowRight, Download, Check, X, ShieldAlert, Copy, Sparkles, MoreVertical, FileImage, FileCode, ArrowUpRight, LayoutDashboard, ChevronDown, Globe, Target, Shield, Twitter, CheckCircle, Info } from 'lucide-react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import React, { useState, useRef, type ReactNode } from "react"

export default function BrandPage() {
    const [isTypeHierarchyOpen, setIsTypeHierarchyOpen] = useState(false)

    return (
        <div className="min-h-screen bg-background pt-24 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-3xl mb-24"
                >
                    <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">
                        SOCI4L Brand Guidelines
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Our brand is more than just a logo. It's the visual language that connects us with our community.
                        Follow these guidelines to ensure consistency across all platforms.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="block"
                >

                    {/* 01. LOGOMARK (ICON) */}
                    {/* 01. LOGOMARK (ICON) */}
                    <section className="min-h-screen flex flex-col justify-center py-20 sticky top-0 z-10 bg-background">
                        <SectionHeader number="01" title="Logomark" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <LogoCard
                                label="Logomark (Icon)"
                                bg="bg-brand-500"
                                textColor="text-white"
                                downloadLink="/logos/icon-white.svg"
                                downloadName="SOCI4L_ICON_WHITE.svg"
                            >
                                <Soci4LLogo variant="icon" className="w-48 h-48 text-white invert-0" />
                            </LogoCard>
                            <LogoCard
                                label="On Light Background"
                                bg="bg-white"
                                textColor="text-black"
                                borderColor="border-black/5"
                                downloadLink="/logos/icon-black.svg"
                                downloadName="SOCI4L_ICON_BLACK.svg"
                            >
                                <img src="/logos/icon-black.svg" width={192} height={192} alt="SOCI4L Icon Black" className="object-contain" />
                            </LogoCard>
                        </div>
                    </section>

                    {/* 02. COMBINATION MARK */}
                    {/* 02. COMBINATION MARK */}
                    <section className="min-h-screen flex flex-col justify-center py-20 sticky top-0 z-20 bg-background">
                        <SectionHeader number="02" title="Combination Mark" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <LogoCard
                                label="On Black Background"
                                bg="bg-black"
                                textColor="text-white"
                                borderColor="border-white/10"
                                downloadLink="/logos/combination.svg"
                                downloadName="SOCI4L_COMBINATION_WHITE.svg"
                            >
                                <img src="/logos/combination.svg" width={240} height={72} alt="SOCI4L Combination White" className="object-contain" />
                            </LogoCard>
                            <LogoCard
                                label="On Light Background"
                                bg="bg-[#FAFAFA]"
                                textColor="text-zinc-400"
                                borderColor="border-black/5"
                                downloadLink="/logos/combination-black.svg"
                                downloadName="SOCI4L_COMBINATION_BLACK.svg"
                            >
                                <img src="/logos/combination-black.svg" width={240} height={72} alt="SOCI4L Combination Black" className="object-contain" />
                            </LogoCard>
                        </div>

                        {/* Clearspace & Safe Zones */}
                        <div className="mt-20">
                            <h3 className="text-xl font-medium mb-8">Clearspace & Safe Zones</h3>
                            <div className="p-12 rounded-3xl border border-white/5 bg-black/40 flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="relative p-12 border border-brand-500/30 border-dashed rounded-lg">
                                    {/* Markers */}
                                    {/* Markers */}
                                    <div className="absolute top-6 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-500 text-xs font-mono">x</div>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 translate-y-1/2 text-brand-500 text-xs font-mono">x</div>
                                    <div className="absolute left-6 top-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-500 text-xs font-mono">x</div>
                                    <div className="absolute right-6 top-1/2 translate-x-1/2 -translate-y-1/2 text-brand-500 text-xs font-mono">x</div>

                                    <Soci4LLogo variant="combination" width={200} className="invert-0 relative z-10" />
                                </div>
                                <p className="mt-12 text-center text-muted-foreground text-sm max-w-md">
                                    The Clearspace (x) is defined by the <span className="text-foreground font-medium">height of the logomark</span>. Maintain this minimum spacing on all sides to ensure the logo stands out.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 03. COLOR ARCHITECTURE (Scroll-Linked) */}

                    <HorizontalScrollSection className="z-30">
                        {/* Slide A: Core Identity */}
                        <div className="w-screen h-screen flex flex-col justify-center px-4 md:px-20 relative snap-center overflow-y-auto py-20">
                            <SectionHeader number="03" title="Color Architecture — Core Identity" />
                            <div className="w-full max-w-7xl mx-auto space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <ColorCard
                                        name="Brand Blue"
                                        hex="#2845D6"
                                        bg="bg-brand-500"
                                        text="text-white"
                                        border="border-transparent"
                                    />
                                    <ColorCard
                                        name="Dark Surface"
                                        hex="#0A0A0A"
                                        bg="bg-background"
                                        text="text-foreground"
                                        border="border-border"
                                    />
                                    <ColorCard
                                        name="Light Surface"
                                        hex="#FFFFFF"
                                        bg="bg-white"
                                        text="text-black"
                                        border="border-transparent"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Primary Scale</h3>
                                    <div className="grid grid-cols-5 md:grid-cols-11 gap-2">
                                        {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((step) => (
                                            <PaletteChip
                                                key={step}
                                                shade={step}
                                                // Use calculated hex style instead of class
                                                style={{
                                                    backgroundColor: {
                                                        50: "#EEF2FF",
                                                        100: "#E0E7FF",
                                                        200: "#C7D2FE",
                                                        300: "#A5B4FC",
                                                        400: "#818CF8",
                                                        500: "#2845D6",
                                                        600: "#4F46E5",
                                                        700: "#4338CA",
                                                        800: "#3730A3",
                                                        900: "#312E81",
                                                        950: "#1E1B4B"
                                                    }[step]
                                                }}
                                                text={step > 400 ? "text-white/90" : "text-black/90"}
                                                label={step === 500 ? "Main" : undefined}
                                                hex={{
                                                    50: "#EEF2FF",
                                                    100: "#E0E7FF",
                                                    200: "#C7D2FE",
                                                    300: "#A5B4FC",
                                                    400: "#818CF8",
                                                    500: "#2845D6",
                                                    600: "#4F46E5",
                                                    700: "#4338CA",
                                                    800: "#3730A3",
                                                    900: "#312E81",
                                                    950: "#1E1B4B"
                                                }[step]}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slide C: Neutral Colors */}
                        <div className="w-screen h-screen flex flex-col justify-center px-4 md:px-20 relative snap-center overflow-y-auto py-20">
                            <SectionHeader number="03" title="Color Architecture — Neutral" />
                            <div className="w-full max-w-7xl mx-auto space-y-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Neutral Scale</h3>
                                    <div className="h-px bg-border/50 flex-1"></div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <div className="text-sm font-mono text-muted-foreground">Base Colors</div>
                                        <div className="divide-y divide-white/5 border-t border-b border-white/5">
                                            <CopyableItem label="Background" variable="--background" light="#FFFFFF" dark="#0A0A0A" desc="Main page background" />
                                            <CopyableItem label="Muted" variable="--muted" light="#F4F4F5" dark="#27272A" desc="Subtle backgrounds for sections or containers" />
                                            <CopyableItem label="Secondary" variable="--secondary" light="#F4F4F5" dark="#27272A" desc="Secondary actions and muted elements" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="text-sm font-mono text-muted-foreground">Components</div>
                                        <div className="divide-y divide-white/5 border-t border-b border-white/5">
                                            <CopyableItem label="Border" variable="--border" light="#E4E4E7" dark="#27272A" desc="Used for inputs, dividers, and card borders" />
                                            <CopyableItem label="Accent" variable="--accent" light="#F4F4F5" dark="#27272A" desc="Used for hover states and secondary interactions" />
                                            <CopyableItem label="Popover" variable="--popover" light="#FFFFFF" dark="#0A0A0A" desc="Background for dialogs, tooltips, and dropdowns" />
                                            <CopyableItem label="Card" variable="--card" light="#FFFFFF" dark="#0A0A0A" desc="Background for cards and elevated surfaces" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </HorizontalScrollSection>

                    {/* 04. TYPOGRAPHY (Scroll-Linked) */}
                    <HorizontalScrollSection className="z-40">

                        {/* Slide 1: Primary Font */}
                        <div className="w-screen h-screen flex flex-col justify-center px-8 md:px-20 relative snap-center overflow-y-auto py-20">
                            <SectionHeader number="04" title="Typography — Primary" />
                            <div className="max-w-4xl mx-auto w-full">
                                <div className="pb-4 border-b border-border/20 flex justify-between items-baseline mb-8">
                                    <span className="text-sm font-mono text-muted-foreground">Primary Font</span>
                                    <h3 className="text-2xl font-semibold">Geist Sans</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-end gap-4">
                                        <span className="text-6xl font-bold leading-none font-sans">Aa</span>
                                        <span className="text-sm font-mono text-muted-foreground mb-1">Bold (700)</span>
                                    </div>
                                    <div className="flex items-end gap-4">
                                        <span className="text-6xl font-medium leading-none font-sans">Aa</span>
                                        <span className="text-sm font-mono text-muted-foreground mb-1">Medium (500)</span>
                                    </div>
                                    <div className="space-y-1 pt-4">
                                        <p className="text-2xl font-sans">The quick brown fox jumps over the lazy dog.</p>
                                        <p className="text-lg text-muted-foreground">
                                            Used for all headlines, UI text, and clear communication.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slide 2: Monospace Font */}
                        <div className="w-screen h-screen flex flex-col justify-center px-8 md:px-20 relative snap-center overflow-y-auto py-20">
                            <SectionHeader number="04" title="Typography — Monospace" />
                            <div className="max-w-4xl mx-auto w-full">
                                <div className="pb-4 border-b border-border/20 flex justify-between items-baseline mb-8">
                                    <span className="text-sm font-mono text-muted-foreground">Monospace Font</span>
                                    <h3 className="text-2xl font-mono">Geist Mono</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-end gap-4">
                                        <span className="text-6xl font-mono font-bold leading-none">Aa</span>
                                        <span className="text-sm font-mono text-muted-foreground mb-1">Bold (700)</span>
                                    </div>
                                    <div className="flex items-end gap-4">
                                        <span className="text-6xl font-mono font-medium leading-none">Aa</span>
                                        <span className="text-sm font-mono text-muted-foreground mb-1">Medium (500)</span>
                                    </div>
                                    <div className="space-y-1 pt-4">
                                        <p className="text-2xl font-mono">0123456789</p>
                                        <p className="text-lg text-muted-foreground">
                                            Used for code blocks, data display, and technical details.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slide 3: Scale & Spacing */}
                        <div className="w-screen h-screen flex flex-col justify-center px-8 md:px-20 relative snap-center overflow-y-auto py-20">
                            <div className="max-w-4xl mx-auto w-full pb-8">
                                <SectionHeader number="04" title="Typography — Scale" />
                                <div className="space-y-6">
                                    {/* H1 */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 items-center hover:bg-muted/10 transition-colors rounded-xl">
                                        <div className="md:col-span-3 text-sm font-mono text-muted-foreground">
                                            <div className="font-bold text-foreground mb-1">Geist Sans</div>
                                            <div className="font-semibold text-foreground">H1 Display</div>
                                            <div>text-3xl (30px) / 4xl (36px)</div>
                                        </div>
                                        <div className="md:col-span-9">
                                            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                                                Turn your wallet into identity.
                                            </h1>
                                        </div>
                                    </div>
                                    {/* H2 */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 items-center hover:bg-muted/10 transition-colors rounded-xl">
                                        <div className="md:col-span-3 text-sm font-mono text-muted-foreground">
                                            <div className="font-bold text-foreground mb-1">Geist Sans</div>
                                            <div className="font-semibold text-foreground">H2 Section</div>
                                            <div>text-2xl (24px) / 3xl (30px)</div>
                                        </div>
                                        <div className="md:col-span-9">
                                            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                                                Grow on-chain.
                                            </h2>
                                        </div>
                                    </div>
                                    {/* H3 */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 items-center hover:bg-muted/10 transition-colors rounded-xl">
                                        <div className="md:col-span-3 text-sm font-mono text-muted-foreground">
                                            <div className="font-bold text-foreground mb-1">Geist Sans</div>
                                            <div className="font-semibold text-foreground">H3 Title</div>
                                            <div>text-xl (20px)</div>
                                        </div>
                                        <div className="md:col-span-9">
                                            <h3 className="text-xl font-semibold">
                                                Smart Contract Verification
                                            </h3>
                                        </div>
                                    </div>
                                    {/* Body */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 items-center hover:bg-muted/10 transition-colors rounded-xl">
                                        <div className="md:col-span-3 text-sm font-mono text-muted-foreground">
                                            <div className="font-bold text-foreground mb-1">Geist Sans</div>
                                            <div className="font-semibold text-foreground">Body & Subtext</div>
                                            <div>text-sm (14px) / base (16px)</div>
                                        </div>
                                        <div className="md:col-span-9">
                                            <p className="max-w-xl text-sm text-muted-foreground md:text-base">
                                                Showcase on-chain assets, add links, and share everything as one public page.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </HorizontalScrollSection>

                    {/* 05. NAMING CONVENTION */}
                    {/* 05. NAMING CONVENTION */}
                    <section className="min-h-screen flex flex-col justify-center py-20 sticky top-0 z-50 bg-background overflow-hidden">
                        <SectionHeader number="05" title="Naming Convention" />
                        <div className="space-y-16">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-xl font-semibold mb-4">The Brand Name</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Our name is always written in uppercase with a numeric "4" replacing the "A".
                                            This reflects our roots in Web3 and on-chain intelligence.
                                        </p>
                                    </div>
                                    <div className="p-8 rounded-3xl border border-border/50 bg-muted/10 inline-block font-mono text-5xl tracking-tighter">
                                        SOCI4L
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-xl font-semibold mb-4">Don'ts</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <DontCard title="Do not capitalize only first letter">
                                            <div className="font-mono text-2xl text-muted-foreground line-through decoration-red-500/50">Soci4l</div>
                                        </DontCard>
                                        <DontCard title="Do not use normal 'A'">
                                            <div className="font-mono text-2xl text-white line-through decoration-red-500/50">SOCIAL</div>
                                        </DontCard>
                                        <DontCard title="Do not use lowercase">
                                            <div className="font-mono text-2xl text-muted-foreground line-through decoration-red-500/50">soci4l</div>
                                        </DontCard>
                                        <DontCard title="Do not mix fonts">
                                            <div className="font-sans text-2xl text-muted-foreground line-through decoration-red-500/50 font-bold">SOCI4L</div>
                                        </DontCard>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 06. BUTTONS & COMPONENTS */}
                    <section className="min-h-screen flex flex-col justify-center py-20 sticky top-0 z-[70] bg-background">
                        <SectionHeader number="06" title="Buttons & Components" />
                        <div className="max-w-7xl mx-auto w-full space-y-24">


                            {/* Detailed Specs Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {/* Rounded Rect */}
                                <div className="space-y-6 p-8 bg-black/40 border border-white/5 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-6 left-6 w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="flex items-center justify-center h-32">
                                        <div className="bg-black border border-white/10 rounded-md px-4 py-2 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                                            <span className="text-[10px] font-mono text-white/40">Label</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-base text-foreground">Contrast Rule</h4>
                                        <p className="text-xs text-muted-foreground/60 leading-relaxed">Buttons must contrast perfectly with their background. White button on dark, black button on light.</p>
                                    </div>
                                </div>

                                {/* Brand Color */}
                                <div className="space-y-6 p-8 bg-black/40 border border-white/5 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-6 left-6 w-6 h-6 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                    </div>
                                    <div className="flex items-center justify-center h-32">
                                        <button className="bg-[#2845D6] text-white px-4 py-2 rounded-md text-xs font-medium">
                                            Special
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-base text-foreground">Brand Color</h4>
                                        <p className="text-xs text-muted-foreground/60 leading-relaxed">Use Brand Blue (#2845D6) ONLY for special 'Magic' actions or highlights.</p>
                                    </div>
                                </div>

                                {/* Shadow Usage */}
                                <div className="space-y-6 p-8 bg-black/40 border border-white/5 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-6 left-6 w-6 h-6 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                    </div>
                                    <div className="flex items-center justify-center h-32 relative">
                                        <div className="w-20 h-8 bg-brand-500 rounded-md shadow-[0_10px_20px_-5px_rgba(79,70,229,0.5)] opacity-50"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-base text-foreground">Shadow Usage</h4>
                                        <p className="text-xs text-muted-foreground/60 leading-relaxed">Never use blurred/soft shadows in dark mode. Use crisp borders or simple flat colors.</p>
                                    </div>
                                </div>

                                {/* Radius & Weight */}
                                <div className="space-y-6 p-8 bg-black/40 border border-white/5 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-6 left-6 w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    </div>
                                    <div className="flex items-center justify-center h-32">
                                        <div className="w-10 h-10 border border-dashed border-white/20 rounded-md"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-base text-foreground">Radius & Weight</h4>
                                        <p className="text-xs text-muted-foreground/60 leading-relaxed">Standard Radius: 0.375rem (6px). Font Weight: Medium (500).</p>
                                    </div>
                                </div>
                            </div>

                            {/* Component Library */}
                            <div className="space-y-8 pt-6">
                                <h3 className="text-lg font-semibold text-muted-foreground">Component Library</h3>
                                <div className="w-full overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
                                    <div className="flex gap-8 items-start min-w-max">
                                        <div className="space-y-3">
                                            <button className="bg-white hover:bg-white/90 text-black font-medium h-9 px-4 rounded-md text-sm transition-colors shadow-none">
                                                Default Button
                                            </button>
                                            <div className="text-[10px] font-mono text-muted-foreground/50">variant="default"</div>
                                        </div>
                                        <div className="space-y-3">
                                            <button className="bg-white/5 hover:bg-white/10 text-white font-medium h-9 px-4 rounded-md text-sm border border-white/10 transition-colors">
                                                Secondary
                                            </button>
                                            <div className="text-[10px] font-mono text-muted-foreground/50">variant="secondary"</div>
                                        </div>
                                        <div className="space-y-3">
                                            <button className="bg-transparent hover:bg-white/5 text-white font-medium h-9 px-4 rounded-md text-sm border border-white/20 transition-colors">
                                                Outline
                                            </button>
                                            <div className="text-[10px] font-mono text-muted-foreground/50">variant="outline"</div>
                                        </div>
                                        <div className="space-y-3">
                                            <button className="bg-transparent hover:bg-white/5 text-white font-medium h-9 px-4 rounded-md text-sm transition-colors">
                                                Ghost
                                            </button>
                                            <div className="text-[10px] font-mono text-muted-foreground/50">variant="ghost"</div>
                                        </div>
                                        <div className="space-y-3">
                                            <button className="bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-medium h-9 px-4 rounded-md text-sm border border-red-500/20 transition-colors">
                                                Destructive
                                            </button>
                                            <div className="text-[10px] font-mono text-muted-foreground/50">variant="destructive"</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    {/* 07. SOCIAL MEDIA KITS */}
                    <section className="min-h-screen flex flex-col justify-center py-20 sticky top-0 z-[70] bg-background">
                        <SectionHeader number="07" title="Social Media Kits" />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* X Banner */}
                            <div className="p-1 rounded-3xl border border-border/50 bg-card group overflow-hidden">
                                <div className="aspect-[3/1] rounded-2xl bg-[#0A0A0A] relative flex items-center justify-center overflow-hidden">
                                    <img src="/brand/kits/SOCI4L_X_HEADER.png" alt="SOCI4L X Header" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="p-4 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-medium">X (Twitter) Banner</h4>
                                        <p className="text-xs text-muted-foreground">1500 x 500 px</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                                        <a href="/brand/kits/SOCI4L_X_HEADER.png" download>
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            {/* Profile Frame */}
                            <div className="p-1 rounded-3xl border border-border/50 bg-card group overflow-hidden">
                                <div className="aspect-square rounded-2xl bg-[#FAFAFA] relative flex items-center justify-center overflow-hidden">
                                    <img src="/brand/kits/x_logo.png" alt="Profile Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="p-4 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-medium">Profile Photo</h4>
                                        <p className="text-xs text-muted-foreground">400 x 400 px</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                                        <a href="/brand/kits/x_logo.png" download>
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            {/* Powered by Badge */}
                            <div className="p-1 rounded-3xl border border-border/50 bg-card group overflow-hidden">
                                <div className="aspect-square rounded-2xl bg-[#0A0A0A] border border-white/5 relative flex flex-col items-center justify-center gap-6 overflow-hidden">
                                    <img src="/brand/kits/Black_PoweredBy.png" alt="Powered By Dark" className="w-3/4 object-contain shadow-2xl" />
                                    <img src="/brand/kits/White_PoweredBy.png" alt="Powered By Light" className="w-3/4 object-contain shadow-2xl" />
                                </div>
                                <div className="p-4 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-medium">Community Badges</h4>
                                        <p className="text-xs text-muted-foreground">PNG & SVG Variants</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-foreground" title="Download PNG">
                                                    <FileImage className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="z-[100]">
                                                <DropdownMenuItem asChild>
                                                    <a href="/brand/kits/Black_PoweredBy.png" download className="flex items-center gap-2 cursor-pointer">
                                                        <div className="w-2 h-2 rounded-full bg-black border border-white/20" />
                                                        <span>Dark (PNG)</span>
                                                    </a>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <a href="/brand/kits/White_PoweredBy.png" download className="flex items-center gap-2 cursor-pointer">
                                                        <div className="w-2 h-2 rounded-full bg-white border border-black/10" />
                                                        <span>Light (PNG)</span>
                                                    </a>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-foreground" title="Download SVG">
                                                    <FileCode className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="z-[100]">
                                                <DropdownMenuItem asChild>
                                                    <a href="/brand/kits/Black_PoweredBy.svg" download className="flex items-center gap-2 cursor-pointer">
                                                        <div className="w-2 h-2 rounded-full bg-black border border-white/20" />
                                                        <span>Dark (SVG)</span>
                                                    </a>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <a href="/brand/kits/White_PoweredBy.svg" download className="flex items-center gap-2 cursor-pointer">
                                                        <div className="w-2 h-2 rounded-full bg-white border border-black/10" />
                                                        <span>Light (SVG)</span>
                                                    </a>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-8 rounded-3xl border border-brand-500/20 bg-brand-500/5 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="max-w-xl">
                                <div className="flex items-center gap-2 text-brand-500 mb-2">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                                    </svg>
                                    <span className="font-bold uppercase tracking-widest text-xs">Community Kit</span>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Build your identity everywhere.</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Download the complete Social Media Graphics kit to unify your on-chain and off-chain presence. Includes high-res renders and vector badges.
                                </p>
                            </div>
                            <Button className="bg-brand-500 text-white hover:bg-brand-600 gap-2 px-8 py-6 rounded-2xl" asChild>
                                <a href="/brand/kits/SOCI4L_Community_Kit.zip" download>
                                    <Download className="w-5 h-5" />
                                    Download Complete Kit
                                </a>
                            </Button>
                        </div>
                    </section>



                </motion.div>

                <footer className="mt-20 py-24 border-t border-border/10 text-center">
                    <div className="text-[10px] md:text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground/60 max-w-2xl mx-auto space-y-4">
                        <p>All brand identity assets were meticulously</p>
                        <p>
                            Designed by
                            <a
                                href="https://floyka.space"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-foreground font-semibold hover:text-brand-500 transition-colors ml-2 underline-offset-4 hover:underline"
                            >
                                Floyka Design Studio
                            </a>
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    )
}

function SectionHeader({ number, title }: { number: string, title: string }) {
    return (
        <div className="flex items-end justify-between mb-12 border-b border-border/40 pb-6">
            <h2 className="text-2xl font-mono uppercase tracking-widest text-muted-foreground">
                <span className="text-foreground/80 mr-2">{number}.</span>
                {title}
            </h2>
        </div>
    )
}

function LogoCard({ children, label, bg, textColor, borderColor, downloadLink, downloadName }: any) {
    return (
        <div className={cn("group relative overflow-hidden rounded-3xl border flex flex-col items-center justify-center min-h-[320px] transition-colors", bg, borderColor || "border-white/10")}>
            <div className={cn("absolute top-6 left-6 text-xs font-mono uppercase tracking-wider", textColor)}>{label}</div>
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 transition-opacity">
                <DownloadDropdown downloadLink={downloadLink} downloadName={downloadName} textColor={textColor} />
            </div>
            <div className="relative z-10 transition-transform duration-500 group-hover:scale-105">
                {children}
            </div>
        </div>
    )
}

function DownloadDropdown({ downloadLink, downloadName, textColor }: any) {
    const handlePngDownload = () => {
        downloadAsPng(downloadLink, downloadName)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("h-8 w-8", textColor)}>
                    <Download className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <a href={downloadLink} download={downloadName} className="cursor-pointer flex items-center">
                        <FileCode className="w-4 h-4 mr-2" />
                        Download SVG
                    </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePngDownload} className="cursor-pointer flex items-center">
                    <FileImage className="w-4 h-4 mr-2" />
                    Download PNG
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

const downloadAsPng = (url: string, filename: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 1024;
        let width = img.width;
        let height = img.height;
        if (width === 0 || height === 0) {
            width = size;
            height = size;
        } else {
            const scale = size / Math.max(width, height);
            width *= scale;
            height *= scale;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');
            a.download = filename.replace('.svg', '.png');
            a.click();
        }
    };
    img.onerror = () => {
        toast.error("Failed to generate PNG");
    }
}

// Reusable Copyable Item for Base Colors
// Reusable Copyable Item for Base Colors with Light/Dark split
function CopyableItem({ label, variable, light, dark, desc }: any) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`Copied ${text}`)
    }

    return (
        <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-foreground transition-colors">{label}</div>
                    {desc && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">{desc}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <div className="text-xs font-mono text-muted-foreground/50 hidden sm:block">hsl(var({variable}))</div>
            </div>

            <div className="flex items-center gap-3">
                {/* Light Mode Value */}
                <div
                    onClick={() => copyToClipboard(light)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-black/10 cursor-pointer hover:border-brand-500/50 hover:shadow-sm transition-all group/light"
                    title="Copy Light Mode Value"
                >
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <span className="text-xs font-mono text-black/70 group-hover/light:text-black font-medium">{light}</span>
                </div>

                <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

                {/* Dark Mode Value */}
                <div
                    onClick={() => copyToClipboard(dark)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0A0A0A] border border-white/10 cursor-pointer hover:border-brand-500/50 hover:shadow-sm transition-all group/dark"
                    title="Copy Dark Mode Value"
                >
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span className="text-xs font-mono text-white/70 group-hover/dark:text-white font-medium">{dark}</span>
                </div>
            </div>
        </div>
    )
}

function ColorCard({ name, hex, bg, text, border }: any) {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(hex)
        toast.success(`Copied ${hex}`)
    }

    return (
        <div
            onClick={copyToClipboard}
            className={cn("p-6 rounded-2xl border aspect-square flex flex-col justify-between group transition-transform hover:-translate-y-1 cursor-pointer", bg, text, border || "border-transparent")}
        >
            <div className="text-lg font-medium">{name}</div>
            <div className="space-y-1 flex items-center justify-between">
                <div className="text-sm font-mono opacity-80 uppercase">{hex}</div>
                <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
    )
}

function PaletteChip({ shade, style, text, label, hex }: any) {
    const copyToClipboard = () => {
        if (hex) {
            navigator.clipboard.writeText(hex)
            toast.success(`Copied ${hex}`)
        }
    }

    return (
        <div
            onClick={copyToClipboard}
            className="h-24 rounded-lg flex flex-col items-center justify-center relative group cursor-pointer hover:ring-2 ring-offset-2 ring-brand-500 transition-all"
            style={style}
            title={hex}
        >
            <span className={cn("text-xs font-mono font-medium transition-opacity duration-200 group-hover:opacity-0", text)}>{shade}</span>
            {label && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    {label}
                </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 dark:bg-black/20 rounded-lg">
                <span className={cn("text-[10px] font-mono", text)}>{hex}</span>
            </div>
        </div>
    )
}

function DontCard({ children, title }: any) {
    return (
        <div className="aspect-square rounded-2xl bg-muted/20 border border-border/50 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="relative z-10 p-8 flex items-center justify-center w-full h-full">
                {children}
            </div>
            <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                <X className="w-12 h-12 text-red-500" />
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center text-xs font-mono text-red-500 uppercase tracking-wider z-20">
                {title}
            </div>
        </div>
    )
}

function ButtonSpecs({ children, title, description, bg, dark }: any) {
    return (
        <div className={cn("relative rounded-3xl overflow-hidden border border-border/50 flex flex-col", bg)}>
            <div className="flex-1 flex flex-col items-center justify-center min-h-[240px] relative p-8">
                {children}
            </div>
            <div className={cn("p-6 border-t", dark ? "border-black/5 bg-white" : "border-white/10 bg-[#111]")}>
                <h4 className={cn("font-medium mb-1", dark ? "text-black" : "text-white")}>{title}</h4>
                <p className={cn("text-sm", dark ? "text-zinc-500" : "text-zinc-400")}>{description}</p>
            </div>
        </div>
    )
}

function SpecsOverlay() {
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Spec lines overlay logic could go here, for now simpler implementation */}
        </div>
    )
}

function ButtonRuleCard({ children, title, description, status }: any) {
    const statusColor = {
        correct: "text-green-500",
        warning: "text-amber-500",
        error: "text-red-500",
        info: "text-blue-500"
    }[status as string] || "text-muted-foreground"

    const Icon = {
        correct: Check,
        warning: ShieldAlert,
        error: X,
        info: ArrowRight
    }[status as string] || ArrowRight

    return (
        <div className="p-6 rounded-2xl border border-border/50 bg-card flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-muted/30">
                    <Icon className={cn("w-4 h-4", statusColor)} />
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center py-4">
                {children}
            </div>
            <div>
                <h4 className="font-medium text-sm mb-1">{title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
        </div>
    )
}

// Dynamic horizontal scroll based on children count
function HorizontalScrollSection({ children, className }: { children: ReactNode, className?: string }) {
    const targetRef = useRef<HTMLDivElement>(null)
    const childrenCount = React.Children.count(children)

    const { scrollYProgress } = useScroll({
        target: targetRef,
    })

    // Calculate the translation needed: (total slides - 1) * 100% / total slides
    // But since the container is w-[N * 100%], each slide is 1/N of total width.
    // So we translate by -((N-1)/N) * 100%
    const transformValue = `-${((childrenCount - 1) / childrenCount) * 100}%`
    const x = useTransform(scrollYProgress, [0, 1], ["0%", transformValue])

    return (
        <section
            ref={targetRef}
            className={cn("relative bg-background text-foreground", className)}
            style={{ height: `${childrenCount * 100}vh` }}
        >
            <div className="sticky top-0 h-screen flex items-center overflow-hidden bg-background">
                <motion.div
                    style={{ x, width: `${childrenCount * 100}%` }}
                    className="flex h-full"
                >
                    {children}
                </motion.div>
            </div>
        </section>
    )
}
