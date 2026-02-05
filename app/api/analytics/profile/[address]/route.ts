import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

export async function GET(
  _request: NextRequest,
  context: { params: { address: string } },
) {
  try {
    const rawAddress = context.params.address
    if (!rawAddress) {
      return NextResponse.json(
        { error: 'Missing address parameter' },
        { status: 400 },
      )
    }

    const decoded = decodeURIComponent(rawAddress)
    const normalizedAddress = decoded.toLowerCase()

    if (!isValidAddress(normalizedAddress)) {
      return NextResponse.json(
        { error: 'Invalid address' },
        { status: 400 },
      )
    }

    const limit = parseInt(_request.nextUrl.searchParams.get('limit') || '100')
    const offset = parseInt(_request.nextUrl.searchParams.get('offset') || '0')

    const events = await prisma.analyticsEvent.findMany({
      where: {
        profileId: normalizedAddress,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit > 0 ? (limit > 500 ? 500 : limit) : 100,
      skip: offset >= 0 ? offset : 0,
      select: {
        id: true,
        type: true,
        profileId: true,
        linkId: true,
        linkTitle: true,
        linkUrl: true,
        categoryId: true,
        source: true,
        referrer: true,
        createdAt: true,
        visitorWallet: true
      }
    })

    const mapped = events.map((event) => ({
      type: event.type === 'link_click' ? 'link_click' as const : 'profile_view' as const,
      profileId: event.profileId,
      linkId: event.linkId ?? undefined,
      linkTitle: event.linkTitle ?? undefined,
      linkUrl: event.linkUrl ?? undefined,
      categoryId: event.categoryId ?? undefined,
      ts: event.createdAt.getTime(),
      source:
        event.source === 'profile' ||
          event.source === 'qr' ||
          event.source === 'copy' ||
          event.source === 'extension'
          ? (event.source as 'profile' | 'qr' | 'copy' | 'extension')
          : ('unknown' as const),
      visitorWallet: event.visitorWallet ?? undefined,
    }))

    return NextResponse.json({
      events: mapped,
    })
  } catch (error: any) {
    console.error('[GET /api/analytics/profile/[address]] Unexpected error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

