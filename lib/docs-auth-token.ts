import { createSignedSessionToken, verifySignedSessionToken } from '@/lib/session-token'

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export const DOCS_ADMIN_SESSION_COOKIE = 'soci4l_docs_admin_session'
export const DOCS_ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export interface DocsAdminSessionPayload {
  id: string
  address: string
  role: string
  iat: number
  exp: number
  typ: 'docs-admin'
}

function getDocsAdminSecret(): string | null {
  return process.env.DOCS_ADMIN_SESSION_SECRET || null
}

export async function createDocsAdminSessionToken(input: {
  id: string
  address: string
  role: string
}): Promise<string | null> {
  if (!input.id || !input.address || !input.role) return null

  const normalizedAddress = input.address.toLowerCase()
  if (!isValidAddress(normalizedAddress)) return null

  const secret = getDocsAdminSecret()
  if (!secret) {
    console.error('[DocsAuth] Missing docs-admin session secret.')
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  const payload: DocsAdminSessionPayload = {
    id: input.id,
    address: normalizedAddress,
    role: input.role,
    iat: now,
    exp: now + DOCS_ADMIN_SESSION_MAX_AGE_SECONDS,
    typ: 'docs-admin',
  }

  return createSignedSessionToken(payload, secret)
}

export async function verifyDocsAdminSessionToken(token: string): Promise<DocsAdminSessionPayload | null> {
  const secret = getDocsAdminSecret()
  if (!secret) {
    console.error('[DocsAuth] Missing docs-admin session secret.')
    return null
  }

  const payload = await verifySignedSessionToken<DocsAdminSessionPayload>(token, secret)
  if (!payload) return null
  if (payload.typ !== 'docs-admin' || !payload.id || !payload.role || !isValidAddress(payload.address)) return null

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp <= now) return null

  return payload
}
