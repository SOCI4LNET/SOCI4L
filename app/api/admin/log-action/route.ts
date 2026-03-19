import { NextRequest, NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/admin-audit'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * API endpoint to log admin actions from client-side.
 * Admin address is passed via metadata from the client.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, targetType, targetId, metadata } = body

    // Verify admin session
    const adminAddress = await requireAdmin('api')

    await logAdminAction({
      adminAddress,
      action,
      targetType,
      targetId,
      metadata,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    const message = String(error?.message || '')
    if (message.includes('Unauthorized:') || message.includes('Forbidden:')) {
      // Silently ignore auth errors for logging to prevent console spam
      // when client and server session states are temporarily mismatched
      return NextResponse.json({ success: false, ignored: true }, { status: 200 })
    }

    console.error('[POST /api/admin/log-action] Error', error)
    return NextResponse.json(
      { error: 'Failed to log action' },
      { status: 500 },
    )
  }
}
