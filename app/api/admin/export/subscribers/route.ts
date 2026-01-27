import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
