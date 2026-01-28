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
export type AnalyticsSource = 'profile' | 'qr' | 'copy' | 'unknown'

// Legacy type aliases for backward compatibility
export type ProfileViewSource = AnalyticsSource
export type LinkClickSource = AnalyticsSource

export type AnalyticsEvent =
  | {
    type: 'profile_view'
    profileId: string
    ts: number
    source: AnalyticsSource
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
  }

type StoredEventsV1 = {
  version: 1
  updatedAt: string
  events: AnalyticsEvent[]
}

const EVENTS_STORAGE_KEY = 'soci4l.events.v1'
const MAX_EVENTS = 1000

function shouldLogProfileView(profileId: string): boolean {
  if (!profileId) return false
  if (typeof window === 'undefined') return false

  const now = Date.now()
  const key = `soci4l:viewed:${profileId}`
  const tsKey = `soci4l:viewed_ts:${profileId}`

  try {
    const storage = window.sessionStorage
    const seen = storage.getItem(key)
    const lastTsRaw = storage.getItem(tsKey)
    const lastTs = lastTsRaw ? Number(lastTsRaw) || 0 : 0

    // Per-tab session dedupe
    if (seen) {
      return false
    }

    // Dedupe window: 1 minute per profile per sessionKey
    const DEDUPE_WINDOW_MS = 60 * 1000 // 1 minute
    if (lastTs && now - lastTs < DEDUPE_WINDOW_MS) {
      return false
    }

    storage.setItem(key, '1')
    storage.setItem(tsKey, String(now))
  } catch (error) {
    console.error('[analytics] Failed to access sessionStorage for profile view dedupe', error)

    // Fallback: best-effort TTL guard using localStorage
    try {
      const tsKey = `soci4l:viewed_ts:${profileId}`
      const raw = window.localStorage.getItem(tsKey)
      const lastTs = raw ? Number(raw) || 0 : 0

      // Dedupe window: 30 minutes per profile per sessionKey
      const DEDUPE_WINDOW_MS = 30 * 60 * 1000 // 30 minutes
      if (lastTs && now - lastTs < DEDUPE_WINDOW_MS) {
        return false
      }

      window.localStorage.setItem(tsKey, String(now))
    } catch (innerError) {
      console.error('[analytics] Failed to access localStorage for profile view dedupe', innerError)
    }
  }

  return true
}

function safeParseEvents(raw: string | null): AnalyticsEvent[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as Partial<StoredEventsV1> | null
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.events)) {
      return []
    }

    return parsed.events
  } catch (error) {
    console.error('[analytics] Failed to parse events from localStorage', error)
    return []
  }
}

function readEventsFromStorage(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(EVENTS_STORAGE_KEY)
    return safeParseEvents(raw)
  } catch (error) {
    console.error('[analytics] Failed to read events from localStorage', error)
    return []
  }
}

function writeEventsToStorage(events: AnalyticsEvent[]): void {
  if (typeof window === 'undefined') return

  try {
    const trimmed =
      events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events

    const payload: StoredEventsV1 = {
      version: 1,
      updatedAt: new Date().toISOString(),
      events: trimmed,
    }

    window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.error('[analytics] Failed to write events to localStorage', error)
  }
}

function writeEvent(event: AnalyticsEvent): void {
  try {
    const existing = readEventsFromStorage()
    writeEventsToStorage([...existing, event])
  } catch (error) {
    console.error('[analytics] Failed to append analytics event', error)
  }
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

  const event: AnalyticsEvent = {
    type: 'profile_view',
    profileId: normalizedProfileId,
    ts: Date.now(),
    source,
  }

  console.log('[analytics] trackProfileView', { profileId: normalizedProfileId, source, ts: event.ts })
  writeEvent(event)

  // Best-effort server-side analytics
  try {
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'profile_view',
          profileId: normalizedProfileId,
          source,
          referrer: window.document.referrer || null,
        }),
      }).catch(() => {
        // ignore network errors for analytics
      })
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
  linkUrl?: string
): void {
  if (!profileId || !linkId) return

  // Normalize profileId to lowercase for consistency
  const normalizedProfileId = profileId.toLowerCase()

  const event: AnalyticsEvent = {
    type: 'link_click',
    profileId: normalizedProfileId,
    linkId,
    linkTitle: linkTitle || undefined,
    linkUrl: linkUrl || undefined,
    categoryId: categoryId || null,
    ts: Date.now(),
    source,
  }

  console.log('[analytics] trackLinkClick', { profileId: normalizedProfileId, linkId, linkTitle, source, categoryId, ts: event.ts })
  writeEvent(event)

  // Best-effort server-side analytics
  try {
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'link_click',
          profileId: normalizedProfileId,
          linkId,
          linkTitle: linkTitle || undefined,
          linkUrl: linkUrl || undefined,
          categoryId: categoryId || undefined,
          source,
          referrer: window.document.referrer || null,
        }),
      }).catch(() => {
        // ignore network errors
      })
    }
  } catch {
    // ignore
  }
}

export function getEventsForProfile(profileId: string): AnalyticsEvent[] {
  if (!profileId) return []
  const all = readEventsFromStorage()
  // Normalize addresses for comparison (case-insensitive)
  const normalizedProfileId = profileId.toLowerCase()
  return all.filter((event) => event.profileId.toLowerCase() === normalizedProfileId)
}

/**
 * Get profile view count for a specific time range
 * @param profileId - Profile address or ID
 * @param days - Number of days to look back (default: 7)
 * @returns Count of profile views in the specified time range
 */
export function getProfileViewCount(profileId: string, days: number = 7): number {
  if (!profileId) return 0
  const events = getEventsForProfile(profileId)
  const now = Date.now()
  const fromTs = now - days * 24 * 60 * 60 * 1000

  return events.filter(
    (e): e is Extract<AnalyticsEvent, { type: 'profile_view' }> =>
      e.type === 'profile_view' && e.ts >= fromTs
  ).length
}

/**
 * Get profile view count breakdown by source for a specific time range
 * @param profileId - Profile address or ID
 * @param days - Number of days to look back (default: 7)
 * @returns Map of source to count
 */
export function getProfileViewCountBySource(
  profileId: string,
  days: number = 7
): Record<AnalyticsSource, number> {
  if (!profileId) {
    return { profile: 0, qr: 0, copy: 0, unknown: 0 }
  }

  const events = getEventsForProfile(profileId)
  const now = Date.now()
  const fromTs = now - days * 24 * 60 * 60 * 1000

  const views = events.filter(
    (e): e is Extract<AnalyticsEvent, { type: 'profile_view' }> =>
      e.type === 'profile_view' && e.ts >= fromTs
  )

  const breakdown: Record<AnalyticsSource, number> = {
    profile: 0,
    qr: 0,
    copy: 0,
    unknown: 0,
  }

  for (const view of views) {
    breakdown[view.source] = (breakdown[view.source] || 0) + 1
  }

  return breakdown
}

/**
 * Get total link clicks for a profile in a specific time range
 * @param profileId - Profile address or ID
 * @param days - Number of days to look back (default: 7)
 * @returns Count of link clicks in the specified time range
 */
export function getTotalLinkClicks(profileId: string, days: number = 7): number {
  if (!profileId) return 0
  const events = getEventsForProfile(profileId)
  const now = Date.now()
  const fromTs = now - days * 24 * 60 * 60 * 1000

  return events.filter(
    (e): e is Extract<AnalyticsEvent, { type: 'link_click' }> =>
      e.type === 'link_click' && e.ts >= fromTs
  ).length
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

  const source = params.get('source')

  if (source === 'profile' || source === 'qr' || source === 'copy') {
    return source
  }

  return 'unknown'
}

