'use client'

import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, LayoutDashboard, Wand2, Sparkles, Code2, LineChart, Globe, Twitter, Github, Wallet, Coins, ArrowUpRight } from 'lucide-react'
import { MockProfileVisual } from '@/components/landing/mock-profile-visual'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart2, Link2 } from 'lucide-react'
import { AppHeader } from '@/components/app-shell/app-header'
import { toast } from 'sonner'
import { getConnectedDashboardHref } from '@/lib/routing'
import GradientBlinds from '@/components/ui/gradient-blinds'

import { OrbitConnection } from '@/components/landing/orbit-connection'

import { ComparisonSection } from '@/components/landing/comparison-section'
import { UseCaseSection } from '@/components/landing/use-case-section'
import { RoadmapSection } from '@/components/landing/roadmap-section'
import { DifferentiationSection } from '@/components/landing/differentiation-section'
import { SignalsSection } from '@/components/landing/signals-section'
import { ProfileWallSection } from '@/components/landing/profile-wall-section'
import { WalletSearchSection } from '@/components/landing/wallet-search-section'

const EXAMPLE_PROFILE_ADDRESS = '0x8ab0cf264df99d83525e9e11c7e4db01558ae1b1'

// ...

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

  const tryDemo = () => {
    router.push('/demo')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Background Gradient Blinds */}
      <div className="absolute inset-0 z-0 h-[600px] w-full opacity-80 overflow-hidden">
        <GradientBlinds
          gradientColors={['#A855F7', '#3B82F6', '#EC4899']} // Vibrant Purple/Blue/Pink
          angle={135}
          noise={0.35}
          blindCount={24}
          blindMinWidth={20}
          spotlightRadius={0.75}
          spotlightSoftness={0.9}
          spotlightOpacity={0.8}
          mouseDampening={0.15}
          distortAmount={0}
          shineDirection="left"
          mixBlendMode="screen" // Screen helps light pop on dark background
        />
        {/* Gradients to fade it out at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background pointer-events-none" />
      </div>

      <AppHeader sticky={true} showNavigation={true} className="z-10 relative" />
      <main className="flex-1 flex flex-col container mx-auto px-4 pt-20 pb-0 relative z-10">
        {/* Header Section - Full Viewport Height */}
        <section className="flex flex-col relative min-h-[calc(100vh-6rem)] pb-0">
          {/* Hero Text Content */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start relative z-10 flex-1">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-xs text-muted-foreground">
                <Badge variant="outline" className="h-5 px-2 text-[11px]">
                  Wallet
                </Badge>
                <span>Social identity Hub</span>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Turn your Avalanche wallet into a measurable public identity.
                </h1>
                <p className="max-w-xl text-sm text-muted-foreground md:text-base">
                  Turn your wallet into your SOCI4L profile.
                  Showcase on-chain assets, add links, and share everything as one public page with full control and built-in insights.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  onClick={openDashboard}
                  className="gap-2 shadow-xl shadow-primary/20 dark:shadow-none transition-all hover:-translate-y-0.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Claim your profile
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={tryDemo}
                  className="gap-2 transition-all hover:-translate-y-0.5 opacity-50 hover:opacity-100"
                >
                  Try Demo
                </Button>
              </div>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Simple funnel:</span>
                <span className="leading-relaxed">
                  create profile → add links → share → track engagement
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[600px] lg:max-w-none origin-top scale-[0.85] sm:scale-100 lg:scale-100 -mt-8 sm:mt-0">
              <MockProfileVisual />
            </div>
          </div>
          {/* Galaxy Orbit Animation (Anchored to Bottom via Flex) */}
          <div className="relative w-full z-0 pointer-events-none mt-auto">
            <OrbitConnection />
            {/* Fade out mask at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-10" />
          </div>
        </section>

        {/* Wallet Search Section */}
        <WalletSearchSection />






        {/* Comparison Section (Wallet vs Identity) */}
        <ComparisonSection />

        {/* Use Case Section */}
        <UseCaseSection />

        {/* Differentiation Section (Why Not X?) */}
        <DifferentiationSection />

        {/* Signals vs Vanity Section */}
        <SignalsSection />

        {/* Roadmap Section */}
        <RoadmapSection />

        {/* Profile Wall Section */}
        <ProfileWallSection />

      </main >
    </div >
  )
}
