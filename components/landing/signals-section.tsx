'use client'

import { motion } from 'framer-motion'
import { BarChart3, Zap, Users, ArrowRight } from 'lucide-react'

const INSIGHTS = [
    {
        title: "Intent Verification",
        value: "Click ≠ Intent",
        description: "We filter noise. Differentiate between a bot, a casual browser, and a verified holder.",
        icon: Zap,
    },
    {
        title: "True Audiences",
        value: "On-chain + Off-chain",
        description: "Unified identity context. Know if they are a whale, a dev, or a collector.",
        icon: Users,
    },
    {
        title: "Deep Analytics",
        value: "Heat & Timing",
        description: "Beyond total counts. Understand session duration, scroll depth, and return rate.",
        icon: BarChart3,
    }
]

export function SignalsSection() {
    return (
        <section className="container mx-auto px-4 py-24 relative z-10">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

                    {/* Left: Typography & Message */}
                    <div className="space-y-8 relative lg:sticky lg:top-32">
                        <div>
                            <h2 className="text-sm font-mono uppercase tracking-widest text-primary mb-4">
                                Deep Insight
                            </h2>
                            <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6 leading-tight">
                                Signals, <br />
                                <span className="text-muted-foreground opacity-40 line-through decoration-border decoration-2">Vanity Metrics.</span>
                            </h3>
                            <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                                Measuring success by "clicks" is outdated. We provide the context of <strong className="text-foreground font-medium">who</strong> and <strong className="text-foreground font-medium">why</strong>.
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 border-l border-border pl-8">
                            <div className="space-y-1">
                                <div className="text-xl font-medium text-foreground">Not just "How many"</div>
                                <div className="text-sm text-muted-foreground">Focus on quality of interaction.</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xl font-medium text-foreground">But "Who and Why"</div>
                                <div className="text-sm text-muted-foreground">Identity-aware analytics.</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Visual Abstraction - Shadcn Style Cards */}
                    <div className="grid gap-4">
                        {INSIGHTS.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="group relative p-8 rounded-xl border border-border/50 bg-card shadow-xl dark:shadow-none hover:border-primary/20 hover:shadow-2xl dark:hover:shadow-none transition-all duration-500"
                            >
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-start justify-between">
                                        <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 text-foreground transition-colors group-hover:bg-primary/5 group-hover:border-primary/20 group-hover:text-primary">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                            <ArrowRight className="w-5 h-5 text-primary" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-widest">{item.title}</div>
                                        <div>
                                            <h4 className="text-xl font-semibold text-foreground mb-2">{item.value}</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed max-w-[90%]">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    )
}
