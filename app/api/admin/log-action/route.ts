import { NextRequest, NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/admin-audit'

/**
 * API endpoint to log admin actions from client-side.
 * Admin address is passed via metadata from the client.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, targetType, targetId, metadata } = body

    // Get admin address from metadata (client-side passes it)
    const adminAddress = metadata?.adminAddress || null

    await logAdminAction({
      adminAddress,
      action,
      targetType,
      targetId,
      metadata,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[POST /api/admin/log-action] Error', error)
    return NextResponse.json(
      { error: 'Failed to log action' },
      { status: 500 },
    )
  }
}
