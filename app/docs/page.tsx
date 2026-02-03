import { Button } from "@/components/ui/button"
import { ArrowRight, Book, Key, Layers, Rocket, Zap, Globe, Package, Database } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { MDXRemote } from 'next-mdx-remote/rsc'
import { components } from '@/components/docs/mdx-components'
import Link from 'next/link'
import { DocsTitle, DocsParagraph, DocsHeading } from "@/components/docs/ui/typography"
import { DocsCard } from "@/components/docs/ui/card"

export default async function DocsPage() {
    // Fetch the 'home' article
    const homeArticle = await prisma.docsArticle.findUnique({
        where: { slug: 'home' }
    })

    if (homeArticle) {
        return (
            <div className="max-w-4xl space-y-10 pb-10">
                <MDXRemote source={homeArticle.content} components={components} />
            </div>
        )
    }

    // Fallback if not migrated yet - MODERNIZED
    return (
        <div className="space-y-12 pb-10">
            {/* Hero Section */}
            <div>
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6 ring-1 ring-inset ring-primary/20">
                    <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                    Documentation v1.0
                </div>
                <DocsTitle className="mt-0">Welcome to SOCI4L</DocsTitle>
                <DocsParagraph className="text-lg text-muted-foreground max-w-3xl">
                    The all-in-one Web3 functionality layer. Turn any wallet address into a comprehensive, measurable public profile.
                </DocsParagraph>
                <div className="mt-8 flex gap-4">
                    <Button size="lg" asChild>
                        <Link href="/docs/quick-start">Get Started</Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                        <Link href="/docs/api">API Reference</Link>
                    </Button>
                </div>
            </div>

            <hr className="border-border/40" />

            {/* Quick Start Grid */}
            <section>
                <DocsHeading>Quick Start</DocsHeading>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    <DocsCard
                        href="/docs/introduction"
                        title="Introduction"
                        description="Learn the basics of SOCI4L architecture and core concepts."
                        icon={<Book className="h-5 w-5" />}
                    />
                    <DocsCard
                        href="/docs/project-structure"
                        title="Project Structure"
                        description="Understand the codebase organization and components."
                        icon={<Package className="h-5 w-5" />}
                    />
                    <DocsCard
                        href="/docs/auth"
                        title="Authentication"
                        description="Deep dive into wallet-based auth and session management."
                        icon={<Key className="h-5 w-5" />}
                    />
                </div>
            </section>

            {/* Core Concepts Grid */}
            <section>
                <DocsHeading>Core Concepts</DocsHeading>
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <DocsCard
                        href="/docs/database"
                        title="Database Schema"
                        description="Explore the data model, relationships, and Prisma configuration."
                        icon={<Database className="h-5 w-5" />}
                    />
                    <DocsCard
                        href="/docs/social-graph"
                        title="Social Graph"
                        description="How we map relationships, follows, and interactions on-chain."
                        icon={<Globe className="h-5 w-5" />}
                    />
                </div>
            </section>
        </div>
    )
}
