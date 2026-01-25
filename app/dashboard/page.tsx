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
    
    // Eğer cüzdan bağlıysa, dashboard/[address] formatına yönlendir
    if (isConnected && connectedAddress) {
      const dashboardHref = getConnectedDashboardHref(connectedAddress)
      if (dashboardHref) {
        router.replace(dashboardHref)
        return
      }
    }
  }, [mounted, isConnected, connectedAddress, router])

  // Hydration mismatch'i önlemek için mounted kontrolü
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

  // Cüzdan bağlı değilse, bağlama ekranı göster
  if (!isConnected) {
    return (
      <PageShell title="Dashboard" subtitle="Overview">
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-base font-semibold">Cüzdan Bağlantısı Gerekli</CardTitle>
            <CardDescription className="text-xs">Dashboard'a erişmek için cüzdanınızı bağlayın</CardDescription>
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
                    Bağlanıyor...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Cüzdan Bağla
                  </>
                )}
              </Button>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Cüzdan bağlayıcı mevcut değil
              </p>
            )}
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  // Cüzdan bağlı ama adres yoksa veya yönlendirme bekleniyorsa loading göster
  return (
    <PageShell title="Dashboard" subtitle="Overview">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Yönlendiriliyor...</span>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
