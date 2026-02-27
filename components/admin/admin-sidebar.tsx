'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LayoutDashboard, Users, BarChart3, FileText, Mail, Server, Settings, Crown } from 'lucide-react'

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from '@/components/ui/sidebar'
import { Soci4LLogo } from '@/components/logos/soci4l-logo'


const adminNav = [
  { label: 'Overview', icon: LayoutDashboard, href: '/master-console' },
  { label: 'Users', icon: Users, href: '/master-console/users' },
  { label: 'Premium Users', icon: Crown, href: '/master-console/premium' },
  { label: 'Analytics', icon: BarChart3, href: '/master-console/analytics' },
  { label: 'Content', icon: FileText, href: '/master-console/content' },
  { label: 'Subscribers', icon: Mail, href: '/master-console/subscribers' },
  { label: 'System', icon: Server, href: '/master-console/system' },
  { label: 'Settings', icon: Settings, href: '/master-console/settings' },
]

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          href="/master-console"
          className="flex items-center justify-center w-full px-2 hover:opacity-80 transition-opacity"
        >
          <Soci4LLogo variant="combination" width={100} height={19} />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/master-console' && pathname.startsWith(item.href))

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

