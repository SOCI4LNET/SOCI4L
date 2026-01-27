import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/admin-audit'

export async function GET(request: NextRequest) {
  try {
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
    const adminAddress = request.headers.get('x-admin-address')
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
    console.error('[Admin Export] Error exporting subscribers:', error)
    return NextResponse.json(
      { error: 'Failed to export subscribers' },
      { status: 500 },
    )
  }
}
