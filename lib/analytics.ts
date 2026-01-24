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

    // Short TTL guard to avoid accidental duplicates
    if (lastTs && now - lastTs < 10_000) {
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

      if (lastTs && now - lastTs < 10_000) {
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

  if (!shouldLogProfileView(profileId)) {
    return
  }

  const event: AnalyticsEvent = {
    type: 'profile_view',
    profileId,
    ts: Date.now(),
    source,
  }

  writeEvent(event)
}

export function trackLinkClick(
  profileId: string,
  linkId: string,
  source: AnalyticsSource = 'unknown'
): void {
  if (!profileId || !linkId) return

  const event: AnalyticsEvent = {
    type: 'link_click',
    profileId,
    linkId,
    ts: Date.now(),
    source,
  }

  writeEvent(event)
}

export function getEventsForProfile(profileId: string): AnalyticsEvent[] {
  if (!profileId) return []
  const all = readEventsFromStorage()
  return all.filter((event) => event.profileId === profileId)
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

