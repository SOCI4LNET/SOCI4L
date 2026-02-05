import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const type = body.type as string | undefined
    const profileId = (body.profileId as string | undefined)?.toLowerCase()

    if (!type || !profileId) {
      return NextResponse.json(
        { error: 'type and profileId are required' },
        { status: 400 },
      )
    }

    if (!isValidAddress(profileId)) {
      return NextResponse.json(
        { error: 'Invalid profileId' },
        { status: 400 },
      )
    }

    if (type !== 'profile_view' && type !== 'link_click') {
      return NextResponse.json(
        { error: 'Unsupported analytics event type' },
        { status: 400 },
      )
    }

    const visitorWallet = (body.visitorWallet as string | undefined) || null
    const source = (body.source as string | undefined) || 'unknown'
    const referrer = (body.referrer as string | undefined) || null
    const linkId = (body.linkId as string | undefined) || null
    const linkTitle = (body.linkTitle as string | undefined) || null
    const linkUrl = (body.linkUrl as string | undefined) || null
    const categoryId = (body.categoryId as string | undefined) || null

    await prisma.analyticsEvent.create({
      data: {
        type,
        profileId,
        visitorWallet,
        source,
        referrer,
        linkId,
        linkTitle,
        linkUrl,
        categoryId,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[AnalyticsEvent API] Error creating analytics event', error)
    return NextResponse.json(
      { error: 'Failed to create analytics event' },
      { status: 500 },
    )
  }
}

