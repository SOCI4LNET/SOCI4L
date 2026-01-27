'use client'

import { ReactNode } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AppTopbar } from '@/components/app-shell/app-topbar'

interface AdminShellProps {
  children: ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <SidebarProvider defaultOpen={true} className="!h-auto min-h-0">
      <div className="flex flex-1 min-h-0 w-full">
        <AdminSidebar />
        <SidebarInset className="!min-h-0 !h-auto flex flex-col flex-1">
          <AppTopbar />
          <main className="flex flex-1 flex-col bg-background min-h-0">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

