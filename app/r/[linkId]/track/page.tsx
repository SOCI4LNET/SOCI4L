'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { trackLinkClick, getSourceFromUrl, type AnalyticsSource } from '@/lib/analytics'
import { useAccount } from 'wagmi'

/**
 * Client-side tracking page for link clicks
 * 
 * This page:
 * 1. Records the click event in localStorage
 * 2. Immediately redirects to the actual URL
 * 
 * This ensures tracking happens even if the user:
 * - Right-clicks and opens in new tab
 * - Middle-clicks
 * - Uses browser navigation
 */

export default function LinkTrackPage() {
  const searchParams = useSearchParams()
  const params = useParams()
  const linkId = params?.linkId as string | undefined
  const { address: visitorWallet } = useAccount()
  // Guard to prevent double tracking in React Strict Mode
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    // Prevent double tracking in React Strict Mode
    if (hasTrackedRef.current) {
      return
    }

    const url = searchParams.get('url')
    const profileId = searchParams.get('profileId')
    const categoryId = searchParams.get('categoryId')
    const linkTitle = searchParams.get('title')
    const sourceParam = searchParams.get('source') || 'unknown'
    const eventId = searchParams.get('eventId')

    if (!url || !profileId || !linkId) {
      console.error('[LinkTrack] Missing required parameters', { url, profileId, linkId })
      return
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      console.error('[LinkTrack] Invalid URL', url)
      return
    }

    // Mark as tracked before proceeding
    hasTrackedRef.current = true

    // Record the click event
    const source = (sourceParam === 'profile' || sourceParam === 'qr' || sourceParam === 'copy' || sourceParam === 'unknown')
      ? (sourceParam as AnalyticsSource)
      : 'unknown'

    console.log('[LinkTrack] Recording click event', {
      profileId,
      linkId,
      categoryId,
      linkTitle,
      source,
      url,
      eventId,
      visitorWallet
    })

    // skipServer: true — click already recorded server-side in /r/[linkId] to avoid double count
    trackLinkClick(
      profileId,
      linkId,
      source,
      categoryId || null,
      linkTitle || undefined,
      url,
      { skipServer: true }
    )

    // If we have an eventId and a wallet address, identify the user
    if (eventId && visitorWallet) {
      // Non-blocking call to update identity
      fetch('/api/analytics/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          walletAddress: visitorWallet
        })
      }).catch(err => console.error('[LinkTrack] Identify failed', err))
    }

    // Immediately redirect to the actual URL
    window.location.href = url
  }, [searchParams, linkId, visitorWallet])

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
