'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Code2, PenTool, Users, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function UseCaseSection() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    const cases = [
        {
            title: 'Builders',
            icon: Code2,
            description: 'Share one profile instead of explaining your wallet every time.',
            keywords: 'Grants · Demos · Products',
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'group-hover:border-emerald-500/50',
            cta: 'See how builders use SOCI4L'
        },
        {
            title: 'Creators',
            icon: PenTool,
            description: 'Share one profile instead of explaining your wallet every time.',
            keywords: 'Links · Socials · NFTs',
            color: 'text-pink-500',
            bgColor: 'bg-pink-500/10',
            borderColor: 'group-hover:border-pink-500/50',
            cta: 'View example profile'
        },
        {
            title: 'DAOs / Teams',
            icon: Users,
            description: 'Share one profile instead of explaining your wallet every time.',
            keywords: 'Members · Governance · Resources',
            color: 'text-sky-500',
            bgColor: 'bg-sky-500/10',
            borderColor: 'group-hover:border-sky-500/50',
            cta: 'View team profile'
        },
    ]

    return (
        <section className="container mx-auto px-4 py-24 space-y-12 relative">
            {/* Subtle Gradient Divider */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

            <div className="text-center space-y-4">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-semibold tracking-tight sm:text-4xl text-foreground"
                >
                    Who is this for?
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-muted-foreground text-lg"
                >
                    Is this for me? <br className="sm:hidden" />
                    <span className="text-foreground/80">Probably, if you have a wallet.</span>
                </motion.p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
                {cases.map((item, index) => {
                    const isHovered = hoveredIndex === index
                    const isAnyHovered = hoveredIndex !== null

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className="h-full"
                            animate={{
                                scale: isHovered ? 1.05 : isAnyHovered ? 0.95 : 1,
                                opacity: isAnyHovered && !isHovered ? 0.6 : 1,
                                filter: isAnyHovered && !isHovered ? 'blur(2px)' : 'blur(0px)',
                            }}
                        >
                            <Card className={cn(
                                "group relative h-full overflow-hidden transition-all duration-500",
                                "bg-card/40 border-border/60 hover:bg-card/80",
                                item.borderColor
                            )}>
                                {/* Hover Glow Effect */}
                                <div className={cn(
                                    "absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                                    "bg-gradient-to-br from-transparent via-transparent to-primary/5"
                                )} />

                                <CardHeader className="relative flex flex-col items-center gap-4 py-8">
                                    <div className={cn(
                                        "relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-500",
                                        "bg-secondary/50 backdrop-blur-sm group-hover:scale-110",
                                        isHovered ? item.bgColor : ""
                                    )}>
                                        <item.icon className={cn(
                                            "h-8 w-8 transition-colors duration-500",
                                            isHovered ? item.color : "text-muted-foreground"
                                        )} />
                                    </div>
                                    <CardTitle className="text-xl font-medium">{item.title}</CardTitle>
                                </CardHeader>

                                <CardContent className="relative text-center px-8 pb-10 space-y-4">
                                    <p className="text-muted-foreground leading-relaxed">
                                        {item.description}
                                    </p>

                                    {/* Keywords */}
                                    <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                                        {item.keywords}
                                    </p>

                                    {/* Micro CTA */}
                                    <div className={cn(
                                        "pt-4 flex items-center justify-center gap-1.5 text-sm font-medium transition-all duration-300",
                                        isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
                                        item.color
                                    )}>
                                        {item.cta}
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>
        </section>
    )
}
