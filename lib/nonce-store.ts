/**
 * In-memory nonce store with TTL and replay protection
 * In production, consider using Redis or similar
 */

interface NonceRecord {
  nonce: string
  issuedAt: number
  used: boolean
  address?: string // Optional: can be bound to specific address
}

// In-memory store: nonce -> NonceRecord
const nonceStore = new Map<string, NonceRecord>()

// TTL: 5 minutes in milliseconds
const NONCE_TTL = 5 * 60 * 1000

// Cleanup interval: remove expired nonces every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [nonce, record] of nonceStore.entries()) {
      if (now - record.issuedAt > NONCE_TTL) {
        nonceStore.delete(nonce)
      }
    }
  }, 60 * 1000) // Run cleanup every minute
}

/**
 * Store a new nonce
 */
export function storeNonce(nonce: string, address?: string): void {
  nonceStore.set(nonce, {
    nonce,
    issuedAt: Date.now(),
    used: false,
    address: address?.toLowerCase(),
  })
}

/**
 * Get nonce record if it exists and is valid
 */
export function getNonce(nonce: string): NonceRecord | null {
  const record = nonceStore.get(nonce)
  if (!record) {
    return null
  }

  // Check if expired
  const now = Date.now()
  if (now - record.issuedAt > NONCE_TTL) {
    nonceStore.delete(nonce)
    return null
  }

  return record
}

/**
 * Mark nonce as used (replay protection)
 */
export function markNonceAsUsed(nonce: string): boolean {
  const record = getNonce(nonce)
  if (!record) {
    return false
  }

  if (record.used) {
    return false // Already used
  }

  record.used = true
  return true
}

/**
 * Check if nonce is valid and not used
 */
export function isValidNonce(nonce: string): boolean {
  const record = getNonce(nonce)
  return record !== null && !record.used
}

/**
 * Cleanup expired nonces (manual call if needed)
 */
export function cleanupExpiredNonces(): number {
  const now = Date.now()
  let cleaned = 0
  for (const [nonce, record] of nonceStore.entries()) {
    if (now - record.issuedAt > NONCE_TTL) {
      nonceStore.delete(nonce)
      cleaned++
    }
  }
  return cleaned
}
