'use client'

import { ReactNode } from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { AppTopbar } from './app-topbar'

interface AppShellProps {
  children: ReactNode
  address: string
}

export function AppShell({ children, address }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar address={address} />
      <SidebarInset>
        <AppTopbar />
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
