'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { formatAddress } from '@/lib/utils'

export function SiteHeader() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Avalanche Profile Hub
          </Link>
          <div className="flex items-center gap-4">
            {!mounted ? (
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            ) : isConnected && address ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {formatAddress(address)}
                </span>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => disconnect()}>
                  Disconnect
                </Button>
              </>
            ) : (
              <>
                {connectors.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => connect({ connector: connectors[0] })}
                  >
                    Connect Wallet
                  </Button>
                )}
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
