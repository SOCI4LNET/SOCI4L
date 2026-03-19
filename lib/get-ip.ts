import type { NextRequest } from 'next/server'

/**
 * Safely extract the client IP address from a Next.js request.
 *
 * When running behind a trusted reverse proxy (Vercel, Cloudflare, etc.) the
 * real client IP is injected in platform-specific headers.  We prefer those
 * over the raw X-Forwarded-For header because X-Forwarded-For can be freely
 * forged by the client — an attacker can prepend arbitrary values to bypass
 * per-IP rate limiting or poison audit logs.
 *
 * Priority order:
 *   1. x-real-ip          — set by Vercel / nginx (single, trusted value)
 *   2. x-vercel-forwarded-for — Vercel's own injected forwarded header
 *   3. cf-connecting-ip   — Cloudflare's trusted single-IP header
 *   4. Last value in x-forwarded-for — the rightmost value is added by the
 *      nearest trusted proxy and is the hardest for a client to spoof when
 *      the proxy is configured to append (not trust) client-supplied values.
 *   5. '127.0.0.1' fallback for local development.
 */
export function getClientIp(request: NextRequest): string {
  // Prefer platform-injected single-IP headers — these cannot be spoofed
  const realIp =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-vercel-forwarded-for') ||
    request.headers.get('cf-connecting-ip')

  if (realIp) return realIp.trim()

  // Fall back to the rightmost value in X-Forwarded-For.
  // The rightmost entry is appended by the closest trusted proxy, making it
  // significantly harder for a client to spoof compared to the leftmost.
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',')
    const last = parts[parts.length - 1]?.trim()
    if (last) return last
  }

  return '127.0.0.1'
}
