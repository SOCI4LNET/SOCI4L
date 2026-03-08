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
    PieChart
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
            { title: "Overview", url: "/docs", icon: BookOpen },
        ]
    },
    {
        title: "Getting Started",
        items: [
            { title: "Connect Your Wallet", url: "/docs/getting-started/connect-wallet", icon: WalletIcon },
            { title: "Claim Your Profile", url: "/docs/getting-started/claim-profile", icon: Key },
        ]
    },
    {
        title: "Profile",
        items: [
            { title: "Overview", url: "/docs/profile/general-informations", icon: FileText },
            { title: "Links & Socials", url: "/docs/profile/links-socials", icon: Layers },
            { title: "Presenting Possessions", url: "/docs/profile/presenting-possessions", icon: Package },
            { title: "Transactions", url: "/docs/profile/transactions", icon: CreditCard },
        ]
    },
    {
        title: "Dashboard",
        items: [
            { title: "Overview", url: "/docs/dashboard/overview", icon: LayoutDashboard },
            {
                title: "Studio",
                url: "/docs/dashboard/studio",
                icon: Layout,
                items: [
                    { title: "Builder", url: "/docs/dashboard/studio/builder" },
                    { title: "Links", url: "/docs/dashboard/studio/links" },
                    { title: "Insights", url: "/docs/dashboard/studio/insights" },
                ]
            },
            {
                title: "Account",
                url: "/docs/dashboard/account",
                icon: Settings,
                items: [
                    { title: "Safety", url: "/docs/dashboard/account/safety" },
                    { title: "Settings", url: "/docs/dashboard/account/settings" },
                    { title: "Billing", url: "/docs/dashboard/account/billing" },
                ]
            }
        ]
    },
    {
        title: "AI Agents",
        items: [
            { title: "Overview", url: "/docs/ai-agents", icon: Bot }
        ]
    },
    {
        title: "Profile Scoring",
        items: [
            { title: "Ranks", url: "/docs/profile-scoring/ranks", icon: Star }
        ]
    },
    {
        title: "Donations",
        items: [
            { title: "via Platform", url: "/docs/donations/platform", icon: Heart },
            { title: "via Extension", url: "/docs/donations/extension", icon: Heart },
        ]
    },
    {
        title: "Premium",
        items: [
            { title: "Overview", url: "/docs/premium", icon: Zap }
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
