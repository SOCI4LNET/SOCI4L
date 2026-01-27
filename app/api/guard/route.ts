import { NextRequest, NextResponse } from 'next/server'

/**
 * Guard token set endpoint
 * Kullanım: /api/guard?token=YOUR_SECRET_TOKEN
 * Doğru token ile erişildiğinde cookie set eder ve ana sayfaya yönlendirir
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const providedToken = searchParams.get('token')
  const expectedToken = process.env.SITE_GUARD_TOKEN

  if (!expectedToken) {
    return new NextResponse('Guard not configured', { status: 500 })
  }

  if (!providedToken || providedToken !== expectedToken) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Token doğru, cookie set et ve ana sayfaya yönlendir
  const response = NextResponse.redirect(new URL('/', request.url))
  
  response.cookies.set({
    name: 'site_guard',
    value: providedToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 gün
  })

  return response
}
