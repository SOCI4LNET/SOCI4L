'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PageShell as LayoutShell } from '@/components/app-shell/page-shell'
import { ArrowLeft, Calendar, Copy, ExternalLink, Globe, LayoutGrid, Loader2, MousePointerClick, Smartphone, User, Link2, BarChart2, Clock, Activity, Info, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { getEventsForProfile, type AnalyticsEvent } from '@/lib/analytics'
import { useAccount, useSignMessage } from 'wagmi'
import { useTransaction } from '@/components/providers/transaction-provider'

type LinkItem = {
  id: string
  title: string
  url: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  type?: 'custom' | 'social'
  platform?: string
}

type StoredLinksState = {
  version: number
  updatedAt: string
  links: LinkItem[]
}

type TimeRange = '24h' | '7d' | '30d' | 'all'

const PRIMARY_LINKS_KEY = 'soci4l.links.v1'
const LEGACY_LINKS_KEY = 'soci4l.profileLinks.v1'

interface PageProps {
  params: {
    address: string
    linkId: string
  }
}

function loadLinksFromStorage(): LinkItem[] {
  if (typeof window === 'undefined') return []

  try {
    let raw = window.localStorage.getItem(PRIMARY_LINKS_KEY)
    if (!raw) {
      raw = window.localStorage.getItem(LEGACY_LINKS_KEY)
    }
    if (!raw) return []

    const parsed = JSON.parse(raw) as Partial<StoredLinksState> | null
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.links)) return []

    return parsed.links
      .filter(
        (link): link is LinkItem =>
          !!link &&
          typeof link.id === 'string' &&
          typeof link.url === 'string' &&
          typeof link.enabled === 'boolean'
      )
      .map((link) => ({
        ...link,
        title: link.title || '',
        createdAt: link.createdAt || new Date().toISOString(),
        updatedAt: link.updatedAt || new Date().toISOString(),
      }))
  } catch (error) {
    console.error('[LinkDetail] Failed to load links from localStorage', error)
    return []
  }
}

function persistLinksToStorage(next: LinkItem[]) {
  if (typeof window === 'undefined') return
  try {
    const payload: StoredLinksState = {
      version: 1,
      updatedAt: new Date().toISOString(),
      links: next,
    }
    window.localStorage.setItem(PRIMARY_LINKS_KEY, JSON.stringify(payload))
    window.localStorage.removeItem(LEGACY_LINKS_KEY)
  } catch (error) {
    console.error('[LinkDetail] Failed to persist links to localStorage', error)
  }
}

function shortenUrl(url: string, maxLength = 64): string {
  if (url.length <= maxLength) return url
  return url.slice(0, maxLength - 3) + '...'
}

function getRedirectPath(linkId: string): string {
  return `/r/${linkId}`
}

type Bucket = {
  label: string
  start: number
  end: number
  count: number
}

function buildBuckets(now: number, events: AnalyticsEvent[], range: TimeRange): Bucket[] {
  if (events.length === 0) return []

  const ONE_HOUR = 60 * 60 * 1000
  const ONE_DAY = 24 * ONE_HOUR

  if (range === '24h') {
    const bucketSize = ONE_HOUR
    const bucketCount = 24
    const start = now - bucketSize * bucketCount

    const buckets: Bucket[] = []
    for (let i = 0; i < bucketCount; i++) {
      const bucketStart = start + i * bucketSize
      const bucketEnd = bucketStart + bucketSize
      const labelDate = new Date(bucketStart)
      const hours = labelDate.getHours().toString().padStart(2, '0')
      const label = `${hours}:00`

      const count = events.filter(
        (e) => e.ts >= bucketStart && e.ts < bucketEnd && e.type === 'link_click'
      ).length

      buckets.push({ label, start: bucketStart, end: bucketEnd, count })
    }
    return buckets
  }

  // Daily buckets for 7d / 30d / all
  const bucketSize = ONE_DAY
  let bucketCount: number
  let start: number

  if (range === '7d') {
    bucketCount = 7
    start = now - bucketSize * (bucketCount - 1)
  } else if (range === '30d') {
    bucketCount = 30
    start = now - bucketSize * (bucketCount - 1)
  } else {
    // all: from earliest event day to today
    const minTs = Math.min(...events.map((e) => e.ts))
    const startDate = new Date(minTs)
    startDate.setHours(0, 0, 0, 0)
    const startMs = startDate.getTime()
    const diffDays = Math.max(0, Math.round((now - startMs) / bucketSize))
    bucketCount = diffDays + 1
    start = startMs
  }

  const buckets: Bucket[] = []
  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = start + i * bucketSize
    const bucketEnd = bucketStart + bucketSize
    const d = new Date(bucketStart)
    const label = `${d.getMonth() + 1}/${d.getDate()}`

    const count = events.filter(
      (e) => e.ts >= bucketStart && e.ts < bucketEnd && e.type === 'link_click'
    ).length

    buckets.push({ label, start: bucketStart, end: bucketEnd, count })
  }

  return buckets
}

export default function LinkInsightsPage({ params }: PageProps) {
  const router = useRouter()
  const { signMessageAsync } = useSignMessage()
  const { showTransactionLoader, hideTransactionLoader } = useTransaction()
  const [link, setLink] = useState<LinkItem | null>(null)
  const [linksLoaded, setLinksLoaded] = useState(false)
  const [range, setRange] = useState<TimeRange>('7d')

  const profileId = params.address.toLowerCase()
  const linkId = params.linkId
  const [loading, setLoading] = useState(true)
  const [serverEvents, setServerEvents] = useState<AnalyticsEvent[] | null>(null)
  const [clickPage, setClickPage] = useState(1)
  const CLICKS_PER_PAGE = 20

  useEffect(() => {
    const loadLink = async () => {
      try {
        setLoading(true)
        // 1. Try fetching regular links
        const response = await fetch(`/api/profile/links?address=${encodeURIComponent(profileId)}`)
        if (!response.ok) {
          throw new Error('Failed to load links')
        }
        const data = await response.json()
        const found = (data.links || []).find((item: any) => item.id === linkId) || null

        if (found) {
          setLink({
            id: found.id,
            title: found.title || '',
            url: found.url,
            enabled: found.enabled,
            createdAt: found.createdAt || new Date().toISOString(),
            updatedAt: found.updatedAt || new Date().toISOString(),
            type: 'custom',
          })
        } else {
          // 2. Try fetching social links (from wallet/profile endpoint)
          const cacheBust = `${Date.now()}-${Math.random().toString(36).substring(7)}`
          const profileResponse = await fetch(`/api/wallet?address=${encodeURIComponent(profileId)}&_t=${cacheBust}`, {
            cache: 'no-store',
          })

          if (profileResponse.ok) {
            const profileData = await profileResponse.json()
            const socialLinks = profileData.profile?.socialLinks || []
            const foundSocial = socialLinks.find((l: any) =>
              l.id === linkId || `social-${l.url}` === linkId
            )

            if (foundSocial) {
              setLink({
                id: linkId, // Keep the ID from params
                title: foundSocial.label || foundSocial.platform || 'Social Link',
                url: foundSocial.url,
                enabled: foundSocial.enabled !== false,
                createdAt: new Date().toISOString(), // Social links don't have stored timestamps usually
                updatedAt: new Date().toISOString(),
                type: 'social',
                platform: foundSocial.platform,
              })
            }
          }
        }
      } catch (error) {
        console.error('[LinkDetail] Failed to load link from API', error)
        // Fallback to localStorage for backward compatibility
        const links = loadLinksFromStorage()
        const found = links.find((item) => item.id === linkId) || null
        setLink(found)
      } finally {
        setLinksLoaded(true)
        setLoading(false)
      }
    }

    loadLink()

    // Load analytics events from server
    const loadAnalytics = async () => {
      try {
        const response = await fetch(
          `/api/analytics/profile/${encodeURIComponent(profileId)}`,
        )
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data.events)) {
            setServerEvents(data.events as AnalyticsEvent[])
          }
        }
      } catch (error) {
        console.error('[LinkDetail] Failed to load analytics from API', error)
      }
    }

    loadAnalytics()
  }, [linkId, profileId])

  useEffect(() => {
    setClickPage(1)
  }, [range])

  const analytics = useMemo(() => {
    const now = Date.now()

    // Use server-side analytics (empty array if not loaded yet)
    const allEvents = serverEvents || []

    const fromTs =
      range === 'all'
        ? 0
        : range === '24h'
          ? now - 24 * 60 * 60 * 1000
          : range === '7d'
            ? now - 7 * 24 * 60 * 60 * 1000
            : now - 30 * 24 * 60 * 60 * 1000

    // All link click events for this link (lifetime)
    const linkEventsAll = allEvents.filter(
      (e) => e.type === 'link_click' && e.linkId === linkId
    )

    // Link events in selected range
    const linkEvents =
      range === 'all' ? linkEventsAll : linkEventsAll.filter((e) => e.ts >= fromTs)

    const viewEventsAll = allEvents.filter((e) => e.type === 'profile_view')
    const viewEvents =
      range === 'all' ? viewEventsAll : viewEventsAll.filter((e) => e.ts >= fromTs)

    // Lifetime clicks (all time)
    const lifetimeClicks = linkEventsAll.length

    // Clicks in selected range
    const totalClicks = linkEvents.length
    const lastClickedTs =
      linkEventsAll.length > 0 ? Math.max(...linkEventsAll.map((e) => e.ts)) : null
    const viewsCount = viewEvents.length
    const ctr = viewsCount > 0 ? totalClicks / viewsCount : null

    const sourceCounts: Record<'profile' | 'copy' | 'qr' | 'unknown', number> = {
      profile: 0,
      copy: 0,
      qr: 0,
      unknown: 0,
    }

    for (const event of linkEvents) {
      if (event.type === 'link_click') {
        const source = event.source ?? 'unknown'
        // Map legacy 'share' to 'copy' for backward compatibility
        const normalizedSource = (source as string) === 'share' ? 'copy' : source
        if (normalizedSource === 'profile' || normalizedSource === 'copy' || normalizedSource === 'qr' || normalizedSource === 'unknown') {
          sourceCounts[normalizedSource] += 1
        } else {
          sourceCounts.unknown += 1
        }
      }
    }

    const buckets = buildBuckets(now, linkEvents, range)
    const maxBucketCount = buckets.length ? Math.max(...buckets.map((b) => b.count)) : 0

    // Calculate 7d and 30d clicks
    const now7d = now - 7 * 24 * 60 * 60 * 1000
    const now30d = now - 30 * 24 * 60 * 60 * 1000
    const clicks7d = linkEventsAll.filter((e) => e.ts >= now7d).length
    const clicks30d = linkEventsAll.filter((e) => e.ts >= now30d).length

    return {
      lifetimeClicks,
      totalClicks,
      clicks7d,
      clicks30d,
      lastClickedTs,
      viewsCount,
      ctr,
      sourceCounts,
      buckets,
      maxBucketCount,
    }
  }, [profileId, linkId, range, serverEvents])

  const handleCopyRedirect = async () => {
    const path = getRedirectPath(linkId)
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}${path}` : path

    try {
      await navigator.clipboard.writeText(url)
      toast.success('Redirect link copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleToggleEnabled = async () => {
    if (!link) return

    if (link.type === 'social') {
      try {
        // Social Link Toggle Logic
        // 1. Get nonce
        const nonceResponse = await fetch('/api/auth/nonce')
        if (!nonceResponse.ok) throw new Error('Failed to get nonce')
        const { nonce } = await nonceResponse.json()

        // 2. Sign message
        showTransactionLoader("Confirm in Wallet...")
        const message = `Update social profile for ${profileId}. Nonce: ${nonce}`
        const signature = await signMessageAsync({ message })

        showTransactionLoader("Saving changes...")

        // 3. Get current social links to ensure we update the latest state
        const cacheBust = `${Date.now()}-${Math.random().toString(36).substring(7)}`
        const profileResponse = await fetch(`/api/wallet?address=${encodeURIComponent(profileId)}&_t=${cacheBust}`, {
          cache: 'no-store',
        })
        if (!profileResponse.ok) throw new Error('Failed to load profile')
        const profileData = await profileResponse.json()
        const currentSocialLinks = profileData.profile?.socialLinks || []

        // 4. Update the specific link
        const updatedLinks = currentSocialLinks.map((l: any) =>
          (l.id === link.id || `social-${l.url}` === link.id)
            ? { ...l, enabled: !link.enabled }
            : l
        )

        // 5. Save
        const response = await fetch('/api/profile/social', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: profileId,
            socialLinks: updatedLinks,
            signature
          })
        })

        if (!response.ok) throw new Error('Failed to save social links')

        // 6. Update local state
        setLink({ ...link, enabled: !link.enabled })
        toast.success(link.enabled ? 'Link disabled' : 'Link enabled')

      } catch (error: any) {
        console.error('[LinkDetail] Failed to toggle social link', error)
        if (error?.message?.includes('User rejected') || error?.name === 'UserRejectedRequestError') {
          toast.error('Transaction rejected')
        } else {
          toast.error('Failed to update link')
        }
      } finally {
        hideTransactionLoader()
      }
      return
    }

    // Custom Link Toggle Logic (Existing)
    try {
      // Load all links
      const response = await fetch(`/api/profile/links?address=${encodeURIComponent(profileId)}`)
      if (!response.ok) {
        throw new Error('Failed to load links')
      }
      const data = await response.json()
      const links = data.links || []

      // Update the specific link
      const updatedLinks = links.map((item: any) =>
        item.id === link.id
          ? { ...item, enabled: !link.enabled }
          : item
      )

      // Save all links
      const saveResponse = await fetch('/api/profile/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: profileId,
          links: updatedLinks.map((item: any) => ({
            id: item.id,
            title: item.title || '',
            url: item.url,
            enabled: item.enabled,
            order: item.order || 0,
            categoryId: item.categoryId, // Fix: duplicate preservation
            platform: item.platform, // Fix: duplicate preservation
          })),
        }),
      })

      if (!saveResponse.ok) {
        throw new Error('Failed to save link')
      }

      const saveData = await saveResponse.json()
      // For custom links, we look for the updated item in response
      const updated = (saveData.links || []).find((item: any) => item.id === link.id) || null
      if (updated) {
        setLink({
          id: updated.id,
          title: updated.title || '',
          url: updated.url,
          enabled: updated.enabled,
          createdAt: updated.createdAt || new Date().toISOString(),
          updatedAt: updated.updatedAt || new Date().toISOString(),
          type: 'custom',
        })
      } else {
        // Fallback if API doesn't return the item clearly or we are just updating state optimistically/based on input
        setLink({ ...link, enabled: !link.enabled })
      }
      toast.success(link.enabled ? 'Link disabled' : 'Link enabled')
    } catch (error) {
      console.error('[LinkDetail] Failed to toggle link enabled', error)
      toast.error('Failed to update link')
    }
  }

  const handleBackToLinks = () => {
    router.push(`/dashboard/${params.address}?tab=links`)
  }

  if (loading) {
    return (
      <LayoutShell title="Loading..." subtitle="Loading link details">
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardContent className="py-8 flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">Loading link details...</p>
          </CardContent>
        </Card>
      </LayoutShell>
    )
  }

  if (linksLoaded && !link) {
    return (
      <LayoutShell
        title="Link not found"
        subtitle="This link does not exist in your profile."
      >
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardContent className="py-8 flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center max-w-md">
              The requested link could not be found. It may have been deleted or you may not have access to it.
            </p>
            <Button variant="outline" size="sm" onClick={handleBackToLinks}>
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />
              Back to Links
            </Button>
          </CardContent>
        </Card>
      </LayoutShell>
    )
  }

  if (!link) {
    return null
  }

  const displayTitle = link.title || 'Untitled link';
  const displayUrl = shortenUrl(link.url);
  const redirectPath = getRedirectPath(link.id);

  const lastClickedLabel =
    analytics.lastClickedTs != null
      ? formatDistanceToNow(new Date(analytics.lastClickedTs), { addSuffix: true })
      : 'Never';

  const ctrLabel = analytics.ctr !== null ? String((analytics.ctr * 100).toFixed(1)) + '%' : '-';


  return (
    <LayoutShell
      title={displayTitle}
      subtitle={
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link2 className="h-3.5 w-3.5" />
          <span className="truncate">{link.url}</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCopyRedirect}
                    aria-label="Copy redirect link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy redirect link</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

      </TooltipProvider >
    </div >

        {/* Time range selector */ }
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      <span>Time range</span>
    </div>
    <Tabs value={range} onValueChange={(value) => setRange(value as TimeRange)}>
      <TabsList className="h-8">
        <TabsTrigger value="24h" className="px-2 text-xs">
          24h
        </TabsTrigger>
        <TabsTrigger value="7d" className="px-2 text-xs">
          7d
        </TabsTrigger>
        <TabsTrigger value="30d" className="px-2 text-xs">
          30d
        </TabsTrigger>
        <TabsTrigger value="all" className="px-2 text-xs">
          All
        </TabsTrigger>
      </TabsList>
    </Tabs>
  </div >

  {/* KPI cards */ }
  < div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" >
    <Card className="bg-card border border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          Lifetime Clicks
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-semibold">
          {analytics.lifetimeClicks.toLocaleString('en-US')}
        </p>
      </CardContent>
    </Card>

    <Card className="bg-card border border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          Last 7 days
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-semibold">
          {analytics.clicks7d.toLocaleString('en-US')}
        </p>
      </CardContent>
    </Card>

    <Card className="bg-card border border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          Last 30 days
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-semibold">
          {analytics.clicks30d.toLocaleString('en-US')}
        </p>
      </CardContent>
    </Card>

    <Card className="bg-card border border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          Last clicked
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm font-medium">{lastClickedLabel}</p>
      </CardContent>
    </Card>

  </div >

  {/* Clicks over time */ }
  < Card className="bg-card border border-border/60 shadow-sm" >
    <CardHeader className="pb-2 flex flex-row items-center justify-between">
      <div className="space-y-1">
        <CardTitle className="text-sm font-medium">Clicks over time</CardTitle>
        <CardDescription className="text-xs">
          Buckets are hourly for 24h, daily for longer ranges.
        </CardDescription>
      </div>
      <Activity className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent className="pt-4">
      {analytics.buckets.length === 0 || analytics.maxBucketCount === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
          No clicks yet for this link in the selected time range.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-end gap-1 h-32">
            {analytics.buckets.map((bucket, idx) => {
              const heightPercent =
                analytics.maxBucketCount > 0
                  ? (bucket.count / analytics.maxBucketCount) * 100
                  : 0
              return (
                <div
                  key={`${bucket.label}-${idx}`}
                  className="flex-1 flex flex-col items-center justify-end"
                >
                  <div
                    className="w-full rounded-t bg-primary/70 transition-all"
                    style={{
                      height: `${Math.max(heightPercent, 4)}%`,
                      opacity: bucket.count === 0 ? 0.4 : 1,
                    }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            {analytics.buckets.map((bucket, idx) => {
              const step =
                analytics.buckets.length > 12
                  ? Math.ceil(analytics.buckets.length / 12)
                  : 1
              if (idx % step !== 0 && idx !== analytics.buckets.length - 1) {
                return <span key={`${bucket.label}-${idx}`} className="flex-1" />
              }
              return (
                <span key={`${bucket.label}-${idx}`} className="flex-1 text-center truncate">
                  {bucket.label}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </CardContent>
  </Card >

  {/* Source breakdown */ }
  < Card className="bg-card border border-border/60 shadow-sm" >
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">Source breakdown</CardTitle>
      <CardDescription className="text-xs">
        Where clicks originated from in the selected time range.
      </CardDescription>
    </CardHeader>
    <CardContent>
      {analytics.totalClicks === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-4 text-center text-xs text-muted-foreground">
          No clicks yet for this link. Share your profile or redirect link to start
          collecting analytics.
          <div className="mt-3">
            <Button type="button" size="sm" variant="outline" onClick={handleCopyRedirect}>
              <Copy className="mr-2 h-3.5 w-3.5" />
              Copy redirect link
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground">
                <th className="py-2 text-left font-medium">Source</th>
                <th className="py-2 text-right font-medium">Clicks</th>
                <th className="py-2 text-right font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {(['profile', 'copy', 'qr', 'unknown'] as const).map((source) => {
                const count = analytics.sourceCounts[source] || 0
                const share =
                  analytics.totalClicks > 0
                    ? ((count / analytics.totalClicks) * 100).toFixed(1) + '%'
                    : '—'
                const label =
                  source === 'profile'
                    ? 'Profile'
                    : source === 'copy'
                      ? 'Copy'
                      : source === 'qr'
                        ? 'QR code'
                        : 'Unknown'
                return (
                  <tr key={source} className="border-b border-border/40 last:border-0">
                    <td className="py-2 text-left">{label}</td>
                    <td className="py-2 text-right">
                      {count.toLocaleString('en-US')}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">{share}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card >

  {/* Recent Clicks - Identity Aware */ }
  < Card className="bg-card border border-border/60 shadow-sm" >
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">Recent Clicks</CardTitle>
      <CardDescription className="text-xs">
        Latest recognized activity on this link.
      </CardDescription>
    </CardHeader>
    <CardContent>
      {analytics.totalClicks === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-4 text-center text-xs text-muted-foreground">
          No activity recorded yet for this link.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground">
                <th className="py-2 text-left font-medium">Time</th>
                <th className="py-2 text-left font-medium">Visitor</th>
                <th className="py-2 text-left font-medium">Referrer</th>
                <th className="py-2 text-left font-medium">Device/Loc</th>
                <th className="py-2 text-right font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {/* Access linkEvents from filter logic (need to duplicate logic or memoize differently if not accessible) 
                          Actually we can access 'analytics.linkEvents' if we expose it in the useMemo above.
                          Let's check if we exposed it. We didn't. 
                          We will rely on serverEvents filtering here since we are inside the component.
                      */}
              {(() => {
                const now = Date.now()
                const fromTs = range === 'all'
                  ? 0
                  : range === '24h'
                    ? now - 24 * 60 * 60 * 1000
                    : range === '7d'
                      ? now - 7 * 24 * 60 * 60 * 1000
                      : now - 30 * 24 * 60 * 60 * 1000

                const filteredEvents = (serverEvents || [])
                  .filter(e => e.type === 'link_click' && e.linkId === linkId && e.ts >= fromTs)
                  .sort((a, b) => b.ts - a.ts)

                const totalIds = filteredEvents.length
                const totalPages = Math.ceil(totalIds / CLICKS_PER_PAGE)
                const startIdx = (clickPage - 1) * CLICKS_PER_PAGE
                const paginatedEvents = filteredEvents.slice(startIdx, startIdx + CLICKS_PER_PAGE)

                if (paginatedEvents.length === 0) {
                  return (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-muted-foreground py-2">{clickPage === 1 ? 'No clicks in this time range.' : 'No more clicks.'}</td>
                    </tr>
                  )
                }

                return (
                  <>
                    {paginatedEvents.map(event => (
                      <tr key={`${event.ts}-${Math.random()}`} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                        <td className="py-2 text-left text-muted-foreground">
                          {formatDistanceToNow(new Date(event.ts), { addSuffix: true })}
                        </td>
                        <td className="py-2 text-left font-mono">
                          {event.visitorWallet ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[10px]">
                                {event.visitorWallet.slice(0, 6)}...{event.visitorWallet.slice(-4)}
                              </span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-4 w-4 p-0 hover:bg-transparent text-muted-foreground/50 hover:text-foreground"
                                      onClick={() => {
                                        navigator.clipboard.writeText(event.visitorWallet!)
                                        toast.success('Address copied')
                                      }}
                                    >
                                      <Copy className="h-2.5 w-2.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy address</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-4 w-4 p-0 hover:bg-transparent text-muted-foreground/50 hover:text-foreground"
                                      onClick={() => window.open(`/dashboard/${event.visitorWallet}`, '_blank')}
                                    >
                                      <ExternalLink className="h-2.5 w-2.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Go to profile</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </td>
                        <td className="py-2 text-left max-w-[120px] truncate" title={event.referrer || ''}>
                          {event.referrer ? (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {(() => {
                                try {
                                  return new URL(event.referrer).hostname.replace('www.', '')
                                } catch {
                                  return event.referrer
                                }
                              })()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </td>
                        <td className="py-2 text-left">
                          <div className="flex flex-col text-[10px] leading-tight text-muted-foreground">
                            <span>{event.device || '-'}</span>
                            <span className="opacity-70">{event.country || '-'}</span>
                          </div>
                        </td>
                        <td className="py-2 text-right">
                          <Badge variant="outline" className="text-[10px] font-normal h-5 ml-auto">
                            {event.source}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {/* Pagination Controls */}
                    {totalIds > CLICKS_PER_PAGE && (
                      <tr>
                        <td colSpan={5} className="pt-4 pb-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              Showing {startIdx + 1}-{Math.min(startIdx + CLICKS_PER_PAGE, totalIds)} of {totalIds}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={clickPage === 1}
                                onClick={() => setClickPage(p => p - 1)}
                              >
                                Previous
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={clickPage >= totalPages}
                                onClick={() => setClickPage(p => p + 1)}
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    )
                    })()}
                  </tbody >
                </table>
        </div>
      )}
    </CardContent>
  </Card >
      </div >
    </LayoutShell >
  )
}

