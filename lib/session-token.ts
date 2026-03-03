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
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
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
