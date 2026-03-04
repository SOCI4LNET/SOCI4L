'use client'

import { ReactNode } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { AppTopbar } from './app-topbar'
import SiteFooter from './site-footer'

interface AppShellProps {
  children: ReactNode
  address?: string
}

export function AppShell({ children, address }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={true} className="!h-auto min-h-0">
      <div className="flex flex-1 min-h-0 w-full">
        <AppSidebar />
        <SidebarInset className="!min-h-0 !h-auto flex flex-col flex-1">
          <AppTopbar />
          <main className="flex flex-1 flex-col bg-background min-h-0">
            {children}
          </main>
          <SiteFooter layout="full" className="mt-auto" />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
