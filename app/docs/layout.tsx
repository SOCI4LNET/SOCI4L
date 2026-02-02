'use client'

import { Soci4LLogo } from '@/components/logos/soci4l-logo'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    const sections = [
        {
            title: 'Introduction',
            items: [
                { title: 'Overview', href: '/docs' },
                { title: 'Quick Start', href: '/docs/quick-start' }
            ]
        },
        {
            title: 'Core Concepts',
            items: [
                { title: 'Smart Contracts', href: '/docs/smart-contracts' },
                { title: 'Oracles', href: '/docs/oracles' }
            ]
        },
        {
            title: 'Integration',
            items: [
                { title: 'SDK Reference', href: '/docs/sdk' },
                { title: 'API', href: '/docs/api' }
            ]
        }
    ]

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Docs Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 max-w-screen-2xl items-center">
                    <Link href="/docs" className="mr-6 flex items-center space-x-2">
                        <Soci4LLogo variant="combination" className="h-6 w-auto invert dark:invert-0" />
                        <span className="hidden font-bold sm:inline-block">Docs</span>
                    </Link>

                    <div className="flex flex-1 items-center space-x-2 justify-end">
                        <div className="w-full flex-1 md:w-auto md:flex-none">
                            <Button variant="outline" className="h-8 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64">
                                <Search className="mr-2 h-4 w-4" />
                                Search...
                                <kbd className="pointer-events-none absolute right-1.5 top-1.5 h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                                    <span className="text-xs">⌘</span>K
                                </kbd>
                            </Button>
                        </div>
                        <nav className="flex items-center">
                            <Link href="https://github.com/soci4l" target="_blank" rel="noreferrer">
                                <Button variant="ghost" size="icon" className="h-8 w-8 px-0">
                                    <span className="sr-only">GitHub</span>
                                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="h-4 w-4"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.235 1.91 1.235 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                                </Button>
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
                <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block overflow-y-auto border-r border-border/40 py-6 pr-6">
                    <div className="w-full">
                        {sections.map((section, i) => (
                            <div key={i} className="pb-4">
                                <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">{section.title}</h4>
                                <div className="grid grid-flow-row auto-rows-max text-sm">
                                    {section.items.map((item, j) => (
                                        <Link
                                            key={j}
                                            href={item.href}
                                            className={cn(
                                                "group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline text-muted-foreground",
                                                pathname === item.href ? "font-medium text-foreground" : ""
                                            )}
                                        >
                                            {item.title}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
                    <div className="mx-auto w-full min-w-0">
                        {children}
                    </div>
                    {/* Table of Contents Column (Hidden on mobile) */}
                    <div className="hidden text-sm xl:block">
                        <div className="sticky top-16 -mt-10 h-[calc(100vh-3.5rem)] overflow-hidden pt-6">
                            <div className="space-y-2">
                                <p className="font-medium">On This Page</p>
                                <ul className="m-0 list-none">
                                    {/* To act as placeholder for TOC */}
                                    <li className="mt-0 pt-2"><span className="text-muted-foreground">Overview</span></li>
                                    <li className="mt-0 pt-2"><span className="text-muted-foreground">Prerequisites</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
