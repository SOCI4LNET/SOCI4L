'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { trackLinkClick, type AnalyticsSource } from '@/lib/analytics'
import { useAccount } from 'wagmi'

export default function LinkTrackPage() {
  const searchParams = useSearchParams()
  const params = useParams()
  const linkId = params?.linkId as string | undefined

  // Use status to know if we are still loading connection state
  const { address: visitorWallet, status } = useAccount()

  const hasIdentified = useRef(false)
  const isRedirecting = useRef(false)

  useEffect(() => {
    // Basic validation
    const url = searchParams.get('url')
    const profileId = searchParams.get('profileId')
    const eventId = searchParams.get('eventId')

    if (!url || !profileId || !linkId) {
      return
    }

    // 1. Attempt Identity Update (Non-blocking, persistent)
    if (eventId && visitorWallet && !hasIdentified.current) {
      hasIdentified.current = true
      fetch('/api/analytics/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          walletAddress: visitorWallet
        }),
        keepalive: true // Critical: ensures request survives page unload
      }).catch(err => console.error('[LinkTrack] Identify failed', err))
    }

    // 2. Redirect Logic
    // We wait a short moment if we are "connecting" or "reconnecting" to give the wallet a chance to appear.
    // Otherwise, or after timeout, we redirect.

    if (isRedirecting.current) return

    const performRedirect = () => {
      if (isRedirecting.current) return
      isRedirecting.current = true
      window.location.href = url
    }

    // If we have identified, we can go immediately
    if (hasIdentified.current) {
      performRedirect()
      return
    }

    // If we are connecting/reconnecting, wait up to 2000ms
    // If status is stable (connected or disconnected), we can go immediately
    const isStable = status === 'connected' || status === 'disconnected'

    if (isStable) {
      performRedirect()
      return
    }

    // Wait up to 2000ms for wallet to initialize if we are connecting
    const timer = setTimeout(() => {
      performRedirect()
    }, 2000)

    return () => clearTimeout(timer)

  }, [searchParams, linkId, visitorWallet, status])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">Redirecting...</p>
    </div>
  )
}
