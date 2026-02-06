'use client'

import { Soci4LLogo } from '@/components/logos/soci4l-logo'
import { Button } from '@/components/ui/button'
import { ArrowRight, Download, Check, X, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

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

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
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
                                label="Icon Dark"
                                bg="bg-[#0A0A0A]"
                                textColor="text-zinc-500"
                                downloadLink="/logos/icon.svg"
                            >
                                <Soci4LLogo variant="icon" width={120} className="invert-0" />
                            </LogoCard>
                            <LogoCard
                                label="Icon Light"
                                bg="bg-[#FAFAFA]"
                                textColor="text-zinc-400"
                                borderColor="border-black/5"
                                downloadLink="/logos/icon.svg"
                            >
                                <Soci4LLogo variant="icon" width={120} className="invert" />
                            </LogoCard>
                        </div>

                        {/* Safe Zone */}
                        <div className="mt-8 p-8 md:p-12 rounded-3xl border border-border/50 bg-card overflow-hidden">
                            <h3 className="text-lg font-medium mb-8">Clearspace & Safe Zones</h3>
                            <div className="flex flex-col md:flex-row gap-12 items-center justify-center py-8">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-brand-500/10 -m-8 border border-brand-500/20 border-dashed rounded-lg flex items-start justify-start">
                                        <span className="text-[10px] font-mono text-brand-500 p-1">x</span>
                                    </div>
                                    <Soci4LLogo variant="icon" width={120} className="relative z-10 invert dark:invert-0" />
                                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center border-l border-brand-500/30">
                                        <span className="text-xs font-mono text-muted-foreground rotate-90 whitespace-nowrap">x = width</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-12 text-center max-w-md mx-auto">
                                Maintain a minimum clearspace equivalent to the width of the logo icon.
                            </p>
                        </div>
                    </section>

                    {/* 02. COMBINATION MARK */}
                    <section>
                        <SectionHeader number="02" title="Combination Mark" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <LogoCard
                                label="Primary Dark"
                                bg="bg-[#0A0A0A]"
                                textColor="text-zinc-500"
                                downloadLink="/logos/combination.svg"
                            >
                                <Soci4LLogo variant="combination" width={240} className="invert-0" />
                            </LogoCard>
                            <LogoCard
                                label="Primary Light"
                                bg="bg-[#FAFAFA]"
                                textColor="text-zinc-400"
                                borderColor="border-black/5"
                                downloadLink="/logos/combination.svg"
                            >
                                <Soci4LLogo variant="combination" width={240} className="invert" />
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
                            <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Extended Palette</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
                                <PaletteChip shade="50" color="bg-brand-50" text="text-brand-900" />
                                <PaletteChip shade="100" color="bg-brand-100" text="text-brand-900" />
                                <PaletteChip shade="200" color="bg-brand-200" text="text-brand-900" />
                                <PaletteChip shade="300" color="bg-brand-300" text="text-brand-900" />
                                <PaletteChip shade="400" color="bg-brand-400" text="text-white" />
                                <PaletteChip shade="500" color="bg-brand-500" text="text-white" label="Main" />
                                <PaletteChip shade="600" color="bg-brand-600" text="text-white" />
                                <PaletteChip shade="700" color="bg-brand-700" text="text-white" />
                                <PaletteChip shade="800" color="bg-brand-800" text="text-white" />
                                <PaletteChip shade="900" color="bg-brand-900" text="text-white" />
                            </div>
                        </div>
                    </section>

                    {/* 04. TYPOGRAPHY */}
                    <section>
                        <SectionHeader number="04" title="Typography" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="pb-4 border-b border-border/20 flex justify-between items-baseline">
                                    <span className="text-sm font-mono text-muted-foreground">Heading Font</span>
                                    <h3 className="text-2xl font-semibold">Outfit</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-end gap-4">
                                        <span className="text-6xl font-bold leading-none">Aa</span>
                                        <span className="text-sm font-mono text-muted-foreground mb-1">Bold</span>
                                    </div>
                                    <div className="flex items-end gap-4">
                                        <span className="text-6xl font-medium leading-none">Aa</span>
                                        <span className="text-sm font-mono text-muted-foreground mb-1">Medium</span>
                                    </div>
                                    <p className="text-lg text-muted-foreground pt-4">
                                        Used for all headlines, major UI elements, and calls to action.
                                        It conveys modernity and approachability.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="pb-4 border-b border-border/20 flex justify-between items-baseline">
                                    <span className="text-sm font-mono text-muted-foreground">Body / Mono Font</span>
                                    <h3 className="text-2xl font-mono">Geist Mono</h3>
                                </div>
                                <div className="space-y-4">
                                    <p className="font-mono text-lg leading-relaxed">
                                        The quick brown fox jumps over the lazy dog.
                                        1234567890
                                    </p>
                                    <div className="font-mono text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                                        function Brand() {'{'}
                                        <br />&nbsp;&nbsp;return "Precision";
                                        <br />{'}'}
                                    </div>
                                    <p className="text-sm text-muted-foreground pt-4">
                                        Used for data visualization, code snippets, and technical details.
                                    </p>
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

function LogoCard({ children, label, bg, textColor, borderColor, downloadLink }: any) {
    return (
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            className={cn("group relative overflow-hidden rounded-3xl border flex flex-col items-center justify-center min-h-[320px] transition-colors", bg, borderColor || "border-white/10")}
        >
            <div className={cn("absolute top-6 left-6 text-xs font-mono uppercase tracking-wider", textColor)}>{label}</div>
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" asChild className={cn("h-8 w-8", textColor)}>
                    <a href={downloadLink} download>
                        <Download className="w-4 h-4" />
                    </a>
                </Button>
            </div>
            <div className="relative z-10 transition-transform duration-500 group-hover:scale-105">
                {children}
            </div>
        </motion.div>
    )
}

function ColorCard({ name, hex, bg, text, border }: any) {
    return (
        <div className={cn("p-6 rounded-2xl border aspect-square flex flex-col justify-between group transition-transform hover:-translate-y-1", bg, text, border || "border-transparent")}>
            <div className="text-lg font-medium">{name}</div>
            <div className="space-y-1">
                <div className="text-sm font-mono opacity-80 uppercase">{hex}</div>
            </div>
        </div>
    )
}

function PaletteChip({ shade, color, text, label }: any) {
    return (
        <div className={cn("h-24 rounded-lg flex flex-col items-center justify-center relative group cursor-default", color)}>
            <span className={cn("text-xs font-mono font-medium", text)}>{shade}</span>
            {label && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {label}
                </div>
            )}
        </div>
    )
}

function DontCard({ children, title }: any) {
    return (
        <div className="aspect-square rounded-2xl bg-muted/20 border border-border/50 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="relative z-10 p-8 flex items-center justify-center w-full h-full">
                {children}
            </div>
            <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <X className="w-12 h-12 text-red-500" />
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center text-xs font-mono text-red-500 uppercase tracking-wider">
                {title}
            </div>
        </div>
    )
}
