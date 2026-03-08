"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import {
    BookOpen,
    FileText,
    Home,
    Terminal,
    FileCode,
    Package,
    Key,
    Database,
    User,
    LayoutDashboard,
    Bot,
    Star,
    Heart,
    Zap,
    ChevronRight,
    Settings,
    Shield,
    CreditCard,
    Layout,
    Layers,
    PieChart,
    Activity,
    Wallet,
    Palette,
    Lock,
    Cpu,
    Trophy,
    Users,
    Gem,
    Globe
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Soci4LLogo } from "@/components/logos/soci4l-logo"

interface Article {
    title: string
    slug: string
    category: string
}

interface DocsSidebarProps extends React.ComponentProps<typeof Sidebar> {
    articles?: Article[]
}

// Static fallback data with proper hierarchy
const navData = [
    {
        title: "Introduction",
        items: [
            { title: "Welcome to SOCI4L", url: "/docs/welcome", icon: BookOpen },
            { title: "Core Vision", url: "/docs/vision", icon: Zap },
            { title: "Project Roadmap", url: "/docs/roadmap", icon: Activity },
            { title: "Key Terminology", url: "/docs/terminology", icon: FileText },
        ]
    },
    {
        title: "Getting Started",
        items: [
            { title: "Quick Start Guide", url: "/docs/quick-start", icon: Zap },
            { title: "Wallet Connectivity", url: "/docs/wallet-connectivity", icon: Wallet },
            { title: "Claim Your Profile", url: "/docs/claim-profile", icon: Key },
            { title: "Initial Setup", url: "/docs/initial-setup", icon: Settings },
        ]
    },
    {
        title: "Profile Management",
        items: [
            { title: "Identity Overview", url: "/docs/identity-overview", icon: User },
            { title: "Digital Assets", url: "/docs/possessions", icon: Package },
            { title: "Social Graph", url: "/docs/social-graph", icon: Layers },
            { title: "On-Chain Activity", url: "/docs/transactions", icon: CreditCard },
            { title: "Visual Personalization", url: "/docs/customization", icon: Palette },
        ]
    },
    {
        title: "SOCI4L Studio",
        items: [
            { title: "Page Builder", url: "/docs/builder", icon: Layout },
            { title: "Link Management", url: "/docs/links", icon: Layers },
            { title: "Growth Insights", url: "/docs/insights", icon: PieChart },
        ]
    },
    {
        title: "Account & Safety",
        items: [
            { title: "Security Settings", url: "/docs/security", icon: Shield },
            { title: "Privacy Controls", url: "/docs/privacy", icon: Lock },
            { title: "Billing & Subscriptions", url: "/docs/billing", icon: CreditCard },
        ]
    },
    {
        title: "AI Ecosystem",
        items: [
            { title: "Agent Overview", url: "/docs/agent-overview", icon: Bot },
            { title: "Behavior Configuration", url: "/docs/agent-config", icon: Cpu },
            { title: "Automation Logic", url: "/docs/automation", icon: Zap },
        ]
    },
    {
        title: "Scoring & Reputation",
        items: [
            { title: "Scoring Algorithm", url: "/docs/scoring-logic", icon: Activity },
            { title: "Hierarchy & Ranks", url: "/docs/ranks", icon: Star },
            { title: "Achievement Badges", url: "/docs/badges", icon: Trophy },
        ]
    },
    {
        title: "Donations",
        items: [
            { title: "Platform Donations", url: "/docs/platform-donations", icon: Heart },
            { title: "Browser Extension", url: "/docs/extension-donations", icon: Globe },
            { title: "Supporter Leaderboards", url: "/docs/leaderboards", icon: Users },
        ]
    },
    {
        title: "Premium",
        items: [
            { title: "Exclusive Benefits", url: "/docs/benefits", icon: Gem },
            { title: "SOCI4L Pass NFT", url: "/docs/pass", icon: Zap },
            { title: "Tier Comparison", url: "/docs/tiers", icon: Layers },
        ]
    },
    {
        title: "Technical Reference",
        items: [
            { title: "System Architecture", url: "/docs/architecture", icon: Database },
            { title: "Database Schema", url: "/docs/database", icon: FileCode },
            { title: "API Specification", url: "/docs/api", icon: Terminal },
            { title: "Security Protocols", url: "/docs/protocols", icon: Shield },
        ]
    }
]

// Simple Wallet Icon fallback if needed
function WalletIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /><path d="M7 15h.01" /><path d="M11 15h2" /></svg>
}

export function DocsSidebar({ articles = [], ...props }: DocsSidebarProps) {
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
                {navData.map((group) => (
                    <SidebarGroup key={group.title} className="py-2">
                        <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2 px-2">
                            {group.title}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item: any) => (
                                    <React.Fragment key={item.title}>
                                        {item.items ? (
                                            <Collapsible
                                                asChild
                                                defaultOpen={pathname.startsWith(item.url)}
                                                className="group/collapsible"
                                            >
                                                <SidebarMenuItem>
                                                    <CollapsibleTrigger asChild>
                                                        <SidebarMenuButton tooltip={item.title}>
                                                            {item.icon && <item.icon className="size-4" />}
                                                            <span>{item.title}</span>
                                                            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                        </SidebarMenuButton>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <SidebarMenuSub>
                                                            {item.items.map((subItem: any) => (
                                                                <SidebarMenuSubItem key={subItem.title}>
                                                                    <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                                                        <a href={subItem.url}>
                                                                            <span>{subItem.title}</span>
                                                                        </a>
                                                                    </SidebarMenuSubButton>
                                                                </SidebarMenuSubItem>
                                                            ))}
                                                        </SidebarMenuSub>
                                                    </CollapsibleContent>
                                                </SidebarMenuItem>
                                            </Collapsible>
                                        ) : (
                                            <SidebarMenuItem>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={pathname === item.url}
                                                    tooltip={item.title}
                                                >
                                                    <a href={item.url}>
                                                        {item.icon && <item.icon className="size-4" />}
                                                        <span>{item.title}</span>
                                                    </a>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        )}
                                    </React.Fragment>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    )
}
