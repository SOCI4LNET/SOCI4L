'use client'

import { ReactNode } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { AppTopbar } from './app-topbar'

interface AppShellProps {
  children: ReactNode
  address?: string
}

export function AppShell({ children, address }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <AppTopbar />
        <div className="flex flex-1 flex-col bg-background">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
