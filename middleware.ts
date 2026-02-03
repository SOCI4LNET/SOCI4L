import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DOCS_ADMIN_SESSION_COOKIE } from './lib/docs-auth'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

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
