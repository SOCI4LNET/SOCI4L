import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Parse analytics source from URL query parameters
 * Server-safe version (doesn't use localStorage)
 */
function getSourceFromUrl(searchParams: URLSearchParams): 'profile' | 'qr' | 'copy' | 'unknown' {
  const source = searchParams.get('source')
  
  if (source === 'profile' || source === 'qr' || source === 'copy') {
    return source
  }
  
  return 'unknown'
}

/**
 * Redirect endpoint for tracking link clicks
 * Route: /r/[linkId]
 * 
 * This endpoint:
 * 1. Looks up the link by ID
 * 2. Gets the profile address for tracking
 * 3. Records the click event (client-side via localStorage)
 * 4. Redirects to the actual URL
 * 
 * Note: Analytics tracking happens client-side via localStorage
 * because this is a server-side redirect. The client will need to
 * call trackLinkClick after the redirect completes, or we use
 * a client-side redirect page that tracks before redirecting.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> | { linkId: string } }
) {
  // Handle both sync and async params (Next.js 13+ vs 15+)
  const resolvedParams = await Promise.resolve(params)
  const linkId = resolvedParams.linkId

  if (!linkId) {
    return NextResponse.json({ error: 'Link ID required' }, { status: 400 })
  }

  try {
    // Find the link
    const link = await prisma.profileLink.findUnique({
      where: { id: linkId },
      include: {
        profile: {
          select: {
            address: true,
          },
        },
        category: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    if (!link.enabled) {
      return NextResponse.json({ error: 'Link is disabled' }, { status: 403 })
    }

    const profileAddress = link.profile.address.toLowerCase()
    const categoryId = link.category?.id || null

    // Get source from URL query params
    const searchParams = request.nextUrl.searchParams
    const source = getSourceFromUrl(searchParams)

    // Build absolute URL for redirect (required by Next.js)
    const baseUrl = request.nextUrl.origin
    const trackingUrl = new URL(`/r/${linkId}/track`, baseUrl)
    trackingUrl.searchParams.set('url', link.url)
    trackingUrl.searchParams.set('profileId', profileAddress)
    if (categoryId) {
      trackingUrl.searchParams.set('categoryId', categoryId)
    }
    // Include link title for analytics persistence
    if (link.title) {
      trackingUrl.searchParams.set('title', link.title)
    }
    trackingUrl.searchParams.set('source', source)

    return NextResponse.redirect(trackingUrl.toString())
  } catch (error) {
    console.error('[Redirect] Error processing link redirect:', error)
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('[Redirect] Error details:', {
        message: error.message,
        stack: error.stack,
        linkId,
      })
    }
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined },
      { status: 500 }
    )
  }
}
