'use client'

import { Soci4LLogo } from '@/components/logos/soci4l-logo'
import { Button } from '@/components/ui/button'
import { ArrowRight, Download, Check, X, ShieldAlert, Copy } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function BrandPage() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    return (
        <div className="min-h-screen bg-background pt-24 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-3xl mb-24"
                >
                    <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">
                        Brand Guidelines
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Our brand is more than just a logo. It's the visual language that connects us with our community.
                        Follow these guidelines to ensure consistency across all platforms.
                    </p>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-32"
                >

                    {/* 01. LOGOMARK (ICON) */}
                    <section>
                        <SectionHeader number="01" title="Logomark" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <LogoCard
                                label="On Dark Background"
                                bg="bg-[#0A0A0A]"
                                textColor="text-zinc-500"
                                downloadLink="/logos/icon.svg"
                                downloadName="SOCI4L_ICON_WHITE.svg"
                            >
                                {/* Dark BG -> White Logo. Force no filter (white source) */}
                                <Soci4LLogo variant="icon" width={120} className="!invert-0 !filter-none" />
                            </LogoCard>
                            <LogoCard
                                label="On Light Background"
                                bg="bg-[#FAFAFA]"
                                textColor="text-zinc-400"
                                borderColor="border-black/5"
                                downloadLink="/logos/icon-black.svg"
                                downloadName="SOCI4L_ICON_BLACK.svg"
                            >
                                {/* Light BG -> #0A0A0A Logo. 
                                    invert(0.96) transforms White to ~#0A0A0A. */}
                                <div style={{ filter: 'invert(0.96)' }}>
                                    <Soci4LLogo variant="icon" width={120} className="!filter-none" />
                                </div>
                            </LogoCard>
                        </div>

                        {/* Safe Zone */}
                        <div className="mt-8 p-12 rounded-3xl border border-border/50 bg-card overflow-hidden">
                            <h3 className="text-lg font-medium mb-12 text-center md:text-left">Clearspace & Safe Zones</h3>
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="relative inline-flex items-center justify-center">
                                    {/* Safe Zone Box - Calculated as Spacing between Icon & Text (~44% width of 120px = ~53px) */}
                                    <div className="absolute -inset-[53px] border border-brand-500/30 border-dashed rounded-xl bg-brand-500/5">
                                        <div className="absolute top-0 left-0 w-[53px] h-[53px] flex items-center justify-center border-r border-b border-brand-500/20">
                                            <span className="text-sm font-mono text-brand-500 font-bold">x</span>
                                        </div>
                                    </div>

                                    {/* Logo Width 120px */}
                                    <Soci4LLogo variant="icon" width={120} className="relative z-10 !invert-0 dark:!invert-0" />

                                    {/* Measurement Indicator */}
                                    <div className="absolute -right-32 top-0 bottom-0 flex items-center">
                                        <div className="h-[120px] border-l-2 border-brand-500/40 w-4"></div>
                                        <span className="text-xs font-mono text-muted-foreground ml-2">x = Gap</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-16 text-center max-w-lg mx-auto leading-relaxed">
                                The Clearspace (x) is defined by the <strong>spacing between the logomark and wordmark</strong>.
                                Keep this area free from other elements to ensure maximum visibility and impact.
                            </p>
                        </div>
                    </section>

                    {/* 02. COMBINATION MARK */}
                    <section>
                        <SectionHeader number="02" title="Combination Mark" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <LogoCard
                                label="On Dark Background"
                                bg="bg-[#0A0A0A]"
                                textColor="text-zinc-500"
                                downloadLink="/logos/combination.svg"
                                downloadName="SOCI4L_COMBINATION_WHITE.svg"
                            >
                                <Soci4LLogo variant="combination" width={240} className="!invert-0 !filter-none" />
                            </LogoCard>
                            <LogoCard
                                label="On Light Background"
                                bg="bg-[#FAFAFA]"
                                textColor="text-zinc-400"
                                borderColor="border-black/5"
                                downloadLink="/logos/combination-black.svg"
                                downloadName="SOCI4L_COMBINATION_BLACK.svg"
                            >
                                <div style={{ filter: 'invert(0.96)' }}>
                                    <Soci4LLogo variant="combination" width={240} className="!filter-none" />
                                </div>
                            </LogoCard>
                        </div>
                    </section>

                    {/* 03. COLORS */}
                    <section>
                        <SectionHeader number="03" title="Color Architecture" />

                        {/* Primary Colors */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <ColorCard
                                name="Brand Blue"
                                hex="#2845D6"
                                bg="bg-brand-500"
                                text="text-white"
                            />
                            <ColorCard
                                name="Dark Surface"
                                hex="#0A0A0A"
                                bg="bg-[#0A0A0A]"
                                text="text-white"
                                border="border-white/10"
                            />
                            <ColorCard
                                name="Light Surface"
                                hex="#FAFAFA"
                                bg="bg-[#FAFAFA]"
                                text="text-black"
                                border="border-black/5"
                            />
                        </div>

                        {/* Palette Scale */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Extended Palette</h3>
                                <span className="text-xs text-muted-foreground/60 hidden md:inline-block">Click to copy HEX</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
                                <PaletteChip shade="50" hex="#F5F7FF" color="bg-brand-50" text="text-brand-900" />
                                <PaletteChip shade="100" hex="#E6EBFF" color="bg-brand-100" text="text-brand-900" />
                                <PaletteChip shade="200" hex="#CEDBFF" color="bg-brand-200" text="text-brand-900" />
                                <PaletteChip shade="300" hex="#9EB6FF" color="bg-brand-300" text="text-brand-900" />
                                <PaletteChip shade="400" hex="#5C7CFF" color="bg-brand-400" text="text-white" />
                                <PaletteChip shade="500" hex="#2845D6" color="bg-brand-500" text="text-white" label="Main" />
                                <PaletteChip shade="600" hex="#1E34A8" color="bg-brand-600" text="text-white" />
                                <PaletteChip shade="700" hex="#16267D" color="bg-brand-700" text="text-white" />
                                <PaletteChip shade="800" hex="#101B59" color="bg-brand-800" text="text-white" />
                                <PaletteChip shade="900" hex="#0A1138" color="bg-brand-900" text="text-white" />
                            </div>
                        </div>
                    </section>

                    {/* 04. TYPOGRAPHY */}
                    <section>
                        <SectionHeader number="04" title="Typography" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="pb-4 border-b border-border/20 flex justify-between items-baseline">
                                    <span className="text-sm font-mono text-muted-foreground">Primary Font</span>
                                    <h3 className="text-2xl font-semibold">Geist Sans</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-end gap-4">
                                        <span className="text-6xl font-bold leading-none font-sans">Aa</span>
                                        <span className="text-sm font-mono text-muted-foreground mb-1">Bold</span>
                                    </div>
                                    <div className="flex items-end gap-4">
                                        <span className="text-6xl font-medium leading-none font-sans">Aa</span>
                                        <span className="text-sm font-mono text-muted-foreground mb-1">Medium</span>
                                    </div>
                                    <div className="space-y-1 pt-4">
                                        <p className="text-2xl font-sans">The quick brown fox jumps over the lazy dog.</p>
                                        <p className="text-lg text-muted-foreground">
                                            Used for all headlines, UI text, and clear communication.
                                            Designed for readability and modern aesthetics.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="pb-4 border-b border-border/20 flex justify-between items-baseline">
                                    <span className="text-sm font-mono text-muted-foreground">Monospace Font</span>
                                    <h3 className="text-2xl font-mono">Geist Mono</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-end gap-4">
                                        <span className="text-6xl font-medium leading-none font-mono">Aa</span>
                                        <span className="text-sm font-mono text-muted-foreground mb-1">Regular</span>
                                    </div>
                                    <div className="space-y-4 pt-4">
                                        <p className="font-mono text-lg leading-relaxed">
                                            0123456789 { } [] () / * & % $ # @ !
                                        </p>
                                        <div className="font-mono text-sm text-foreground bg-muted/30 p-4 rounded-lg border border-border/50">
                                            <span className="opacity-50">// Example Usage</span>
                                            <br />
                                            <span className="text-brand-500">npm</span> install soci4l@latest
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Used for data visualization, code snippets, addresses, and technical details.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 05. DON'Ts */}
                    <section>
                        <SectionHeader number="05" title="Usage Violations" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            <DontCard title="Do not distort">
                                <div className="scale-x-125 origin-left">
                                    <Soci4LLogo variant="icon" width={60} className="invert dark:invert-0" />
                                </div>
                            </DontCard>
                            <DontCard title="Do not rotate">
                                <div className="-rotate-12">
                                    <Soci4LLogo variant="icon" width={60} className="invert dark:invert-0" />
                                </div>
                            </DontCard>
                            <DontCard title="Do not change color">
                                <div className="text-red-500 filter sepia saturate-200">
                                    <Soci4LLogo variant="icon" width={60} className="" />
                                </div>
                            </DontCard>
                            <DontCard title="Avoid low contrast">
                                <div className="bg-zinc-800 p-4 rounded flex items-center justify-center w-full h-full">
                                    <div className="opacity-30">
                                        <Soci4LLogo variant="icon" width={60} className="invert-0" />
                                    </div>
                                </div>
                            </DontCard>
                        </div>
                    </section>

                    {/* 06. UI COMPONENTS & BUTTONS */}
                    <section>
                        <SectionHeader number="06" title="Buttons & Components" />

                        {/* Button Guidelines */}
                        <div className="space-y-16">

                            {/* Primary & Secondary */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <ButtonSpecs
                                    title="Primary (Light)"
                                    description="Used for main calls-to-action on dark backgrounds. Strict black text."
                                    bg="bg-[#0A0A0A]"
                                >
                                    <Button size="default" className="bg-white text-black hover:bg-white/90">
                                        <div className="w-4 h-4 mr-2 bg-black/10 rounded-full" />
                                        Primary Action
                                    </Button>
                                    <SpecsOverlay />
                                </ButtonSpecs>

                                <ButtonSpecs
                                    title="Primary (Dark)"
                                    description="Used for main calls-to-action on light backgrounds. Strict white text."
                                    bg="bg-[#FAFAFA]"
                                    dark
                                >
                                    <Button size="default" className="bg-black text-white hover:bg-black/90">
                                        <div className="w-4 h-4 mr-2 bg-white/20 rounded-full" />
                                        Primary Action
                                    </Button>
                                    <SpecsOverlay />
                                </ButtonSpecs>
                            </div>

                            {/* Rules */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <ButtonRuleCard
                                    title="Contrast Rule"
                                    status="correct"
                                    description="Always use High Contrast. White Button = Black Text. Black Button = White Text."
                                >
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1 bg-white text-black text-xs font-medium rounded">Correct</div>
                                        <div className="px-3 py-1 bg-white text-blue-600 text-xs font-medium rounded border border-blue-200/20 opacity-50 relative overflow-hidden">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-full h-px bg-red-500 rotate-12" />
                                            </div>
                                            Wrong
                                        </div>
                                    </div>
                                </ButtonRuleCard>

                                <ButtonRuleCard
                                    title="Brand Color"
                                    status="warning"
                                    description="Use Brand Blue (#2845D6) ONLY for special 'Magic' actions or highlights."
                                >
                                    <Button size="sm" className="bg-brand-500 text-white hover:bg-brand-600 h-8 text-xs">
                                        ✨ Special
                                    </Button>
                                </ButtonRuleCard>

                                <ButtonRuleCard
                                    title="Radius & Weight"
                                    status="info"
                                    description="Standard Radius: 0.5rem (8px). Font Weight: Medium (500)."
                                >
                                    <div className="w-8 h-8 rounded-lg border-2 border-dashed border-brand-500/50" />
                                </ButtonRuleCard>

                                <ButtonRuleCard
                                    title="Padding"
                                    status="info"
                                    description="Horizontal: px-4 (16px). Vertical: py-2 (8px). Gap: 8px."
                                >
                                    <div className="h-6 w-12 border-x-2 border-brand-500/50 flex items-center justify-center">
                                        <span className="text-[10px] font-mono mx-1">16px</span>
                                    </div>
                                </ButtonRuleCard>
                            </div>

                            {/* Button Variants */}
                            <div className="p-8 rounded-3xl border border-border/50 bg-card">
                                <h3 className="text-lg font-medium mb-8">Component Library</h3>
                                <div className="flex flex-wrap gap-8 items-center">
                                    <div className="space-y-2 text-center">
                                        <Button variant="default">Default Button</Button>
                                        <p className="text-xs font-mono text-muted-foreground">variant="default"</p>
                                    </div>
                                    <div className="space-y-2 text-center">
                                        <Button variant="secondary">Secondary</Button>
                                        <p className="text-xs font-mono text-muted-foreground">variant="secondary"</p>
                                    </div>
                                    <div className="space-y-2 text-center">
                                        <Button variant="outline">Outline</Button>
                                        <p className="text-xs font-mono text-muted-foreground">variant="outline"</p>
                                    </div>
                                    <div className="space-y-2 text-center">
                                        <Button variant="ghost">Ghost</Button>
                                        <p className="text-xs font-mono text-muted-foreground">variant="ghost"</p>
                                    </div>
                                    <div className="space-y-2 text-center">
                                        <Button variant="destructive">Destructive</Button>
                                        <p className="text-xs font-mono text-muted-foreground">variant="destructive"</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </section>

                </motion.div>
            </div>
        </div>
    )
}

function SectionHeader({ number, title }: { number: string, title: string }) {
    return (
        <div className="flex items-end justify-between mb-12 border-b border-border/40 pb-6">
            <h2 className="text-2xl font-mono uppercase tracking-widest text-muted-foreground">
                <span className="text-brand-500 mr-2">{number}.</span>
                {title}
            </h2>
        </div>
    )
}

function LogoCard({ children, label, bg, textColor, borderColor, downloadLink, downloadName }: any) {
    return (
        <div className={cn("group relative overflow-hidden rounded-3xl border flex flex-col items-center justify-center min-h-[320px] transition-colors", bg, borderColor || "border-white/10")}>
            <div className={cn("absolute top-6 left-6 text-xs font-mono uppercase tracking-wider", textColor)}>{label}</div>
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" asChild className={cn("h-8 w-8", textColor)}>
                    <a href={downloadLink} download={downloadName || true}>
                        <Download className="w-4 h-4" />
                    </a>
                </Button>
            </div>
            <div className="relative z-10 transition-transform duration-500 group-hover:scale-105">
                {children}
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

function PaletteChip({ shade, color, text, label, hex }: any) {
    const copyToClipboard = () => {
        if (hex) {
            navigator.clipboard.writeText(hex)
            toast.success(`Copied ${hex}`)
        }
    }

    return (
        <div
            onClick={copyToClipboard}
            className={cn("h-24 rounded-lg flex flex-col items-center justify-center relative group cursor-pointer hover:ring-2 ring-offset-2 ring-brand-500 transition-all", color)}
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
                <div className={cn("p-2 rounded-lg bg-muted/30", statusColor)}>
                    <Icon className="w-4 h-4" />
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
