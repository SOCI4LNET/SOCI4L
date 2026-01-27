'use client'

import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart2, Link2, Sparkles, Wallet, LayoutDashboard } from 'lucide-react'
import { AppHeader } from '@/components/app-shell/app-header'
import { toast } from 'sonner'
import { getConnectedDashboardHref } from '@/lib/routing'

const EXAMPLE_PROFILE_ADDRESS = '0x8ab0cf264df99d83525e9e11c7e4db01558ae1b1'

export default function HomePage() {
  const router = useRouter()
  const { address: connectedAddress, isConnected } = useAccount()

  const openDashboard = () => {
    if (!isConnected || !connectedAddress) {
      toast.error('Please connect your wallet first')
      return
    }
    const dashboardHref = getConnectedDashboardHref(connectedAddress)
    if (dashboardHref) {
      router.push(dashboardHref)
    } else {
      toast.error('Invalid wallet address')
    }
  }

  const viewExampleProfile = () => {
    router.push(`/p/${EXAMPLE_PROFILE_ADDRESS}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 flex flex-col">
      <AppHeader sticky={true} showNavigation={true} />
      <main>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 md:py-16">
        {/* Hero */}
        <section className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-xs text-muted-foreground">
              <Badge variant="outline" className="h-5 px-2 text-[11px]">
                Soci4l
              </Badge>
              <span>SOCI4L · Wallet-first profiles & link intelligence</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                SOCI4L turns your Avalanche wallet into a measurable, privacy-first public profile.
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground md:text-base">
                Present who you are on-chain, control what you show, and see which links and sections
                actually drive people into Avalanche dapps.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                onClick={openDashboard}
                className="gap-2 shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Open Dashboard
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={viewExampleProfile}
                className="gap-2 border-border/70 bg-background/60 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5"
              >
                <Wallet className="h-3.5 w-3.5" />
                View Example Profile
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Simple funnel:</span>{' '}
              share → view → click → dapp → tx
            </div>
          </div>

          <Card className="bg-card/80 border-border/70 shadow-sm backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Profile funnel preview</span>
              </CardTitle>
              <CardDescription className="text-xs">
                How SOCI4L routes attention from a shared profile into real Avalanche usage.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-md border border-dashed border-border/60 bg-muted/10 p-3">
                <ol className="space-y-2 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="mt-[2px] h-4 w-4 rounded-full bg-primary/10 text-[10px] font-medium text-primary flex items-center justify-center">
                      1
                    </span>
                    <span>
                      You share your SOCI4L profile link or QR code from your Avalanche wallet.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-[2px] h-4 w-4 rounded-full bg-primary/10 text-[10px] font-medium text-primary flex items-center justify-center">
                      2
                    </span>
                    <span>
                      Visitors land on a wallet-first profile with summary, links, activity, and assets.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-[2px] h-4 w-4 rounded-full bg-primary/10 text-[10px] font-medium text-primary flex items-center justify-center">
                      3
                    </span>
                    <span>
                      They click into curated link categories that point to Avalanche dapps and tools.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-[2px] h-4 w-4 rounded-full bg-primary/10 text-[10px] font-medium text-primary flex items-center justify-center">
                      4
                    </span>
                    <span>
                      Those dapps handle the final step: transactions, governance, mints, and more on
                      Avalanche.
                    </span>
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="bg-border/60" />

        {/* Problem & Solution */}
        <section className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card/80 border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Problem</CardTitle>
              <CardDescription className="text-xs">
                Addresses are unreadable. Profiles are missing. Feedback loops don&apos;t exist.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <ul className="space-y-1 list-disc list-inside">
                <li>Long hex addresses don&apos;t explain who you are or what you build.</li>
                <li>Links to sites, docs, dapps, and socials are scattered across the internet.</li>
                <li>
                  You rarely know which profile links people click, or which routes lead to on-chain
                  actions.
                </li>
                <li>
                  Privacy controls are all-or-nothing: either expose everything on-chain or stay opaque.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Solution</CardTitle>
              <CardDescription className="text-xs">
                A wallet-first profile layer that gives you identity, control, and measurement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <ul className="space-y-1 list-disc list-inside">
                <li>Profile Builder composes summary, assets, activity, and curated links.</li>
                <li>Per-block visibility and layout controls, plus one-click presets.</li>
                <li>Links organized into categories, with insights on what actually gets clicked.</li>
                <li>Shareable public profiles with QR codes for fast routing into Avalanche dapps.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Core capabilities */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Why SOCI4L</h2>
            <p className="text-xs text-muted-foreground">
              What makes SOCI4L a different kind of profile and link layer for Avalanche.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card/80 border-border/70 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Wallet className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-medium">Wallet-first identity</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">
                Profiles are anchored to Avalanche wallets, not new social silos. The address stays
                the root of identity; SOCI4L makes it human and navigable.
              </CardContent>
            </Card>

            <Card className="bg-card/80 border-border/70 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Link2 className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-medium">Category-based links</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">
                Group links into categories like core dapps, docs, or community. SOCI4L tracks
                performance per category so you can see which intent buckets actually work.
              </CardContent>
            </Card>

            <Card className="bg-card/80 border-border/70 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BarChart2 className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-medium">Built-in insights</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">
                Global and category-level analytics show how profile views and link clicks evolve
                over time, closing the loop between layout changes and real behavior.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Avalanche benefits */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Why Avalanche benefits</h2>
            <p className="text-xs text-muted-foreground">
              SOCI4L makes Avalanche addresses easier to understand and route into the ecosystem.
            </p>
          </div>
          <Card className="bg-card/80 border-border/70 shadow-sm">
            <CardContent className="space-y-2 pt-4 text-xs text-muted-foreground">
              <ul className="space-y-1 list-disc list-inside">
                <li>
                  Turns raw addresses into understandable profiles with clear summaries, links, and
                  activity.
                </li>
                <li>
                  Profiles act as curated entry points into Avalanche-native dapps, tools, and
                  communities.
                </li>
                <li>
                  Category and link analytics help builders learn which entry points drive actual
                  usage.
                </li>
                <li>
                  Projects and contributors can present consistent, wallet-anchored narratives that
                  are easy to share.
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* What users can do today + roadmap */}
        <section className="space-y-4">
          <Tabs defaultValue="today" className="w-full">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <h2 className="text-base font-semibold">Product today & what comes next</h2>
                <p className="text-xs text-muted-foreground">
                  SOCI4L is usable today, with a clear path for deeper identity and analytics on
                  Avalanche.
                </p>
              </div>
              <TabsList className="h-8">
                <TabsTrigger value="today" className="px-3 text-xs">
                  Today
                </TabsTrigger>
                <TabsTrigger value="future" className="px-3 text-xs">
                  Future (roadmap)
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="today" className="mt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-card/80 border-border/70 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      <span>Claim & build profiles</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-muted-foreground space-y-1">
                    <p>Claim a wallet-first profile for your Avalanche address.</p>
                    <p>Compose summary, assets, activity, and curated links with presets.</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/80 border-border/70 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Link2 className="h-4 w-4 text-primary" />
                      <span>Organize & share links</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-muted-foreground space-y-1">
                    <p>Create link categories like dapps, docs, and community.</p>
                    <p>Share a single profile URL or QR code instead of scattered links.</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/80 border-border/70 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <BarChart2 className="h-4 w-4 text-primary" />
                      <span>Measure what works</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-muted-foreground space-y-1">
                    <p>See profile views and link clicks over time.</p>
                    <p>Compare performance by category to refine your layout and routing.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="future" className="mt-4">
              <Card className="bg-card/80 border-border/70 shadow-sm">
                <CardHeader className="pb-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                    Future roadmap
                  </Badge>
                  <CardTitle className="text-sm font-medium">
                    Ideas for where SOCI4L can go next
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground space-y-1.5">
                  <ul className="space-y-1.5 list-disc list-inside">
                    <li>
                      Richer on-chain identity signals (e.g. governance, protocol usage, long-term
                      activity streaks) as optional profile blocks.
                    </li>
                    <li>
                      Team and project profiles that aggregate multiple wallets and contributors in a
                      single view.
                    </li>
                    <li>
                      Opt-in dapp modules that surface personalized status or entry points inside
                      profiles.
                    </li>
                    <li>
                      Privacy-respecting reputation indicators that help others quickly assess active,
                      consistent profiles.
                    </li>
                    <li>
                      Cross-surface analytics for how SOCI4L profiles perform when linked from other
                      Avalanche properties.
                    </li>
                  </ul>
                  <p className="pt-2 text-[11px] text-muted-foreground/80">
                    These items are intentionally future-facing and not commitments. The focus today
                    is a solid, usable profile and link intelligence layer.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        </div>
      </main>
    </div>
  )
}
