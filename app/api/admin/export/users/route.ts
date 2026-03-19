import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/admin-audit'

// Escape CSV values to prevent CSV injection
function escapeCsvValue(value: string): string {
  if (!value) return ''
  // If value starts with =, +, -, @, tab, or carriage return, prefix with single quote
  if (/^[=+\-@\t\r]/.test(value)) {
    value = "'" + value
  }
  // Escape double quotes by doubling them
  return value.replace(/"/g, '""')
}

export async function GET(request: NextRequest) {
  try {
    // 1. Verify Admin Auth
    const adminAddress = await requireAdmin('api')

    const searchParams = request.nextUrl.searchParams
    const MAX_EXPORT_LIMIT = 10_000
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') || String(MAX_EXPORT_LIMIT), 10) || MAX_EXPORT_LIMIT),
      MAX_EXPORT_LIMIT,
    )

    const profiles = await prisma.profile.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        address: true,
        slug: true,
        displayName: true,
        status: true,
        visibility: true,
        claimedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Get follower counts for each profile
    const addresses = profiles.map((p) => p.address.toLowerCase())
    const followerCounts = await prisma.follow.groupBy({
      by: ['followingAddress'],
      where: {
        followingAddress: { in: addresses },
      },
      _count: { followingAddress: true },
    })

    const followerCountMap = new Map(
      followerCounts.map((f) => [f.followingAddress.toLowerCase(), f._count.followingAddress]),
    )

    // Generate CSV
    const csvHeader =
      'Address,Slug,Display Name,Status,Visibility,Claimed At,Created At,Updated At,Followers\n'
    const csvRows = profiles
      .map((profile) => {
        const followers = followerCountMap.get(profile.address.toLowerCase()) || 0
        return `"${escapeCsvValue(profile.address)}","${escapeCsvValue(profile.slug || '')}","${escapeCsvValue(profile.displayName || '')}","${escapeCsvValue(profile.status)}","${escapeCsvValue(profile.visibility)}","${profile.claimedAt?.toISOString() || ''}","${profile.createdAt.toISOString()}","${profile.updatedAt.toISOString()}","${followers}"`
      })
      .join('\n')

    const csv = csvHeader + csvRows

    // Best-effort audit log
    await logAdminAction({
      adminAddress,
      action: 'export_users',
      targetType: 'export',
      targetId: null,
      metadata: {
        limit,
        profileCount: profiles.length,
      },
    })

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="soci4l-users-${new Date().toISOString().split('T')[0]}.csv"`,
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

    console.error('[Admin Export] Error exporting users:', error)
    return NextResponse.json({ error: 'Failed to export users' }, { status: 500 })
  }
}
