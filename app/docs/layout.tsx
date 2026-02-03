'use client'

import { Soci4LLogo } from '@/components/logos/soci4l-logo'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { DocsSidebar } from '@/components/docs/docs-sidebar'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex w-full min-h-screen bg-background text-foreground">
                <DocsSidebar />

                <SidebarInset className="flex w-full flex-col">
                    {/* Docs Header - Integrated into Inset */}
                    <header className="sticky top-0 z-10 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex h-14 items-center px-4 gap-2">
                            <SidebarTrigger />
                            <div className="flex-1 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="hidden md:inline-flex text-sm font-medium text-muted-foreground mr-2">/</span>
                                    <span className="text-sm font-semibold">{pathname === '/docs' ? 'Overview' : pathname.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="hidden md:flex w-full max-w-sm items-center space-x-2">
                                        <Button variant="outline" size="sm" className="h-8 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64">
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
                        </div>
                    </header>

                    <div className="flex flex-1 container max-w-screen-2xl">
                        <main className="relative py-6 lg:gap-10 lg:py-8 lg:px-8 xl:grid xl:grid-cols-[1fr_250px] w-full">
                            <div className="mx-auto w-full min-w-0">
                                {children}
                            </div>
                            {/* Table of Contents Column (Hidden on mobile) */}
                            <div className="hidden text-sm xl:block pl-6 border-l border-border/40">
                                <div className="sticky top-20 h-[calc(100vh-3.5rem)] overflow-hidden">
                                    <div className="space-y-2">
                                        <p className="font-semibold text-sm">On This Page</p>
                                        <ul className="m-0 list-none space-y-2">
                                            {/* To act as placeholder for TOC */}
                                            <li className="mt-0 pt-1"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors block">Overview</span></li>
                                            <li className="mt-0 pt-1"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors block">Prerequisites</span></li>
                                            <li className="mt-0 pt-1"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors block">Installation</span></li>
                                        </ul>
                                    </div>
                                    <div className="mt-10 pt-10 border-t border-border/40">
                                        <p className="text-xs text-muted-foreground font-medium mb-4">Community</p>
                                        <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                            Status
                                        </a>
                                        <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                                            Ask on Discord
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}
