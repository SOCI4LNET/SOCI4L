import { prisma } from '@/lib/prisma'
import { PageShell } from '@/components/app-shell/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateScore, getScoreTier } from '@/lib/score'
import { UserAnalyticsCharts } from '@/components/admin/user-analytics-charts'
import { getScoreHistory } from '@/lib/score-snapshot'

interface AdminUserPageProps {
  params: {
    address: string
  }
}

async function getUserData(rawAddress: string) {
  const decoded = decodeURIComponent(rawAddress)
  const normalizedAddress = decoded.toLowerCase()

  const profile = await prisma.profile.findUnique({
    where: { address: normalizedAddress },
    include: {
      links: {
        where: { enabled: true },
      },
    },
  })

  const [followersCount, followingCount] = await Promise.all([
    prisma.follow.count({
      where: { followingAddress: normalizedAddress },
    }),
    prisma.follow.count({
      where: { followerAddress: normalizedAddress },
    }),
  ])

  let socialLinksCount = 0
  if (profile?.socialLinks) {
    try {
      const parsed = JSON.parse(profile.socialLinks)
      if (Array.isArray(parsed)) {
        socialLinksCount = parsed.length
      }
    } catch {
      // ignore parse errors
    }
  }

  const profileLinksCount = profile?.links.length ?? 0

  const scoreInput = {
    isClaimed: Boolean(
      profile &&
        (profile.claimedAt ||
          profile.displayName ||
          profile.slug ||
          profile.status === 'CLAIMED'),
    ),
    displayName: profile?.displayName || null,
    bio: profile?.bio || null,
    socialLinksCount,
    profileLinksCount,
    followersCount,
  }

  const breakdown = calculateScore(scoreInput)
  const tier = getScoreTier(breakdown.total)

  // Fetch score history
  const scoreHistory = await getScoreHistory(normalizedAddress, 30)

  // Fetch analytics data
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [profileViews, linkClicks, topClickedLinks] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: {
        type: 'profile_view',
        profileId: normalizedAddress,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        type: 'link_click',
        profileId: normalizedAddress,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.analyticsEvent.groupBy({
      by: ['linkId', 'linkTitle', 'linkUrl'],
      where: {
        type: 'link_click',
        profileId: normalizedAddress,
        linkId: { not: null },
      },
      _count: { linkId: true },
      orderBy: { _count: { linkId: 'desc' } },
      take: 10,
    }),
  ])

  // Prepare time series data (daily buckets for last 30 days)
  const dailyBuckets: Map<string, { date: string; views: number; clicks: number }> = new Map()
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = date.toISOString().split('T')[0]
    dailyBuckets.set(dateKey, { date: dateKey, views: 0, clicks: 0 })
  }

  profileViews.forEach((event) => {
    const dateKey = event.createdAt.toISOString().split('T')[0]
    const bucket = dailyBuckets.get(dateKey)
    if (bucket) {
      bucket.views++
    }
  })

  linkClicks.forEach((event) => {
    const dateKey = event.createdAt.toISOString().split('T')[0]
    const bucket = dailyBuckets.get(dateKey)
    if (bucket) {
      bucket.clicks++
    }
  })

  const timeSeriesData = Array.from(dailyBuckets.values()).map((bucket) => ({
    date: new Date(bucket.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: bucket.views,
    clicks: bucket.clicks,
  }))

  const totalProfileViews = profileViews.length
  const totalLinkClicks = linkClicks.length

  // Fetch wallet summary via existing API (wallet summary endpoint)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://soci4l.net'
  let walletSummary: {
    balance: string
    transactionCount: number
    tokenCount: number
    nftCount: number
    claimed: boolean
    visibility: string
    networkOk: boolean
  } | null = null

  try {
    const summaryRes = await fetch(
      `${appUrl}/api/wallet/${normalizedAddress}/summary`,
      {
        cache: 'no-store',
      },
    )
    if (summaryRes.ok) {
      const json = await summaryRes.json()
      walletSummary = {
        balance: json.balance,
        transactionCount: json.transactionCount,
        tokenCount: json.tokenCount,
        nftCount: json.nftCount,
        claimed: json.claimed,
        visibility: json.visibility,
        networkOk: json.networkOk,
      }
    }
  } catch {
    walletSummary = null
  }

  return {
    address: normalizedAddress,
    profile,
    followersCount,
    followingCount,
    score: breakdown.total,
    scoreTier: tier,
    breakdown,
    walletSummary,
    analytics: {
      timeSeriesData,
      totalProfileViews,
      totalLinkClicks,
      topClickedLinks: topClickedLinks.map((row) => ({
        linkId: row.linkId || null,
        linkTitle: row.linkTitle || 'Untitled Link',
        linkUrl: row.linkUrl || null,
        clicks: row._count.linkId,
      })),
    },
    scoreHistory,
  }
}

export default async function AdminUserDetailPage({ params }: AdminUserPageProps) {
  const data = await getUserData(params.address)

  const title =
    data.profile?.displayName ||
    data.profile?.slug ||
    data.address

  return (
    <PageShell
      title={`User: ${title}`}
      subtitle="Admin view of a single SOCI4L profile."
      mode="constrained"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Address</span>
              <div className="font-mono text-xs break-all">{data.address}</div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Display Name</span>
              <div>{data.profile?.displayName || <span className="text-muted-foreground">—</span>}</div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Slug</span>
              <div>{data.profile?.slug || <span className="text-muted-foreground">—</span>}</div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5">
                {data.profile?.status === 'CLAIMED' || data.profile?.claimedAt ? 'Claimed' : 'Unclaimed'}
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5">
                {data.profile?.visibility === 'PRIVATE' ? 'Private' : 'Public'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="text-3xl font-semibold">
              {data.score}
              <span className="ml-1 text-base text-muted-foreground">pts</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Tier: <span className="font-semibold">{data.scoreTier.label}</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <div>Followers: {data.breakdown.followers}</div>
              <div>Profile Links: {data.breakdown.profileLinks}</div>
              <div>Social Links: {data.breakdown.socialLinks}</div>
              <div>Profile Completion: {data.breakdown.profileClaimed + data.breakdown.displayName + data.breakdown.bio}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Followers</span>
              <div className="text-lg font-semibold">
                {data.followersCount.toLocaleString('en-US')}
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Following</span>
              <div className="text-lg font-semibold">
                {data.followingCount.toLocaleString('en-US')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {data.walletSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>AVAX Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {parseFloat(data.walletSummary.balance || '0').toFixed(4)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Native balance from wallet summary</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tokens & NFTs</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>Tokens: {data.walletSummary.tokenCount}</div>
              <div>NFTs: {data.walletSummary.nftCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>Transactions: {data.walletSummary.transactionCount}</div>
              <div>Network OK: {data.walletSummary.networkOk ? 'Yes' : 'No'}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <UserAnalyticsCharts
        timeSeriesData={data.analytics.timeSeriesData}
        totalProfileViews={data.analytics.totalProfileViews}
        totalLinkClicks={data.analytics.totalLinkClicks}
        topClickedLinks={data.analytics.topClickedLinks}
        scoreHistory={data.scoreHistory}
      />
    </PageShell>
  )
}

