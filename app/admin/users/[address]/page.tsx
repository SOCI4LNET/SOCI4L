import { prisma } from '@/lib/prisma'
import { PageShell } from '@/components/app-shell/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateScore, getScoreTier } from '@/lib/score'
import { UserAnalyticsCharts } from '@/components/admin/user-analytics-charts'
import { getScoreHistory } from '@/lib/score-snapshot'
import { getWalletData } from '@/lib/avalanche'

// Force dynamic rendering since this page uses Prisma queries and dynamic params
export const dynamic = 'force-dynamic'

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

  // Fetch wallet summary directly (server-side, no HTTP fetch needed)
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
    // Add timeout to prevent hanging (8 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Wallet data fetch timeout')), 8000)
    )
    
    const walletData = await Promise.race([
      getWalletData(normalizedAddress),
      timeoutPromise,
    ]) as any

    const isClaimed = Boolean(
      profile && 
      (profile.claimedAt || profile.displayName || profile.slug || profile.status === 'CLAIMED')
    )

    walletSummary = {
      balance: walletData?.nativeBalance || '0',
      transactionCount: walletData?.txCount || 0,
      tokenCount: walletData?.tokenBalances?.length || 0,
      nftCount: walletData?.nfts?.length || 0,
      claimed: isClaimed,
      visibility: profile?.visibility || 'PUBLIC',
      networkOk: true,
    }
  } catch (error: any) {
    // Silently handle errors - wallet summary is optional for admin view
    if (error.message !== 'Wallet data fetch timeout') {
      console.error('[Admin User Detail] Error fetching wallet data:', error)
    }
    // Set default values on error
    const isClaimed = Boolean(
      profile && 
      (profile.claimedAt || profile.displayName || profile.slug || profile.status === 'CLAIMED')
    )
    walletSummary = {
      balance: '0',
      transactionCount: 0,
      tokenCount: 0,
      nftCount: 0,
      claimed: isClaimed,
      visibility: profile?.visibility || 'PUBLIC',
      networkOk: true,
    }
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="transition-all duration-200 hover:shadow-md hover:border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Address</span>
              <div className="font-mono text-xs break-all text-foreground">{data.address}</div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Display Name</span>
              <div className="text-foreground">{data.profile?.displayName || <span className="text-muted-foreground">—</span>}</div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Slug</span>
              <div className="text-foreground">{data.profile?.slug || <span className="text-muted-foreground">—</span>}</div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
              <span className="inline-flex items-center rounded-full bg-muted/80 px-2.5 py-1 text-xs font-medium">
                {data.profile?.status === 'CLAIMED' || data.profile?.claimedAt ? 'Claimed' : 'Unclaimed'}
              </span>
              <span className="inline-flex items-center rounded-full bg-muted/80 px-2.5 py-1 text-xs font-medium">
                {data.profile?.visibility === 'PRIVATE' ? 'Private' : 'Public'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md hover:border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1">
              <div className="text-3xl font-semibold tracking-tight">
                {data.score}
                <span className="ml-1.5 text-base text-muted-foreground font-normal">pts</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Tier: <span className="font-semibold text-foreground">{data.scoreTier.label}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Followers</span>
                <span className="font-medium text-foreground">{data.breakdown.followers}</span>
              </div>
              <div className="flex justify-between">
                <span>Profile Links</span>
                <span className="font-medium text-foreground">{data.breakdown.profileLinks}</span>
              </div>
              <div className="flex justify-between">
                <span>Social Links</span>
                <span className="font-medium text-foreground">{data.breakdown.socialLinks}</span>
              </div>
              <div className="flex justify-between">
                <span>Profile Completion</span>
                <span className="font-medium text-foreground">{data.breakdown.profileClaimed + data.breakdown.displayName + data.breakdown.bio}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md hover:border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Social</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Followers</span>
              <div className="text-2xl font-semibold tracking-tight">
                {data.followersCount.toLocaleString('en-US')}
              </div>
            </div>
            <div className="space-y-1 pt-3 border-t border-border/60">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Following</span>
              <div className="text-2xl font-semibold tracking-tight">
                {data.followingCount.toLocaleString('en-US')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {data.walletSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="transition-all duration-200 hover:shadow-md hover:border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">AVAX Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-semibold tracking-tight">
                {parseFloat(data.walletSummary.balance || '0').toFixed(4)}
              </div>
              <p className="text-xs text-muted-foreground">Native balance from wallet summary</p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md hover:border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tokens & NFTs</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tokens</span>
                <span className="font-semibold">{data.walletSummary.tokenCount}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/60">
                <span className="text-muted-foreground">NFTs</span>
                <span className="font-semibold">{data.walletSummary.nftCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md hover:border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Transactions</span>
                <span className="font-semibold">{data.walletSummary.transactionCount}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/60">
                <span className="text-muted-foreground">Network</span>
                <span className={`font-semibold ${data.walletSummary.networkOk ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {data.walletSummary.networkOk ? 'OK' : 'Error'}
                </span>
              </div>
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

