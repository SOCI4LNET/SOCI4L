import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DOCS_ADMIN_SESSION_COOKIE } from './lib/docs-auth'

// Simple in-memory rate limiter
// Note: In a serverless/edge environment, this map is not shared across instances.
// It provides basic protection against rapid-fire requests from a single source to a single instance.
const rateLimit = new Map<string, { count: number; lastReset: number }>()

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'

    // Rate Limiting for API routes
    if (pathname.startsWith('/api')) {
        const now = Date.now()
        const windowMs = 60 * 1000 // 1 minute
        const limit = 100 // requests per minute

        const requestLog = rateLimit.get(ip) || { count: 0, lastReset: now }

        // Reset window if passed
        if (now - requestLog.lastReset > windowMs) {
            requestLog.count = 0
            requestLog.lastReset = now
        }

        requestLog.count++
        rateLimit.set(ip, requestLog)

        if (requestLog.count > limit) {
            return new NextResponse('Too Many Requests', { status: 429 })
        }
    }

    // Protect /docs-admin routes
    if (pathname.startsWith('/docs-admin')) {
        // Allow login page and api routes (api handled separately)
        if (pathname === '/docs-admin/login' || pathname.startsWith('/api/')) {
            return NextResponse.next()
        }

        const sessionCookie = request.cookies.get(DOCS_ADMIN_SESSION_COOKIE)

        if (!sessionCookie) {
            const loginUrl = new URL('/docs-admin/login', request.url)
            return NextResponse.redirect(loginUrl)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
