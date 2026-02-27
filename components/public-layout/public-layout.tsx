'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { PAGE_GUTTER, CONTENT_MAX_WIDTH } from '@/lib/layout-constants'
import { cn } from '@/lib/utils'

import { HeaderActions } from '@/components/app-shell/header-actions'
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
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className={cn('w-full', PAGE_GUTTER, 'py-2 md:py-4')}>
          <div className={cn('w-full', CONTENT_MAX_WIDTH, 'mx-auto')}>
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center">
                <Soci4LLogo variant="combination" width={96} height={17} className="md:w-[120px] md:h-[21px]" />
              </Link>
              <div className="flex items-center gap-2">
                {!mounted ? (
                  <div className="h-8 w-8" />
                ) : isConnected ? (
                  <HeaderActions />
                ) : (
                  <WalletConnectButtons variant="default" size="sm" className="h-8 px-2.5 text-xs md:h-10 md:px-4 md:text-sm" />
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
