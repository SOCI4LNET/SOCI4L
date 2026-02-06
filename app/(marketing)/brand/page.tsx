'use client'

import { Soci4LLogo } from '@/components/logos/soci4l-logo'
import { Button } from '@/components/ui/button'
import { ArrowRight, Download, Check, X, ShieldAlert, Copy, Sparkles, MoreVertical, FileImage, FileCode, ArrowUpRight, LayoutDashboard, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"

export default function BrandPage() {
    const [isTypeHierarchyOpen, setIsTypeHierarchyOpen] = useState(false)

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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
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
                                {/* Direct Black Logo for perfect sizing/rendering */}
                                <img src="/logos/icon-black.svg" width={120} height={120} alt="SOCI4L Icon Black" className="object-contain" />
                            </LogoCard>
                        </div>

                        {/* Safe Zone */}
                        {/* Safe Zone */}
                        <div className="mt-8 p-12 rounded-3xl border border-border/50 bg-card overflow-hidden relative">
                            {/* Grid Background */}
                            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" style={{ backgroundSize: '24px 24px' }}></div>

                            <h3 className="text-lg font-medium mb-12 text-center md:text-left relative z-10">Clearspace & Safe Zones</h3>

                            <div className="flex flex-col items-center justify-center py-12 relative z-10">
                                <div className="relative inline-flex items-center justify-center">
                                    {/* Safe Zone Box - Dashed Boundary */}
                                    <div className="absolute -inset-[36px] border border-brand-500/30 border-dashed rounded-xl bg-brand-500/5">
                                        {/* Top Marker */}
                                        <div className="absolute -top-[36px] left-1/2 -translate-x-1/2 h-[36px] w-px bg-brand-500/20 flex items-center justify-center">
                                            <span className="bg-card px-1 text-[10px] font-mono text-brand-500 font-bold">x</span>
                                        </div>
                                        {/* Bottom Marker */}
                                        <div className="absolute -bottom-[36px] left-1/2 -translate-x-1/2 h-[36px] w-px bg-brand-500/20 flex items-center justify-center">
                                            <span className="bg-card px-1 text-[10px] font-mono text-brand-500 font-bold">x</span>
                                        </div>
                                        {/* Left Marker */}
                                        <div className="absolute top-1/2 -left-[36px] -translate-y-1/2 w-[36px] h-px bg-brand-500/20 flex items-center justify-center">
                                            <span className="bg-card px-1 text-[10px] font-mono text-brand-500 font-bold">x</span>
                                        </div>
                                        {/* Right Marker */}
                                        <div className="absolute top-1/2 -right-[36px] -translate-y-1/2 w-[36px] h-px bg-brand-500/20 flex items-center justify-center">
                                            <span className="bg-card px-1 text-[10px] font-mono text-brand-500 font-bold">x</span>
                                        </div>
                                    </div>

                                    {/* Logo Combination Mark */}
                                    <Soci4LLogo variant="combination" width={180} className="relative z-10 !invert-0 dark:!invert-0" />
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-16 text-center max-w-lg mx-auto leading-relaxed relative z-10">
                                The Clearspace (x) is defined by the <strong>height of the logomark</strong>.
                                Maintain this minimum spacing on all sides to ensure the logo stands out.
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
                                <img src="/logos/combination-black.svg" width={240} height={72} alt="SOCI4L Combination Black" className="object-contain" />
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

                        {/* Neutrals */}
                        <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-4">Neutrals & UI</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <ColorCard
                                name="Muted / Card"
                                hex="#F5F5F5"
                                bg="bg-zinc-100"
                                text="text-zinc-900"
                                border="border-black/5"
                            />
                            <ColorCard
                                name="Subtle Muted"
                                hex="#FAFAFA"
                                bg="bg-zinc-50"
                                text="text-zinc-900"
                                border="border-black/5"
                            />
                            <ColorCard
                                name="Dark Muted"
                                hex="#18181B"
                                bg="bg-zinc-900"
                                text="text-white"
                                border="border-white/10"
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

                        <div className="space-y-12">
                            {/* Font Families */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className="pb-4 border-b border-border/20 flex justify-between items-baseline">
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

                                <div className="space-y-8">
                                    <div className="pb-4 border-b border-border/20 flex justify-between items-baseline">
                                        <span className="text-sm font-mono text-muted-foreground">Monospace Font</span>
                                        <h3 className="text-2xl font-mono">Geist Mono</h3>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-end gap-4">
                                            <span className="text-6xl font-medium leading-none font-mono">Aa</span>
                                            <span className="text-sm font-mono text-muted-foreground mb-1">Regular (400)</span>
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
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Type Scale & Hierarchy - Collapsible */}
                            <Collapsible
                                open={isTypeHierarchyOpen}
                                onOpenChange={setIsTypeHierarchyOpen}
                                className="rounded-3xl border border-border/50 bg-card overflow-hidden transition-all duration-300"
                            >
                                <div className="p-8 border-b border-border/10 bg-muted/20 flex justify-between items-center sticky top-0 z-10">
                                    <div>
                                        <h3 className="text-lg font-medium">Type Hierarchy (Web)</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Global font sizes for landing pages and dashboard.</p>
                                    </div>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="sm" className="w-9 p-0 hover:bg-black/5 hover:text-foreground">
                                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isTypeHierarchyOpen ? "rotate-180" : "")} />
                                            <span className="sr-only">Toggle</span>
                                        </Button>
                                    </CollapsibleTrigger>
                                </div>
                                <CollapsibleContent>
                                    <div className="divide-y divide-border/10">

                                        {/* H1 */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-8 items-center hover:bg-muted/10 transition-colors">
                                            <div className="md:col-span-3 text-sm font-mono text-muted-foreground">
                                                <div className="font-bold text-foreground">H1 Display</div>
                                                <div>text-4xl (MD) / text-3xl (SM)</div>
                                                <div className="opacity-60">36px / 30px</div>
                                                <div className="text-brand-500 mt-2">Weight: Semibold (600)</div>
                                            </div>
                                            <div className="md:col-span-9">
                                                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                                                    Turn your Avalanche wallet into a measurable public identity.
                                                </h1>
                                            </div>
                                        </div>

                                        {/* H2 */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-8 items-center hover:bg-muted/10 transition-colors">
                                            <div className="md:col-span-3 text-sm font-mono text-muted-foreground">
                                                <div className="font-bold text-foreground">H2 Section</div>
                                                <div>text-3xl (MD) / text-2xl (SM)</div>
                                                <div className="opacity-60">30px / 24px</div>
                                                <div className="text-brand-500 mt-2">Weight: Semibold (600)</div>
                                            </div>
                                            <div className="md:col-span-9">
                                                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                                                    Everything you need to grow on-chain.
                                                </h2>
                                            </div>
                                        </div>

                                        {/* H3 */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-8 items-center hover:bg-muted/10 transition-colors">
                                            <div className="md:col-span-3 text-sm font-mono text-muted-foreground">
                                                <div className="font-bold text-foreground">H3 Card Title</div>
                                                <div>text-xl</div>
                                                <div className="opacity-60">20px</div>
                                                <div className="text-brand-500 mt-2">Weight: Semibold (600)</div>
                                            </div>
                                            <div className="md:col-span-9">
                                                <h3 className="text-xl font-semibold">
                                                    Smart Contract Verification
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Body Lead */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-8 items-center hover:bg-muted/10 transition-colors">
                                            <div className="md:col-span-3 text-sm font-mono text-muted-foreground">
                                                <div className="font-bold text-foreground">Body Large</div>
                                                <div>text-base</div>
                                                <div className="opacity-60">16px</div>
                                                <div className="text-brand-500 mt-2">Weight: Regular (400)</div>
                                            </div>
                                            <div className="md:col-span-9">
                                                <p className="text-base text-muted-foreground">
                                                    Showcase on-chain assets, add links, and share everything as one public page with full control and built-in insights.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Body Default */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-8 items-center hover:bg-muted/10 transition-colors">
                                            <div className="md:col-span-3 text-sm font-mono text-muted-foreground">
                                                <div className="font-bold text-foreground">Body Default</div>
                                                <div>text-sm</div>
                                                <div className="opacity-60">14px</div>
                                                <div className="text-brand-500 mt-2">Weight: Regular (400)</div>
                                            </div>
                                            <div className="md:col-span-9">
                                                <p className="text-sm text-muted-foreground">
                                                    Standard text used for descriptions, card content, and general UI elements.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Caption / Label */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-8 items-center hover:bg-muted/10 transition-colors">
                                            <div className="md:col-span-3 text-sm font-mono text-muted-foreground">
                                                <div className="font-bold text-foreground">Caption / Label</div>
                                                <div>text-xs</div>
                                                <div className="opacity-60">12px</div>
                                                <div className="text-brand-500 mt-2">Weight: Medium (500)</div>
                                            </div>
                                            <div className="md:col-span-9">
                                                <div className="flex gap-4">
                                                    <span className="text-xs text-muted-foreground uppercase tracking-widest">Uppercase Label</span>
                                                    <span className="text-xs font-medium px-2 py-1 bg-muted rounded">Badge Text</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Spacing Guide */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 p-8 border-t border-border/10">
                                        <div className="p-8 rounded-3xl border border-border/50 bg-card">
                                            <div className="flex items-center gap-2 mb-6">
                                                <ArrowUpRight className="w-5 h-5 text-brand-500" />
                                                <h3 className="font-medium">Headings Spacing</h3>
                                            </div>
                                            <div className="bg-muted/30 rounded-xl p-6 border border-border/50 space-y-2 relative">
                                                <div className="h-4 w-32 bg-brand-500/20 rounded"></div>
                                                {/* Spacing indicator */}
                                                <div className="h-3 w-full flex items-center justify-center">
                                                    <div className="h-px bg-red-400 w-full relative">
                                                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-red-500 font-mono">12px (space-y-3)</span>
                                                    </div>
                                                </div>
                                                <div className="h-2 w-full bg-zinc-500/20 rounded"></div>
                                                <div className="h-2 w-4/5 bg-zinc-500/20 rounded"></div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-4">
                                                Standard vertical spacing between Headings and Description text is <strong>12px</strong> (`space-y-3` or `gap-3`).
                                            </p>
                                        </div>

                                        <div className="p-8 rounded-3xl border border-border/50 bg-card">
                                            <div className="flex items-center gap-2 mb-6">
                                                <LayoutDashboard className="w-5 h-5 text-brand-500" />
                                                <h3 className="font-medium">Section Spacing</h3>
                                            </div>
                                            <div className="space-y-8 bg-muted/10 p-6 rounded-xl border border-dashed border-border/50">
                                                <div className="h-8 bg-card border border-border rounded flex items-center justify-center text-[10px] text-muted-foreground">Section A</div>
                                                <div className="h-8 flex items-center justify-center">
                                                    <span className="text-xs font-mono text-brand-500">gap-24 (96px)</span>
                                                </div>
                                                <div className="h-8 bg-card border border-border rounded flex items-center justify-center text-[10px] text-muted-foreground">Section B</div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-4">
                                                Major sections on landing pages are separated by <strong>96px</strong> (`gap-24` or `py-24`) to give content room to breathe.
                                            </p>
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
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
                                        <div className="px-3 py-1 bg-white text-zinc-300 text-xs font-medium rounded border border-zinc-200/20 opacity-50 relative overflow-hidden">
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
                                        <Sparkles className="w-3 h-3 mr-2" /> Special
                                    </Button>
                                </ButtonRuleCard>

                                <ButtonRuleCard
                                    title="Radius & Weight"
                                    status="info"
                                    description="Standard Radius: 0.5rem (8px). Font Weight: Medium (500)."
                                >
                                    <div className="w-8 h-8 rounded-lg border-2 border-dashed border-zinc-400/50" />
                                </ButtonRuleCard>

                                <ButtonRuleCard
                                    title="Padding"
                                    status="info"
                                    description="Horizontal: px-4 (16px). Vertical: py-2 (8px). Gap: 8px."
                                >
                                    <div className="h-6 w-12 border-x-2 border-zinc-400/50 flex items-center justify-center">
                                        <span className="text-[10px] font-mono mx-1 text-zinc-500">16px</span>
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
            </div >
        </div >
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
        // Standardize size for consistent quality. 
        // 1024px is good for logos.
        const size = 1024;
        let width = img.width;
        let height = img.height;

        // If SVG doesn't have intrinsic size, default to square relative to 1024
        if (width === 0 || height === 0) {
            width = size;
            height = size;
        } else {
            // Keep aspect ratio
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
