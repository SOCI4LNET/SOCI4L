'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { useAccount } from 'wagmi'

export default function LinkTrackPage() {
  const searchParams = useSearchParams()
  const params = useParams()
  const linkId = params?.linkId as string | undefined

  // Use status to know if we are still loading connection state
  const { address: visitorWallet, status } = useAccount()

  const hasIdentified = useRef(false)
  const isRedirecting = useRef(false)
  const [isIdentifying, setIsIdentifying] = useState(false)
  const identifyPromiseRef = useRef<Promise<any> | null>(null)

  useEffect(() => {
    // Basic validation
    const rawUrl = searchParams.get('url')
    const profileId = searchParams.get('profileId')
    const eventId = searchParams.get('eventId')

    if (!rawUrl || !profileId || !linkId) {
      return
    }

    // Validate URL: only allow http/https to prevent open redirect to javascript: or data: URIs
    let url: string
    try {
      const parsed = new URL(rawUrl)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        console.error('[LinkTrack] Blocked redirect to non-http(s) URL:', parsed.protocol)
        return
      }
      url = parsed.toString()
    } catch {
      console.error('[LinkTrack] Blocked redirect to invalid URL')
      return
    }

    // 1. Attempt Identity Update
    if (eventId && visitorWallet && !hasIdentified.current && !identifyPromiseRef.current) {
      setIsIdentifying(true)
      const promise = fetch('/api/analytics/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          walletAddress: visitorWallet
        }),
        keepalive: true
      }).then(() => {
        hasIdentified.current = true
        setIsIdentifying(false)
      }).catch(err => {
        console.error('[LinkTrack] Identify failed', err)
        hasIdentified.current = true // Still mark as tried to allow redirect
        setIsIdentifying(false)
      })

      identifyPromiseRef.current = promise
    }

    // 2. Redirect Logic
    if (isRedirecting.current) return

    const performRedirect = () => {
      if (isRedirecting.current) return
      // If we are currently identifying, we wait for it to finish 
      if (isIdentifying) return

      isRedirecting.current = true
      window.location.href = url
    }

    // Determine if we are ready to redirect
    const isStable = status === 'connected' || status === 'disconnected'
    const identifyFinishedIfNecessary = !visitorWallet || hasIdentified.current

    if (isStable && identifyFinishedIfNecessary) {
      performRedirect()
      return
    }

    // Safety Timeout: Wait up to 2000ms max
    const timer = setTimeout(() => {
      performRedirect()
    }, 2000)

    return () => clearTimeout(timer)
  }, [searchParams, linkId, visitorWallet, status, isIdentifying])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">Redirecting...</p>
    </div>
  )
}
