'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { FileText, Settings, LogOut, LayoutDashboard, PlusCircle } from 'lucide-react'

import { Soci4LLogo } from '@/components/logos/soci4l-logo'

export default function DocsAdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()

    const links = [
        {
            label: "Dashboard",
            href: "/docs-admin/dashboard",
            icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0" />,
        },
        {
            label: "Articles",
            href: "/docs-admin/articles",
            icon: <FileText className="h-5 w-5 flex-shrink-0" />,
        },
        {
            label: "New Article",
            href: "/docs-admin/editor/new",
            icon: <PlusCircle className="h-5 w-5 flex-shrink-0" />,
        },
        {
            label: "Settings",
            href: "/docs-admin/settings",
            icon: <Settings className="h-5 w-5 flex-shrink-0" />,
        },
    ]

    const handleLogout = async () => {
        await fetch('/api/docs-admin/auth', { method: 'DELETE' })
        toast.success('Logged out')
        router.push('/docs-admin/login')
    }

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            {/* Custom Sidebar separate from main app */}
            <aside className="w-64 border-r border-border/40 bg-zinc-950 flex flex-col">
                <div className="p-6 border-b border-border/20">
                    <Soci4LLogo variant="combination" width={100} className="invert-0" />
                    <div className="mt-2 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                        Docs Admin
                    </div>
                </div>

                <div className="flex-1 py-6 px-3 space-y-1">
                    {links.map((link) => {
                        const isActive = pathname === link.href
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                                )}
                            >
                                {link.icon}
                                {link.label}
                            </Link>
                        )
                    })}
                </div>

                <div className="p-4 border-t border-border/20">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-background p-8">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
