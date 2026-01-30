'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Activity, BarChart2, Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { isValidAddress, formatAddress } from '@/lib/utils'
import { type ProfileLayoutConfig } from '@/lib/profile-layout'
import Link from 'next/link'

type TimeRange = '24h' | '7d' | '30d' | 'all'

interface PageProps {
  params: {
    id: string
  }
}

interface LinkItem {
  id: string
  title: string
  url: string
  enabled: boolean
  order: number
  createdAt: string
  updatedAt: string
}

interface Profile {
  address: string
  slug: string | null
  displayName?: string | null
  bio?: string | null
}

interface PublicInsightsData {
  profile: Profile | null
  links: LinkItem[]
  layout: ProfileLayoutConfig
  analytics: {
    totalProfileViews: number
    totalLinkClicks: number
    ctr: number | null
    topLinks: Array<{
      id: string
      title: string
      url: string
      clicks: number
    }>
    topCategories: Array<{
      id: string
      name: string
      clicks: number
      share: number
    }>
  }
}

export default function PublicInsightsPage({ params }: PageProps) {
  const [data, setData] = useState<PublicInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<TimeRange>('7d')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const isAddress = params.id.startsWith('0x') && isValidAddress(params.id)

        let response: Response
        if (isAddress) {
          const normalizedAddress = params.id.toLowerCase()
          response = await fetch(`/api/profile/insights?address=${normalizedAddress}`, {
            cache: 'no-store',
          })
        } else {
          response = await fetch(`/api/profile/insights?slug=${params.id}`, {
            cache: 'no-store',
          })
        }

        const result = await response.json()

        if (result.error) {
          if (response.status === 404) {
            setError('Profile not found')
          } else {
            setError(result.error)
          }
        } else {
          setData(result)
        }
      } catch (err) {
        setError('Failed to load insights')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  // Check if Links block is enabled in layout config
  const linksBlockEnabled = useMemo(() => {
    if (!data?.layout) return false
    const linksBlock = data.layout.blocks.find((b) => b.key === 'links')
    return linksBlock?.enabled ?? false
  }, [data?.layout])

  // Filter top links to top 5
  const topLinks = useMemo(() => {
    if (!data?.analytics.topLinks) return []
    return data.analytics.topLinks.slice(0, 5)
  }, [data?.analytics.topLinks])

  // Format CTR
  const ctrLabel = useMemo(() => {
    if (data?.analytics.ctr === null || data?.analytics.ctr === undefined) {
      return '—'
    }
    return `${(data.analytics.ctr * 100).toFixed(1)}%`
  }, [data?.analytics.ctr])

  // Get profile identifier for display
  const profileIdentifier = useMemo(() => {
    if (!data?.profile) return null
    return data.profile.slug || formatAddress(data.profile.address)
  }, [data?.profile])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">{error || 'Failed to load insights'}</p>
                <Link
                  href={`/p/${params.id}`}
                  className="mt-4 inline-block text-sm text-primary hover:underline"
                >
                  View profile
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const hasActivity = data.analytics.totalProfileViews > 0 || data.analytics.totalLinkClicks > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          {data.profile && (
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://effigy.im/a/${data.profile.address.toLowerCase()}.svg`} />
              <AvatarFallback>
                {data.profile.displayName?.[0]?.toUpperCase() || profileIdentifier?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold truncate">
              {data.profile?.displayName || profileIdentifier || 'Public Insights'}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Public Insights (read-only)
            </p>
          </div>
          <Link
            href={`/p/${params.id}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View Profile
          </Link>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <Tabs value={range} onValueChange={(v) => setRange(v as TimeRange)}>
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="24h" className="text-xs">24h</TabsTrigger>
              <TabsTrigger value="7d" className="text-xs">7d</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs">30d</TabsTrigger>
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {!hasActivity ? (
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground">No public insights yet for this time range.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Profile views and link clicks will appear here once tracked.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <Card className="bg-card border border-border/60 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Profile Views
                  </CardTitle>
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-2xl font-semibold">
                    {data.analytics.totalProfileViews.toLocaleString('en-US')}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border/60 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Link Clicks
                  </CardTitle>
                  <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-2xl font-semibold">
                    {data.analytics.totalLinkClicks.toLocaleString('en-US')}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    CTR
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-2xl font-semibold">{ctrLabel}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Click-through rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Links - Only show if Links block is enabled */}
            {linksBlockEnabled && topLinks.length > 0 && (
              <Card className="bg-card border border-border/60 shadow-sm mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Top Links</CardTitle>
                  <CardDescription className="text-xs">
                    Most clicked links in the selected time range.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between rounded-md border border-border/40 bg-background/60 px-3 py-2 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{link.title || link.url}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{link.url}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="font-medium">{link.clicks.toLocaleString('en-US')}</p>
                          <p className="text-[11px] text-muted-foreground">clicks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Categories */}
            {data.analytics.topCategories.length > 0 && (
              <Card className="bg-card border border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
                  <CardDescription className="text-xs">
                    Category performance sorted by clicks.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.analytics.topCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between rounded-md border border-border/40 bg-background/60 px-3 py-2 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{category.name}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="font-medium">{category.clicks.toLocaleString('en-US')}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {Math.round(category.share * 100)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
