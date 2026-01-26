'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { AccountMenu } from '@/components/topbar/account-menu'
import { useState, useEffect } from 'react'
import { PAGE_GUTTER, CONTENT_MAX_WIDTH } from '@/lib/layout-constants'
import { cn } from '@/lib/utils'
import { Soci4LLogo } from '@/components/logos/soci4l-logo'
import { WalletConnectButtons } from '@/components/wallet-connect-buttons'

interface PublicLayoutProps {
  children: ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const [mounted, setMounted] = useState(false)
  const { isConnected } = useAccount()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className={cn('w-full', PAGE_GUTTER, 'py-4')}>
          <div className={cn('w-full', CONTENT_MAX_WIDTH, 'mx-auto')}>
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center">
                <Soci4LLogo variant="combination" width={120} height={21} />
              </Link>
              <div className="flex items-center gap-2">
                {!mounted ? (
                  <div className="h-8 w-8" />
                ) : isConnected ? (
                  <AccountMenu />
                ) : (
                  <WalletConnectButtons variant="default" size="sm" />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className={cn('flex-1', PAGE_GUTTER, 'py-8 pb-20 md:pb-24')}>
        <div className={cn('w-full', CONTENT_MAX_WIDTH, 'mx-auto')}>
          {children}
        </div>
      </main>
    </div>
  )
}
