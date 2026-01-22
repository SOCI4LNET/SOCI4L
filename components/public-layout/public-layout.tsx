'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAccount, useConnect } from 'wagmi'
import { AccountMenu } from '@/components/topbar/account-menu'
import { Wallet } from 'lucide-react'
import { useState, useEffect } from 'react'

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
      <header className="border-b">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Avalanche Profile Hub
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
      </header>
      <main className="flex-1 container mx-auto max-w-6xl px-4 md:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
