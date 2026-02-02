"use client"

import * as React from "react"
import { BookOpen, ChevronRight, FileText, Home, Settings, Terminal } from "lucide-react"
import { Soci4LLogo } from "@/components/logos/soci4l-logo"
import { usePathname } from "next/navigation"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

// Enhanced data structure
const data = {
    navMain: [
        {
            title: "Getting Started",
            url: "#",
            icon: BookOpen,
            isActive: true,
            items: [
                {
                    title: "Introduction",
                    url: "/docs",
                },
                {
                    title: "Installation",
                    url: "/docs/getting-started/installation",
                },
                {
                    title: "Project Structure",
                    url: "/docs/getting-started/project-structure",
                },
            ],
        },
        {
            title: "Core Concepts",
            url: "#",
            icon: FileText,
            items: [
                {
                    title: "Wallet Strategy",
                    url: "/docs/core-concepts/wallet-strategy",
                },
                {
                    title: "Authentication",
                    url: "/docs/core-concepts/authentication",
                },
                {
                    title: "Privacy Model",
                    url: "/docs/core-concepts/privacy",
                },
                {
                    title: "SOCI4L Score System",
                    url: "/docs/core-concepts/score-system",
                },
            ],
        },
        {
            title: "API Reference",
            url: "#",
            icon: Terminal,
            items: [
                {
                    title: "Profile Endpoints",
                    url: "/docs/api/profile",
                },
                {
                    title: "Analytics Data",
                    url: "/docs/api/analytics",
                },
            ],
        },
        {
            title: "Settings",
            url: "#",
            icon: Settings,
            items: [
                {
                    title: "General",
                    url: "/docs/settings/general",
                },
                {
                    title: "Team",
                    url: "/docs/settings/team",
                },
                {
                    title: "Billing",
                    url: "/docs/settings/billing",
                },
            ],
        },
    ],
}

export function DocsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { state } = useSidebar()
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

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Platform</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {data.navMain.map((item) => {
                                // Check if any child item matches current path to open category
                                const isCategoryActive = item.items?.some(subItem => pathname === subItem.url)



                                return (
                                    <Collapsible
                                        key={item.title}
                                        asChild
                                        defaultOpen={isCategoryActive || item.isActive}
                                        className="group/collapsible"
                                    >
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip={item.title} isActive={isCategoryActive}>
                                                    {item.icon && <item.icon />}
                                                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                                                <SidebarMenuSub>
                                                    {item.items?.map((subItem) => (
                                                        <SidebarMenuSubItem key={subItem.title}>
                                                            <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                                                <a href={subItem.url}>
                                                                    <span className="group-data-[collapsible=icon]:hidden">{subItem.title}</span>
                                                                </a>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    ))}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
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
