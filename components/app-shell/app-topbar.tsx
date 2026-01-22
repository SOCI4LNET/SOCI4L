'use client'

import { useState, useEffect } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { AccountMenu } from '@/components/topbar/account-menu'

export function AppTopbar() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center justify-end gap-2">
        {mounted ? <AccountMenu /> : <div className="h-8 w-8" />}
      </div>
    </header>
  )
}
