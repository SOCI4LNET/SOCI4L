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

    // UTM params
    const utmSource = (body.utmSource as string | undefined) || null
    const utmMedium = (body.utmMedium as string | undefined) || null
    const utmCampaign = (body.utmCampaign as string | undefined) || null
    const utmTerm = (body.utmTerm as string | undefined) || null
    const utmContent = (body.utmContent as string | undefined) || null

    const userAgent = request.headers.get('user-agent') || ''
    const country =
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry') ||
      null

    // Bot detection regex
    const botRegex = /bot|crawl|spider|mediapartners|slurp|patrol|facebookexternalhit|whatsapp|telegrambot|twitterbot|pinterest|googlebot|bingbot|yandexbot|duckduckbot/i
    const isBot = botRegex.test(userAgent)

    // Simple device detection
    let device = 'Desktop'
    if (/mobile/i.test(userAgent)) {
      device = 'Mobile'
    } else if (/tablet|ipad/i.test(userAgent)) {
      device = 'Tablet'
    } else if (/android/i.test(userAgent)) {
      device = 'Android'
    } else if (/iphone|ipod/i.test(userAgent)) {
      device = 'iPhone'
    }

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
        country,
        device,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        isBot,
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

