import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/admin-audit'
// No changes needed for imports as they are relative or lib. 
// However, I should check if there are any hardcoded links in the export routes redirects or similar. 
// Based on grep, there were no hardcoded redirects in export routes, just imports.
// I will just update the log message in the export routes if they exist to be accurate.

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10000', 10)

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
        return `"${profile.address}","${profile.slug || ''}","${profile.displayName || ''}","${profile.status}","${profile.visibility}","${profile.claimedAt?.toISOString() || ''}","${profile.createdAt.toISOString()}","${profile.updatedAt.toISOString()}","${followers}"`
      })
      .join('\n')

    const csv = csvHeader + csvRows

    // Best-effort audit log
    const adminAddress = request.headers.get('x-admin-address')
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
    console.error('[Admin Export] Error exporting users:', error)
    return NextResponse.json({ error: 'Failed to export users' }, { status: 500 })
  }
}
