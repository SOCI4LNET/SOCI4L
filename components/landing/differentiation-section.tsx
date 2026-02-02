'use client'

import { motion } from 'framer-motion'
import { Layers, Hash, FileCode2, ArrowRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

const DIFFERENTIATORS = [
    {
        title: "Not just links.",
        description: "Static lists are dead. We aggregate your live on-chain reputation and social graph into a living profile.",
        icon: Layers,
        tag: "Evolution"
    },
    {
        title: "Not just a name.",
        description: "A name is just a start. We provide the full identity layer that lives behind it—your achievements and status.",
        icon: Hash,
        tag: "Identity"
    },
    {
        title: "Not an explorer.",
        description: "Raw hex data is for machines. We interpret value for humans, turning complex history into readable milestones.",
        icon: FileCode2,
        tag: "Clarity"
    }
]

export function DifferentiationSection() {
    return (
        <section className="container mx-auto px-4 py-24 relative z-10">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-20 md:text-center max-w-2xl mx-auto">
                    <h2 className="text-sm font-mono uppercase tracking-widest text-primary mb-4">
                        The Standard
                    </h2>
                    <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
                        Defined by what we are <span className="text-muted-foreground">not.</span>
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        We aren't building another aggregation tool. We are building the identity protocol for the next generation of social.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 border-y border-border/10 divide-y md:divide-y-0 md:divide-x divide-border/10 bg-card/5 backdrop-blur-sm">
                    {DIFFERENTIATORS.map((item, index) => (
                        <div key={index} className="group relative p-8 md:p-12 transition-all duration-700 hover:bg-foreground/[0.02]">
                            {/* Hover Noise Texture */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] transition-opacity duration-700" />

                            {/* Top Active Line */}
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out" />

                            <div className="flex flex-col h-full relative z-10">
                                <div className="flex items-center justify-between mb-12">
                                    <div className="p-3 rounded-xl bg-foreground/5 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all duration-500">
                                        <item.icon className="w-6 h-6" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono uppercase tracking-widest font-medium text-muted-foreground group-hover:text-foreground/70 transition-colors">
                                            {item.tag}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 mt-auto">
                                    <h3 className="text-2xl font-medium tracking-tight text-foreground/80 group-hover:text-foreground transition-colors duration-300">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed font-normal group-hover:text-foreground/70 transition-colors duration-300">
                                        {item.description}
                                    </p>
                                </div>

                                {/* Subtle Bottom Decor */}
                                <div className="mt-8 pt-8 border-t border-white/5 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                                    <div className="flex items-center gap-2 text-xs text-primary/80 font-medium">
                                        See the difference <ArrowRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
