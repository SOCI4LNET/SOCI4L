"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { BookOpen, FileText, Home, Terminal } from "lucide-react"

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar } from "@/components/ui/sidebar"
import { Soci4LLogo } from "@/components/logos/soci4l-logo"

// Enhanced data structure
const data = {
    navMain: [
        {
            title: "Introduction",
            items: [
                {
                    title: "Overview",
                    url: "/docs",
                    icon: BookOpen,
                },
                {
                    title: "Quick Start",
                    url: "/docs/quick-start",
                    icon: Terminal,
                },
                {
                    title: "Brand Assets",
                    url: "/brand",
                    icon: FileText,
                }
            ],
        },
        {
            title: "Architecture",
            items: [
                {
                    title: "Project Structure",
                    url: "/docs/project-structure",
                },
                {
                    title: "Authentication",
                    url: "/docs/auth",
                },
                {
                    title: "Database Schema",
                    url: "/docs/database",
                },
            ],
        },
        {
            title: "Core Concepts",
            items: [
                {
                    title: "Smart Contracts",
                    url: "/docs/smart-contracts",
                },
                {
                    title: "Oracles",
                    url: "/docs/oracles",
                },
                {
                    title: "Social Graph",
                    url: "/docs/social-graph",
                },
            ],
        },
        {
            title: "Reference",
            items: [
                {
                    title: "API Reference",
                    url: "/docs/api",
                },
                {
                    title: "SDK",
                    url: "/docs/sdk",
                },
                {
                    title: "CLI",
                    url: "/docs/cli",
                },
            ],
        },
    ],
}

export function DocsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center justify-between gap-2 px-2 py-2 overflow-hidden">
                    <div className="flex items-center gap-2 transition-all duration-200 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                            <Soci4LLogo variant="icon" className="size-5" />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight min-w-0 animate-in fade-in zoom-in duration-300 group-data-[collapsible=icon]:hidden">
                            <span className="truncate font-semibold">SOCI4L Docs</span>
                            <span className="truncate text-xs text-muted-foreground">v1.0.0</span>
                        </div>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-2">
                {data.navMain.map((group) => (
                    <SidebarGroup key={group.title} className="py-2">
                        <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2 px-2">
                            {group.title}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item: any) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={pathname === item.url} className="h-8 text-sm font-medium text-muted-foreground data-[active=true]:text-foreground data-[active=true]:bg-primary/5 hover:text-foreground">
                                            <a href={item.url} className="flex items-center gap-2">
                                                {item.icon && <item.icon className="h-4 w-4" />}
                                                <span>{item.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <a href="/">
                                <Home />
                                <span className="group-data-[collapsible=icon]:hidden">Back to App</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
