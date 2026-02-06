import { NextRequest, NextResponse } from 'next/server'
import { getSessionAddress } from '@/lib/auth'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/admin-audit'

export async function GET(request: NextRequest) {
  try {
    // 1. Verify Admin Auth
    const sessionAddress = await getSessionAddress()
    if (!sessionAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminProfile = await prisma.profile.findUnique({
      where: { address: sessionAddress.toLowerCase() },
    })

    if (!adminProfile || adminProfile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

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
