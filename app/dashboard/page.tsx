'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { PageShell } from '@/components/app-shell/page-shell'
import { getConnectedDashboardHref } from '@/lib/routing'
import { WalletConnectButtons } from '@/components/wallet-connect-buttons'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const { address: connectedAddress, isConnected } = useAccount()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Check if there's an address query parameter (admin accessing another user's dashboard)
    const addressParam = searchParams.get('address')
    if (addressParam) {
      // Admin is trying to access someone else's dashboard
      // Redirect to /dashboard/[address] with tab param preserved
      const tab = searchParams.get('tab') || 'overview'
      router.replace(`/dashboard/${addressParam.toLowerCase()}?tab=${tab}`)
      return
    }

    // If wallet is connected, redirect to dashboard/[address] format
    if (isConnected && connectedAddress) {
      const dashboardHref = getConnectedDashboardHref(connectedAddress)
      if (dashboardHref) {
        router.replace(dashboardHref)
        return
      }
    }
  }, [mounted, isConnected, connectedAddress, router, searchParams])

  // Mounted check to prevent hydration mismatch
  if (!mounted) {
    return (
      <PageShell title="Dashboard" subtitle="Overview">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  // If wallet is not connected, show connection screen
  if (!isConnected) {
    return (
      <PageShell title="Dashboard" subtitle="Overview">
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-base font-semibold">Wallet Connection Required</CardTitle>
            <CardDescription className="text-xs">Please connect your wallet to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <WalletConnectButtons
              variant="default"
              size="sm"
              className="w-full bg-accent-primary text-black hover:bg-accent-primary/90"
            />
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  // If wallet is connected but address is missing or redirect is pending, show loading
  return (
    <PageShell title="Dashboard" subtitle="Overview">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Redirecting...</span>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
