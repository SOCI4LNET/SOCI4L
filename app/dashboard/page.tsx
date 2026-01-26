'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Wallet } from 'lucide-react'
import { PageShell } from '@/components/app-shell/page-shell'
import { getConnectedDashboardHref } from '@/lib/routing'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const { address: connectedAddress, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // If wallet is connected, redirect to dashboard/[address] format
    if (isConnected && connectedAddress) {
      const dashboardHref = getConnectedDashboardHref(connectedAddress)
      if (dashboardHref) {
        router.replace(dashboardHref)
        return
      }
    }
  }, [mounted, isConnected, connectedAddress, router])

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
            {connectors.length > 0 ? (
              <Button
                onClick={() => connect({ connector: connectors[0] })}
                variant="default"
                size="sm"
                className="w-full bg-accent-primary text-black hover:bg-accent-primary/90"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </>
                )}
              </Button>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Wallet connector not available
              </p>
            )}
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
