import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import { getClientIp } from '@/lib/get-ip'

// Per-IP write rate limit for analytics events: 60 writes per minute.
// This is intentionally tighter than the global API rate limit to prevent
// unauthenticated callers from flooding the analyticsEvent table.
// Note: This map is per-instance; for true distributed rate limiting use Redis.
const analyticsRateLimit = new Map<string, { count: number; lastReset: number }>()
const ANALYTICS_RATE_LIMIT = 60
const ANALYTICS_RATE_WINDOW_MS = 60 * 1000

function isAnalyticsRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = analyticsRateLimit.get(ip) || { count: 0, lastReset: now }

  if (now - entry.lastReset > ANALYTICS_RATE_WINDOW_MS) {
    entry.count = 0
    entry.lastReset = now
  }

  entry.count++
  analyticsRateLimit.set(ip, entry)
  return entry.count > ANALYTICS_RATE_LIMIT
}

// Sanitise a string to a safe maximum length, returning null if empty/absent.
function safeString(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string' || !value) return null
  return value.slice(0, maxLen) || null
}

export async function POST(request: NextRequest) {
  // Per-IP rate limiting for analytics writes
  const ip = getClientIp(request)
  if (isAnalyticsRateLimited(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  try {
    const body = await request.json()

    const type = body.type as string | undefined
    const profileId = (body.profileId as string | undefined)?.toLowerCase()

    if (!type || !profileId) {
      return NextResponse.json(
        { error: 'type and profileId are required' },
        { status: 400 },
      )
    }

    if (!isValidAddress(profileId)) {
      return NextResponse.json(
        { error: 'Invalid profileId' },
        { status: 400 },
      )
    }

    if (type !== 'profile_view' && type !== 'link_click') {
      return NextResponse.json(
        { error: 'Unsupported analytics event type' },
        { status: 400 },
      )
    }

    // Validate visitorWallet if provided
    const rawVisitorWallet = (body.visitorWallet as string | undefined) || null
    const visitorWallet =
      rawVisitorWallet && isValidAddress(rawVisitorWallet)
        ? rawVisitorWallet.toLowerCase()
        : null

    // Sanitise free-text fields to bounded lengths to prevent DB flooding
    const source = safeString(body.source, 32) || 'unknown'
    const referrer = safeString(body.referrer, 512)
    const linkId = safeString(body.linkId, 64)
    const categoryId = safeString(body.categoryId, 64)

    // UTM params — bounded length
    const utmSource = safeString(body.utmSource, 128)
    const utmMedium = safeString(body.utmMedium, 128)
    const utmCampaign = safeString(body.utmCampaign, 128)
    const utmTerm = safeString(body.utmTerm, 128)
    const utmContent = safeString(body.utmContent, 128)

    // linkTitle and linkUrl: prefer the database record (ProfileLink) as the
    // authoritative source so clients cannot poison analytics dashboards (LOW-7).
    // Fall back to sanitised client-supplied values for links that live outside
    // the ProfileLink table (e.g. social links stored in profile.socialLinks JSON).
    let linkTitle: string | null = null
    let linkUrl: string | null = null

    if (linkId) {
      try {
        const dbLink = await prisma.profileLink.findFirst({
          where: { id: linkId, profile: { address: profileId } },
          select: { title: true, url: true },
        })
        if (dbLink) {
          // DB record found — use it exclusively; ignore client values
          linkTitle = dbLink.title || null
          linkUrl = dbLink.url || null
        } else {
          // No ProfileLink record — fall back to client-supplied values with
          // strict sanitisation (length caps, https-only URL)
          linkTitle = safeString(body.linkTitle, 128)
          const rawLinkUrl = safeString(body.linkUrl, 512)
          if (rawLinkUrl) {
            try {
              const parsed = new URL(rawLinkUrl)
              if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                linkUrl = parsed.toString()
              }
            } catch {
              // Invalid URL — discard silently
            }
          }
        }
      } catch {
        // Non-fatal: analytics write continues without resolved link metadata
      }
    }

    const userAgent = request.headers.get('user-agent') || ''
    const country =
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') ||
      null

    // Bot detection
    const botRegex = /bot|crawl|spider|mediapartners|slurp|patrol|facebookexternalhit|whatsapp|telegrambot|twitterbot|pinterest|googlebot|bingbot|yandexbot|duckduckbot/i
    const isBot = botRegex.test(userAgent)

    // Simple device detection
    let device = 'Desktop'
    if (/mobile/i.test(userAgent)) {
      device = 'Mobile'
    } else if (/tablet|ipad/i.test(userAgent)) {
      device = 'Tablet'
    } else if (/android/i.test(userAgent)) {
      device = 'Android'
    } else if (/iphone|ipod/i.test(userAgent)) {
      device = 'iPhone'
    }

    await prisma.analyticsEvent.create({
      data: {
        type,
        profileId,
        visitorWallet,
        source,
        referrer,
        linkId,
        linkTitle,
        linkUrl,
        categoryId,
        country,
        device,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        isBot,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[AnalyticsEvent API] Error creating analytics event', error)
    return NextResponse.json(
      { error: 'Failed to create analytics event' },
      { status: 500 },
    )
  }
}
