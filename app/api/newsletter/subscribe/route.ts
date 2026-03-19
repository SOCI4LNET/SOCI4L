import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getClientIp } from '@/lib/get-ip'

// Per-IP rate limit: max 5 subscription attempts per 10 minutes.
// This prevents both spam subscriptions and email enumeration via timing.
const subscribeRateLimit = new Map<string, { count: number; lastReset: number }>()
const SUBSCRIBE_LIMIT = 5
const SUBSCRIBE_WINDOW_MS = 10 * 60 * 1000

function isSubscribeRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = subscribeRateLimit.get(ip) || { count: 0, lastReset: now }

  if (now - entry.lastReset > SUBSCRIBE_WINDOW_MS) {
    entry.count = 0
    entry.lastReset = now
  }

  entry.count++
  subscribeRateLimit.set(ip, entry)
  return entry.count > SUBSCRIBE_LIMIT
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  if (email.length > 254) return false
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

// Generic success response — intentionally identical whether the email is new
// or already subscribed, to prevent email enumeration (MED-8).
const SUCCESS_RESPONSE = { ok: true }

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (isSubscribeRateLimited(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 },
      )
    }

    const normalizedEmail = normalizeEmail(email)

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 },
      )
    }

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      )
    }

    // Attempt to create; if the email already exists, silently succeed so
    // that callers cannot enumerate which addresses are already registered.
    try {
      await prisma.emailSubscription.create({
        data: { email: normalizedEmail },
      })
    } catch (createError: any) {
      // P2002 = unique constraint violation — email already subscribed.
      // Return the same success response to prevent enumeration.
      if (createError.code === 'P2002' || createError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return NextResponse.json(SUCCESS_RESPONSE)
      }
      throw createError
    }

    return NextResponse.json(SUCCESS_RESPONSE)
  } catch (error: any) {
    console.error('Error subscribing email:', error)
    return NextResponse.json(
      { error: 'An error occurred while saving email' },
      { status: 500 },
    )
  }
}
