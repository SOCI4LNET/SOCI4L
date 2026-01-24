'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAccount, useConnect } from 'wagmi'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Wallet } from 'lucide-react'
import { Soci4LLogo } from '@/components/logos/soci4l-logo'

export function SiteHeader() {
  const [mounted, setMounted] = useState(false)
  const { isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Soci4LLogo variant="combination" width={120} height={21} />
          </Link>
          <div className="flex items-center gap-2">
            {!mounted ? (
              <div className="h-8 w-8" />
            ) : isConnected ? (
              <ProfileDropdown />
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
  )
}
