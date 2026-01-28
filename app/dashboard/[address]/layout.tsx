'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell/app-shell'
import { toast } from 'sonner'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const params = useParams()
  const { address: connectedAddress, isConnected, isReconnecting, isConnecting } = useAccount()
  const router = useRouter()

  const targetAddress = params.address as string
  const normalizedTargetAddress = targetAddress?.toLowerCase()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Don't redirect while connection is being established/restored
    if (isReconnecting || isConnecting) return

    if (!isConnected || !connectedAddress) {
      router.push('/')
      return
    }

    const normalizedConnectedAddress = connectedAddress.toLowerCase()

    // If user tries to access a different address's dashboard, redirect to their own
    if (normalizedTargetAddress && normalizedTargetAddress !== normalizedConnectedAddress) {
      toast.error('You can only access your own dashboard')
      router.push(`/dashboard/${normalizedConnectedAddress}`)
      return
    }

    // Check if user is banned
    const checkBanStatus = async () => {
      try {
        const response = await fetch(`/api/wallet?address=${normalizedConnectedAddress}`)
        if (response.ok) {
          const data = await response.json()
          if (data.profile?.isBanned) {
            toast.error('Your account has been banned due to violation of our terms.')
            router.push('/')
          }
        }
      } catch (error) {
        console.error('Failed to check ban status:', error)
      }
    }

    checkBanStatus()
  }, [mounted, isConnected, connectedAddress, normalizedTargetAddress, router, isReconnecting, isConnecting])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex min-h-svh w-full">
        <div className="flex flex-1 flex-col">
          <div className="h-16 border-b" />
          <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
            <div className="space-y-4">
              <div className="h-8 w-48 animate-pulse rounded bg-muted" />
              <div className="h-64 w-full animate-pulse rounded bg-muted" />
            </div>
          </main>
        </div>
      </div>
    )
  }

  if ((!isConnected && !isReconnecting && !isConnecting) || (!connectedAddress && !isReconnecting && !isConnecting)) {
    return (
      <div className="flex min-h-svh w-full">
        <div className="flex flex-1 flex-col">
          <div className="h-16 border-b" />
          <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    )
  }

  // Show loading skeleton while reconnecting
  if (isReconnecting || isConnecting) {
    return (
      <div className="flex min-h-svh w-full">
        <div className="flex flex-1 flex-col">
          <div className="h-16 border-b" />
          <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
            <div className="space-y-4">
              <div className="h-8 w-48 animate-pulse rounded bg-muted" />
              <div className="h-64 w-full animate-pulse rounded bg-muted" />
            </div>
          </main>
        </div>
      </div>
    )
  }

  const normalizedConnectedAddress = connectedAddress.toLowerCase()
  const displayAddress = normalizedTargetAddress || normalizedConnectedAddress

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex flex-1 flex-col">
        <AppShell address={displayAddress}>{children}</AppShell>
      </div>
    </div>
  )
}
