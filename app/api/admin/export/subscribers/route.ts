import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/admin-audit'

import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const adminAddress = await requireAdmin('api')
    const subscribers = await prisma.emailSubscription.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Generate CSV
    const csvHeader = 'Email,Subscribed At,Last Updated\n'
    const csvRows = subscribers
      .map(
        (sub) =>
          `"${sub.email}","${sub.createdAt.toISOString()}","${sub.updatedAt.toISOString()}"`,
      )
      .join('\n')

    const csv = csvHeader + csvRows

    // Best-effort audit log
    await logAdminAction({
      adminAddress,
      action: 'export_subscribers',
      targetType: 'export',
      targetId: null,
      metadata: {
        count: subscribers.length,
      },
    })

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="soci4l-subscribers-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error: any) {
    const message = String(error?.message || '')
    if (message.includes('Unauthorized:')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (message.includes('Forbidden:')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.error('[Admin Export] Error exporting subscribers:', error)
    return NextResponse.json(
      { error: 'Failed to export subscribers' },
      { status: 500 },
    )
  }
}
