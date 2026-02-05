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
  }

// Local storage event logging removed in favor of server-side analytics
// This file now acts as a client-side wrapper for the analytics API
// and handles session-based deduplication.



function shouldLogProfileView(profileId: string): boolean {
  if (!profileId) return false
  if (typeof window === 'undefined') return false

  const now = Date.now()
  const key = `soci4l:viewed:${profileId}`
  const tsKey = `soci4l:viewed_ts:${profileId}`

  try {
    const storage = window.sessionStorage
    const lastTsRaw = storage.getItem(tsKey)
    const lastTs = lastTsRaw ? Number(lastTsRaw) || 0 : 0

    // Dedupe window: 5 seconds per profile per sessionKey
    const DEDUPE_WINDOW_MS = 5 * 1000 // 5 seconds
    if (lastTs && now - lastTs < DEDUPE_WINDOW_MS) {
      return false
    }

    storage.setItem(key, '1')
    storage.setItem(tsKey, String(now))
  } catch (error) {
    // Fallback: best-effort TTL guard using localStorage
    try {
      const tsKey = `soci4l:viewed_ts:${profileId}`
      const raw = window.localStorage.getItem(tsKey)
      const lastTs = raw ? Number(raw) || 0 : 0

      const DEDUPE_WINDOW_MS = 5 * 1000 // 5 seconds
      if (lastTs && now - lastTs < DEDUPE_WINDOW_MS) {
        return false
      }

      window.localStorage.setItem(tsKey, String(now))
    } catch (innerError) {
      // ignore
    }
  }

  return true
}

export function trackProfileView(
  profileId: string,
  source: AnalyticsSource = 'unknown'
): void {
  if (!profileId) return

  // Normalize profileId to lowercase for consistency
  const normalizedProfileId = profileId.toLowerCase()

  if (!shouldLogProfileView(normalizedProfileId)) {
    return
  }

  // Best-effort server-side analytics (sendBeacon survives page unload; fetch is often aborted)
  try {
    if (typeof window !== 'undefined') {
      const payload = JSON.stringify({
        type: 'profile_view',
        profileId: normalizedProfileId,
        source,
        referrer: window.document.referrer || null,
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
      const payload = JSON.stringify({
        type: 'link_click',
        profileId: normalizedProfileId,
        linkId,
        linkTitle: linkTitle || undefined,
        linkUrl: linkUrl || undefined,
        categoryId: categoryId || undefined,
        source,
        referrer: window.document.referrer || null,
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

