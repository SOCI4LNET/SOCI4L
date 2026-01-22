'use client'

import Link from 'next/link'
import { useAccount, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { formatAddress } from '@/lib/utils'

export function Navbar() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Avalanche Wallet Profile Hub
        </Link>
        <div className="flex items-center gap-4">
          {isConnected && address && (
            <>
              <span className="text-sm text-muted-foreground">
                {formatAddress(address)}
              </span>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => disconnect()}>
                Bağlantıyı Kes
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
