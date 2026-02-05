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

    // If we are definitely disconnected, go immediately
    if (status === 'disconnected') {
      performRedirect()
      return
    }

    // If we are connecting/reconnecting, wait up to 800ms
    // If connected but no address (rare), also wait briefly
    // If we are definitely connected but just waiting for address? 
    // status === 'connected' usually means we have address.
    // So 'connecting' and 'reconnecting' are the main ones to wait for.

    // Wait up to 2500ms for wallet to initialize
    const timer = setTimeout(() => {
      performRedirect()
    }, 2500)

    return () => clearTimeout(timer)

  }, [searchParams, linkId, visitorWallet, status])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">Redirecting...</p>
    </div>
  )
}
