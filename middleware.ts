import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Guard devre dışıysa hiçbir şey yapma
  if (process.env.SITE_GUARD_ENABLED !== 'true') {
    return NextResponse.next()
  }

  // Sadece production'da aktif (preview/dev'de açık)
  if (process.env.VERCEL_ENV !== 'production') {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Hariç tutulan path'ler
  const excludedPaths = [
    '/coming-soon',
    '/api/guard',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/api/health',
  ]

  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Cookie kontrolü
  const guardToken = request.cookies.get('site_guard')?.value
  const expectedToken = process.env.SITE_GUARD_TOKEN

  if (!expectedToken) {
    console.warn('SITE_GUARD_TOKEN not set, allowing access')
    return NextResponse.next()
  }

  // Token eşleşmiyor, coming soon'a yönlendir
  if (guardToken !== expectedToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/coming-soon'
    return NextResponse.redirect(url)
  }

  // Token doğru, ama her response'a noindex header ekle
  const response = NextResponse.next()
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Tüm route'lar dışında:
     * - api routes (ama /api/guard hariç, onu da dahil et)
     * - _next/static (build dosyaları)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     */
    '/((?!_next/static|_next/image).*)',
  ],
}
