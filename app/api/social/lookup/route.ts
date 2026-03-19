import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Explicit list of origins allowed to query the social lookup endpoint (LOW-9).
// Wildcard '*' was removed because it enables unrestricted cross-origin
// scraping of profile data.  Add your production domain and any approved
// browser-extension origins here.
const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_APP_URL ?? '',
  'chrome-extension://your-extension-id', // replace with real extension ID
].filter(Boolean))

function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : ''

  if (!allowedOrigin) {
    return {}
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  }
}

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req)
  const { searchParams } = new URL(req.url)
  const platform = searchParams.get('platform')
  const handle = searchParams.get('handle')

  if (!platform || !handle) {
    return NextResponse.json({ error: 'Missing platform or handle' }, { status: 400, headers: corsHeaders })
  }

  try {
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle

    const socialConnection = await prisma.socialConnection.findFirst({
      where: {
        platform: platform,
        OR: [
          { platformUsername: { equals: cleanHandle, mode: 'insensitive' } },
          { platformUsername: { equals: `@${cleanHandle}`, mode: 'insensitive' } },
        ],
      },
      include: {
        profile: true,
      },
    })

    if (!socialConnection) {
      return NextResponse.json({ isVerified: false }, { status: 200, headers: corsHeaders })
    }

    const { profile } = socialConnection

    return NextResponse.json(
      {
        isVerified: true,
        profile: {
          displayName: profile.displayName,
          slug: profile.slug,
          address: profile.address,
          bio: profile.bio,
          avatarUrl: `https://effigy.im/a/${profile.address}.svg`,
          verifiedAt: socialConnection.verifiedAt,
        },
      },
      { status: 200, headers: corsHeaders },
    )
  } catch (error) {
    console.error('[API] Lookup Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req)
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}
