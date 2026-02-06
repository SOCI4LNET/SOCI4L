'use client'

/**
 * Local analytics event tracking for SOCI4L.
 *
 * MVP implementation using localStorage only.
 * Schema version: 1
 */

/**
 * Standardized analytics source attribution
 * Used consistently across all analytics events
 */
export type AnalyticsSource = 'profile' | 'qr' | 'copy' | 'extension' | 'unknown'

// Legacy type aliases for backward compatibility
export type ProfileViewSource = AnalyticsSource
export type LinkClickSource = AnalyticsSource

export type AnalyticsEvent =
  | {
    type: 'profile_view'
    profileId: string
    ts: number
    source: AnalyticsSource
    visitorWallet?: string
  }
  | {
    type: 'link_click'
    profileId: string
    linkId: string
    linkTitle?: string // Stored at event time for persistence
    linkUrl?: string   // Stored at event time for persistence
    categoryId?: string | null
    ts: number
    source: AnalyticsSource
    visitorWallet?: string
    referrer?: string | null
    country?: string | null
    device?: string | null
    utmSource?: string | null
    utmMedium?: string | null
    utmCampaign?: string | null
    utmTerm?: string | null
    utmContent?: string | null
    isBot?: boolean
  }

// Local storage event logging removed in favor of server-side analytics
// This file now acts as a client-side wrapper for the analytics API
// and handles session-based deduplication.



function shouldLogProfileView(profileId: string, source: AnalyticsSource, visitorWallet?: string): boolean {
  if (!profileId) return false
  if (typeof window === 'undefined') return false

  const now = Date.now()
  // Include source in key to allow distinct tracking for different sources
  const key = `soci4l:viewed:${profileId}:${source}`
  const tsKey = `soci4l:viewed_ts:${profileId}:${source}`
  const walletKey = `soci4l:viewed_wallet:${profileId}:${source}`

  // Also maintain a global profile view timestamp to prevent spam
  const globalTsKey = `soci4l:viewed_ts:${profileId}:any`

  try {
    const storage = window.sessionStorage

    // 1. Check global spam protection (1s)
    const lastGlobalTsRaw = storage.getItem(globalTsKey)
    const lastGlobalTs = lastGlobalTsRaw ? Number(lastGlobalTsRaw) || 0 : 0
    if (lastGlobalTs && now - lastGlobalTs < 1000) {
      return false
    }

    // 2. Check specific source dedupe (20s)
    const lastTsRaw = storage.getItem(tsKey)
    const lastTs = lastTsRaw ? Number(lastTsRaw) || 0 : 0
    const lastWallet = storage.getItem(walletKey)
    const DEDUPE_WINDOW_MS = 20 * 1000 // 20 seconds

    // Allow re-tracking if we were anonymous before and now have a wallet
    const identityGained = visitorWallet && !lastWallet

    if (lastTs && now - lastTs < DEDUPE_WINDOW_MS && !identityGained) {
      return false
    }

    storage.setItem(key, '1')
    storage.setItem(tsKey, String(now))
    storage.setItem(globalTsKey, String(now))
    if (visitorWallet) {
      storage.setItem(walletKey, visitorWallet)
    }
  } catch (error) {
    // Fallback: localStorage
    try {
      const tsKey = `soci4l:viewed_ts:${profileId}:${source}`
      const globalTsKey = `soci4l:viewed_ts:${profileId}:any`
      const raw = window.localStorage.getItem(tsKey)
      const lastTs = raw ? Number(raw) || 0 : 0

      if (lastTs && now - lastTs < 20000) {
        return false
      }
      window.localStorage.setItem(tsKey, String(now))
      window.localStorage.setItem(globalTsKey, String(now))
    } catch { }
  }

  return true
}

/**
 * Filter referrers to avoid showing reloads or internal navigation as sources
 */
function getSafeReferrer(): string | null {
  if (typeof window === 'undefined') return null

  // 1. Detect reloads via performance API
  try {
    const nav = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (nav?.type === 'reload') return null
  } catch { }

  const ref = window.document.referrer
  if (!ref) return null

  // 2. Ignore internal referrers (same origin)
  try {
    const refUrl = new URL(ref)
    const currentUrl = new URL(window.location.href)
    if (refUrl.hostname === currentUrl.hostname) return null
  } catch { }

  return ref
}

export function trackProfileView(
  profileId: string,
  source: AnalyticsSource = 'unknown',
  visitorWallet?: string
): void {
  if (!profileId) return

  // Normalize profileId to lowercase for consistency
  const normalizedProfileId = profileId.toLowerCase()

  if (!shouldLogProfileView(normalizedProfileId, source, visitorWallet)) {
    return
  }

  // Best-effort server-side analytics (sendBeacon survives page unload; fetch is often aborted)
  try {
    if (typeof window !== 'undefined') {
      const payload = JSON.stringify({
        type: 'profile_view',
        profileId: normalizedProfileId,
        source,
        visitorWallet: visitorWallet || undefined,
        referrer: getSafeReferrer(),
      })
      const url = '/api/analytics/event'
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon(url, blob)
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        }).catch(() => { })
      }
    }
  } catch {
    // ignore
  }
}

export function trackLinkClick(
  profileId: string,
  linkId: string,
  source: AnalyticsSource = 'unknown',
  categoryId?: string | null,
  linkTitle?: string,
  linkUrl?: string,
  visitorWallet?: string,
  options?: { skipServer?: boolean }
): void {
  if (!profileId || !linkId) return

  // Normalize profileId to lowercase for consistency
  const normalizedProfileId = profileId.toLowerCase()

  // Skip API when click already recorded server-side (e.g. /r/[linkId] redirect) to avoid double count
  if (options?.skipServer) return

  // Best-effort server-side analytics (sendBeacon survives redirect; fetch is often aborted)
  try {
    if (typeof window !== 'undefined') {
      // Parse UTM parameters
      const params = new URLSearchParams(window.location.search)
      const utmSource = params.get('utm_source')
      const utmMedium = params.get('utm_medium')
      const utmCampaign = params.get('utm_campaign')
      const utmTerm = params.get('utm_term')
      const utmContent = params.get('utm_content')

      const payload = JSON.stringify({
        type: 'link_click',
        profileId: normalizedProfileId,
        linkId,
        linkTitle: linkTitle || undefined,
        linkUrl: linkUrl || undefined,
        categoryId: categoryId || undefined,
        source,
        visitorWallet: visitorWallet || undefined,
        referrer: getSafeReferrer(),
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
      })
      const url = '/api/analytics/event'
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon(url, blob)
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        }).catch(() => { })
      }
    }
  } catch (error) {
    // ignore
  }
}

// Deprecated getters - always return empty/zero as local storage is no longer used for logs
export function getEventsForProfile(profileId: string): AnalyticsEvent[] {
  return []
}

export function getProfileViewCount(profileId: string, days: number = 7): number {
  return 0
}

export function getProfileViewCountBySource(
  profileId: string,
  days: number = 7
): Record<AnalyticsSource, number> {
  return { profile: 0, qr: 0, copy: 0, extension: 0, unknown: 0 }
}

export function getTotalLinkClicks(profileId: string, days: number = 7): number {
  return 0
}

/**
 * Parse analytics source from URL query parameters
 * Supports: ?source=profile|qr|copy
 * Falls back to 'unknown' if not present or invalid
 */
export function getSourceFromUrl(searchParams: URLSearchParams | string): AnalyticsSource {
  const params = typeof searchParams === 'string'
    ? new URLSearchParams(searchParams)
    : searchParams

  const source = (
    params.get('source') ||
    params.get('Source') ||
    params.get('utm_source')
  )?.toLowerCase()

  if (source === 'profile' || source === 'qr' || source === 'copy' || source === 'extension') {
    return source as AnalyticsSource
  }

  return 'unknown'
}

