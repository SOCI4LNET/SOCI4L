'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'

import { ProfileDropdown } from '@/components/profile-dropdown'
import { Soci4LLogo } from '@/components/logos/soci4l-logo'
import { WalletConnectButtons } from '@/components/wallet-connect-buttons'

export function SiteHeader() {
  const [mounted, setMounted] = useState(false)
  const { isConnected } = useAccount()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Soci4LLogo variant="combination" width={96} height={23} />
          </Link>
          <div className="flex items-center gap-2">
            {!mounted ? (
              <div className="h-8 w-8" />
            ) : isConnected ? (
              <ProfileDropdown />
            ) : (
              <WalletConnectButtons variant="default" size="sm" />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
