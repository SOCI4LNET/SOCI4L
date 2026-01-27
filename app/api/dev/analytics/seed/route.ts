import { NextRequest, NextResponse } from 'next/server'
import { trackLinkClick, trackProfileView } from '@/lib/analytics'

/**
 * Dev-only endpoint to seed analytics data for testing
 * 
 * Usage: POST /api/dev/analytics/seed
 * Body: { address: string, linkId?: string }
 * 
 * This endpoint:
 * - Creates 1 profile view event
 * - Creates 1 link click event (if linkId provided)
 * 
 * Note: This only works in development mode and uses client-side
 * localStorage, so it must be called from the browser.
 */

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { address, linkId } = body

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    // Note: trackLinkClick and trackProfileView are client-side functions
    // that use localStorage. They cannot be called from the server.
    // This endpoint returns instructions for the client to call them.
    
    return NextResponse.json({
      success: true,
      message: 'Use client-side functions to seed data',
      instructions: {
        profileView: `trackProfileView('${address}', 'unknown')`,
        linkClick: linkId ? `trackLinkClick('${address}', '${linkId}', 'unknown', null)` : 'No linkId provided',
      },
      note: 'These functions must be called from the browser console or a client component',
    })
  } catch (error) {
    console.error('[Dev Analytics Seed] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
