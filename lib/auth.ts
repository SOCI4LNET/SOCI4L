import { cookies } from 'next/headers'
import { isValidAddress } from '@/lib/utils'
import { createSignedSessionToken, verifySignedSessionToken } from '@/lib/session-token'

export const AUTH_SESSION_COOKIE = 'aph_session'
export const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

interface AuthSessionPayload {
  address: string
  iat: number
  exp: number
  typ: 'auth'
}

function getAuthSessionSecret(): string | null {
  return process.env.AUTH_SESSION_SECRET || process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || null
}

export async function createAuthSession(address: string): Promise<string | null> {
  const normalizedAddress = address.toLowerCase()
  if (!isValidAddress(normalizedAddress)) return null

  const secret = getAuthSessionSecret()
  if (!secret) {
    console.error('[Auth] Missing session secret. Set AUTH_SESSION_SECRET or SESSION_SECRET.')
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  const payload: AuthSessionPayload = {
    address: normalizedAddress,
    iat: now,
    exp: now + AUTH_SESSION_MAX_AGE_SECONDS,
    typ: 'auth',
  }

  return createSignedSessionToken(payload, secret)
}

export async function setSessionAddress(address: string): Promise<boolean> {
  const token = await createAuthSession(address)
  if (!token) return false

  const cookieStore = await cookies()
  cookieStore.set(AUTH_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    path: '/',
  })

  return true
}

/**
 * Get the authenticated wallet address from session cookie
 * Returns null if no valid session exists
 */
export async function getSessionAddress(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value
  if (!token) return null

  const secret = getAuthSessionSecret()
  if (!secret) {
    console.error('[Auth] Missing session secret. Set AUTH_SESSION_SECRET or SESSION_SECRET.')
    return null
  }

  const session = await verifySignedSessionToken<AuthSessionPayload>(token, secret)
  if (!session || session.typ !== 'auth' || !session.address || !isValidAddress(session.address)) {
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  if (session.exp <= now) {
    return null
  }

  return session.address.toLowerCase()
}

/**
 * Clear the session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_SESSION_COOKIE)
}
