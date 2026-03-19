const SESSION_TOKEN_ALG = 'HS256'

function base64UrlEncode(input: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'utf8').toString('base64url')
  }

  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(input: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'base64url').toString('utf8')
  }

  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function constantTimeEqual(a: string, b: string): boolean {
  // Avoid any early return that would leak the length of the expected value.
  // We iterate over the longer string so that the loop count is independent of
  // whether the lengths match, then fold the length difference into `result`.
  const lenA = a.length
  const lenB = b.length
  let result = lenA ^ lenB  // non-zero when lengths differ → always false
  const maxLen = Math.max(lenA, lenB)
  for (let i = 0; i < maxLen; i++) {
    // Use modulo to avoid out-of-bounds access while keeping branch-free logic.
    result |= a.charCodeAt(i % lenA) ^ b.charCodeAt(i % lenB)
  }
  return result === 0
}

async function hmacSha256(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const bytes = new Uint8Array(signature)

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url')
  }

  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export async function createSignedSessionToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const envelope = {
    alg: SESSION_TOKEN_ALG,
    payload,
  }
  const payloadPart = base64UrlEncode(JSON.stringify(envelope))
  const signaturePart = await hmacSha256(payloadPart, secret)
  return `${payloadPart}.${signaturePart}`
}

export async function verifySignedSessionToken<T extends Record<string, unknown>>(
  token: string,
  secret: string
): Promise<T | null> {
  const [payloadPart, signaturePart] = token.split('.')
  if (!payloadPart || !signaturePart) return null

  const expectedSignature = await hmacSha256(payloadPart, secret)
  if (!constantTimeEqual(signaturePart, expectedSignature)) return null

  try {
    const decoded = JSON.parse(base64UrlDecode(payloadPart))
    if (decoded?.alg !== SESSION_TOKEN_ALG || !decoded?.payload) return null
    return decoded.payload as T
  } catch {
    return null
  }
}
