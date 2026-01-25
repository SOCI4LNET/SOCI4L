'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAccount, useConnect } from 'wagmi'
import { AccountMenu } from '@/components/topbar/account-menu'
import { Wallet } from 'lucide-react'
import { useState, useEffect } from 'react'
import { PAGE_GUTTER, CONTENT_MAX_WIDTH } from '@/lib/layout-constants'
import { cn } from '@/lib/utils'
import { Soci4LLogo } from '@/components/logos/soci4l-logo'

interface PublicLayoutProps {
  children: ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const [mounted, setMounted] = useState(false)
  const { isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()

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
                  <>
                    {connectors.length > 0 && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => connect({ connector: connectors[0] })}
                        disabled={isConnecting}
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                      </Button>
                    )}
                  </>
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
