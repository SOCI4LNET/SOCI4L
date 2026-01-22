'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { LayoutDashboard, Wallet, Activity, Settings } from 'lucide-react'
import { formatAddress } from '@/lib/utils'

interface DashboardSidebarProps {
  address: string
}

export function DashboardSidebar({ address }: DashboardSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { setOpenMobile, isMobile } = useSidebar()
  const currentTab = searchParams.get('tab') || 'overview'

  const menuItems = [
    {
      title: 'Overview',
      icon: LayoutDashboard,
      value: 'overview',
    },
    {
      title: 'Assets',
      icon: Wallet,
      value: 'assets',
    },
    {
      title: 'Activity',
      icon: Activity,
      value: 'activity',
    },
    {
      title: 'Settings',
      icon: Settings,
      value: 'settings',
    },
  ]

  const handleLinkClick = () => {
    // Close sidebar on mobile after selection
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <div className="flex flex-col space-y-1 px-2 py-1.5">
          <h2 className="text-lg font-semibold">Dashboard</h2>
          <p className="text-xs text-muted-foreground font-mono">
            {formatAddress(address)}
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentTab === item.value
                const href = `${pathname}?tab=${item.value}`
                
                return (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                    >
                      <Link href={href} onClick={handleLinkClick} title={item.title}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
