'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Code2, PenTool, Users } from 'lucide-react'
import { motion } from 'framer-motion'

export function UseCaseSection() {
    const cases = [
        {
            title: 'Builders',
            icon: Code2,
            description: 'Share one profile instead of explaining your wallet every time.',
        },
        {
            title: 'Creators',
            icon: PenTool,
            description: 'Share one profile instead of explaining your wallet every time.',
        },
        {
            title: 'DAOs / Teams',
            icon: Users,
            description: 'Share one profile instead of explaining your wallet every time.',
        },
    ]

    return (
        <section className="container mx-auto px-4 py-24 space-y-12">
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
                    Is this for me?
                </motion.p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
                {cases.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    >
                        <Card className="group relative h-full overflow-hidden bg-card/40 border-border/60 transition-all hover:border-primary/50 hover:bg-accent/5">
                            <CardHeader className="relative flex flex-col items-center gap-4 py-8">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                                    <item.icon className="h-7 w-7" />
                                </div>
                                <CardTitle className="text-xl font-medium">{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="relative text-center px-8 pb-10">
                                <p className="text-muted-foreground leading-relaxed">
                                    {item.description}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
