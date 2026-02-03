import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Book, Key, Layers, Rocket, Zap, Globe } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { MDXRemote } from 'next-mdx-remote/rsc'
import { components } from '@/components/docs/mdx-components'
import Link from 'next/link'

export default async function DocsPage() {
    // Fetch the 'home' article
    const homeArticle = await prisma.docsArticle.findUnique({
        where: { slug: 'home' }
    })

    if (homeArticle) {
        return (
            <div className="max-w-4xl space-y-10 pb-10">
                <div className="relative isolate overflow-hidden">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6 ring-1 ring-inset ring-primary/20">
                            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                            Documentation v1.0
                        </div>
                    </div>
                    <div className="prose prose-zinc dark:prose-invert max-w-none">
                        <MDXRemote source={homeArticle.content} components={components} />
                    </div>
                </div>
            </div>
        )
    }

    // Fallback if not migrated yet - MODERNIZED
    return (
        <div className="max-w-5xl space-y-12 pb-10">
            {/* Hero Section */}
            <div className="relative py-12 md:py-16 overflow-hidden rounded-2xl bg-zinc-900 px-6 sm:px-12 md:px-16 shadow-2xl ring-1 ring-white/10 isolate">
                {/* Background Effects */}
                <svg
                    viewBox="0 0 1024 1024"
                    className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0"
                    aria-hidden="true"
                >
                    <circle cx={512} cy={512} r={512} fill="url(#gradient)" fillOpacity="0.15" />
                    <defs>
                        <radialGradient id="gradient">
                            <stop stopColor="#7775D6" />
                            <stop offset={1} stopColor="#E935C1" />
                        </radialGradient>
                    </defs>
                </svg>

                <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
                    <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white mb-6 backdrop-blur-sm ring-1 ring-inset ring-white/20">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 mr-2"></span>
                        Documentation
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl mb-6 font-display">
                        Build the Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Web3 Identity</span>
                    </h1>
                    <p className="text-lg leading-8 text-zinc-300 max-w-xl mx-auto lg:mx-0">
                        The all-in-one functionality layer. Turn any wallet address into a comprehensive, measurable public profile with SOCI4L.
                    </p>
                    <div className="mt-8 flex items-center justify-center lg:justify-start gap-x-6">
                        <Button size="lg" className="h-12 px-8 text-base bg-white text-zinc-900 hover:bg-zinc-100">
                            Get Started
                        </Button>
                        <Button variant="link" className="text-white hover:text-white/80">
                            View API Reference <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Links Grid */}
            <section>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/docs/introduction" className="group">
                        <div className="relative h-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6 hover:shadow-lg transition-all hover:scale-[1.02] hover:bg-zinc-100 dark:hover:bg-zinc-900">
                            <div className="absolute top-0 right-0 p-4 opacity-50 text-zinc-200 dark:text-zinc-800 pointer-events-none group-hover:opacity-10 transition-opacity">
                                <Book className="w-24 h-24 -mr-8 -mt-8" />
                            </div>
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500">
                                <Book className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Introduction</h3>
                            <p className="text-sm text-muted-foreground">
                                Learn the basics of SOCI4L architecture and core concepts.
                            </p>
                        </div>
                    </Link>

                    <Link href="/docs/project-structure" className="group">
                        <div className="relative h-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6 hover:shadow-lg transition-all hover:scale-[1.02] hover:bg-zinc-100 dark:hover:bg-zinc-900">
                            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 text-purple-500">
                                <Layers className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Project Structure</h3>
                            <p className="text-sm text-muted-foreground">
                                Understand the codebase organization and component hierarchy.
                            </p>
                        </div>
                    </Link>

                    <Link href="/docs/auth" className="group">
                        <div className="relative h-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6 hover:shadow-lg transition-all hover:scale-[1.02] hover:bg-zinc-100 dark:hover:bg-zinc-900">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4 text-amber-500">
                                <Key className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Authentication</h3>
                            <p className="text-sm text-muted-foreground">
                                Deep dive into wallet-based auth and session management.
                            </p>
                        </div>
                    </Link>
                </div>
            </section>
        </div>
    )
}
