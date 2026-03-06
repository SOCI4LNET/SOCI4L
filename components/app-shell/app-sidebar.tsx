'use client'

import * as React from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { sanitizeQueryParams } from '@/lib/query-params'
import { useProfile } from '@/hooks/use-profile'
import { Button } from '@/components/ui/button'
import { X, Sparkles, Chrome } from 'lucide-react'

import { LayoutDashboard, Wallet, Activity, Settings, Users, Wand2, Link2, BarChart3, ChevronDown, User, Shield, CreditCard, Layers } from 'lucide-react'

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, SidebarRail, SidebarFooter, useSidebar } from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Soci4LLogo } from '@/components/logos/soci4l-logo'

// Define a key for localStorage
const CARD_DISMISSED_KEY = 'soci4l:sidebar-card-dismissed'
const CARD_CHOICE_KEY = 'soci4l:sidebar-card-choice'

const platformItems = [
  {
    title: 'Overview',
    icon: LayoutDashboard,
    value: 'overview',
  },
  {
    title: 'Assets',
    icon: Wallet,
    value: 'assets',
  },
  {
    title: 'Activity',
    icon: Activity,
    value: 'activity',
  },
  {
    title: 'NFTs',
    icon: Layers,
    value: 'nfts',
  },
  {
    title: 'Social',
    icon: Users,
    value: 'social',
  },
]

const studioItems = [
  {
    title: 'Builder',
    icon: Wand2,
    value: 'builder',
  },
  {
    title: 'Links',
    icon: Link2,
    value: 'links',
  },
  {
    title: 'Insights',
    icon: BarChart3,
    value: 'insights',
  },
]

const accountItems = [
  {
    title: 'Safety',
    icon: Shield,
    value: 'safety',
  },
  {
    title: 'Settings',
    icon: Settings,
    value: 'settings',
  },
  {
    title: 'Billing',
    icon: CreditCard,
    value: 'billing',
  },
]

const navGroups = [
  {
    label: 'Dashboard',
    items: platformItems,
  },
  {
    label: 'Studio',
    items: studioItems,
  },
  {
    label: 'Account',
    items: accountItems,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setOpenMobile, isMobile, state } = useSidebar()

  // Determine current tab from query param OR pathname
  let currentTab = searchParams.get('tab')
  if (!currentTab) {
    currentTab = 'overview'
  }

  const isCollapsed = state === 'collapsed'

  const { profile, loading } = useProfile()
  const [isCardDismissed, setIsCardDismissed] = React.useState(true) // Default true to prevent hydration mismatch flash
  const [cardType, setCardType] = React.useState<'PRO' | 'EXTENSION' | null>(null)

  React.useEffect(() => {
    // Check local storage after mount for 24-hour expiration
    const dismissedAt = localStorage.getItem(CARD_DISMISSED_KEY)
    if (dismissedAt) {
      const dismissedTime = new Date(dismissedAt).getTime()
      const now = new Date().getTime()
      const hoursPassed = (now - dismissedTime) / (1000 * 60 * 60)

      // If less than 24 hours have passed, keep it dismissed
      if (hoursPassed < 24) {
        setIsCardDismissed(true)
      } else {
        // Expired, show card again and clean up storage
        localStorage.removeItem(CARD_DISMISSED_KEY)
        setIsCardDismissed(false)
      }
    } else {
      setIsCardDismissed(false)
    }

    // Determine card type based on profile and random logic
    const isPremium = profile?.premiumExpiresAt ? new Date(profile.premiumExpiresAt) > new Date() : false

    if (isPremium) {
      // Premium users always see the extension card
      setCardType('EXTENSION')
    } else {
      // Non-premium users see a mix of Pro card (70%) and Extension card (30%)
      const existingChoice = localStorage.getItem(CARD_CHOICE_KEY)
      if (existingChoice === 'PRO' || existingChoice === 'EXTENSION') {
        setCardType(existingChoice)
      } else {
        const choice = Math.random() < 0.7 ? 'PRO' : 'EXTENSION'
        localStorage.setItem(CARD_CHOICE_KEY, choice)
        setCardType(choice)
      }
    }
  }, [profile])

  const handleDismissCard = () => {
    // Save current ISO timestamp
    localStorage.setItem(CARD_DISMISSED_KEY, new Date().toISOString())
    setIsCardDismissed(true)
  }

  const showCard = !loading && !isCardDismissed && !isCollapsed && cardType !== null

  // Determine which sections should be open based on the current tab
  const isStudioTab = studioItems.some((item: any) => item.value === currentTab)
  const isAccountTab = accountItems.some((item: any) => item.value === currentTab)

  // Default state: Desktop = open if active, Mobile = closed
  const getDefaultOpenState = (isOpen: boolean) => {
    if (isMobile) return false
    return isOpen
  }

  // Section open states
  const [isStudioOpen, setIsStudioOpen] = React.useState(() => getDefaultOpenState(isStudioTab))
  const [isAccountOpen, setIsAccountOpen] = React.useState(() => getDefaultOpenState(isAccountTab))

  // Auto-expand when navigating
  React.useEffect(() => {
    if (!isMobile) {
      if (isStudioTab) setIsStudioOpen(true)
      if (isAccountTab) setIsAccountOpen(true)
    }
  }, [isStudioTab, isAccountTab, isMobile])

  const handleTabChange = (value: string) => {
    // Sanitize query params: remove params not allowed for the target tab
    // This prevents cross-tab parameter pollution (e.g., subtab=following on Settings)
    const sanitized = sanitizeQueryParams(searchParams, value)
    sanitized.set('tab', value)

    // If we're on a link detail page (/dashboard/[address]/links/[linkId]),
    // navigate to the main dashboard page instead of adding tab param to current path
    const isLinkDetailPage = pathname.includes('/links/') && pathname.split('/').length > 4

    if (isLinkDetailPage) {
      // Extract address from pathname: /dashboard/[address]/links/[linkId]
      const pathParts = pathname.split('/')
      const addressIndex = pathParts.indexOf('dashboard') + 1
      if (addressIndex > 0 && pathParts[addressIndex]) {
        const address = pathParts[addressIndex]
        router.replace(`/dashboard/${address}?${sanitized.toString()}`, { scroll: false })
      } else {
        // Fallback: use current pathname (shouldn't happen)
        router.replace(`${pathname}?${sanitized.toString()}`, { scroll: false })
      }
    } else {
      router.replace(`${pathname}?${sanitized.toString()}`, { scroll: false })
    }

    // Close sidebar on mobile after selection
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon" className="h-svh sticky top-0" {...props}>
      <SidebarHeader>
        <Link href="/" className={`flex items-center justify-center w-full h-10 ${isCollapsed ? 'px-0' : 'px-2'} hover:opacity-80 transition-opacity`}>
          {isCollapsed ? (
            <Soci4LLogo variant="icon" width={20} height={20} />
          ) : (
            <Soci4LLogo variant="combination" width={97} height={20} />
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Platform Items */}
              {platformItems.map((item) => {
                const Icon = item.icon
                const isActive = currentTab === item.value

                return (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      onClick={() => handleTabChange(item.value)}
                      isActive={isActive}
                      tooltip={item.title}
                      className="gap-3"
                    >
                      <Icon className="text-[#27272a] dark:text-[#f0f0f0]" strokeWidth={1} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

              {/* Studio Collapsible */}
              <Collapsible
                open={isCollapsed ? false : isStudioOpen}
                onOpenChange={isCollapsed ? undefined : setIsStudioOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={isCollapsed ? navGroups[1].label : undefined} className="gap-3">
                      <User className="h-4 w-4 text-[#27272a] dark:text-[#f0f0f0]" strokeWidth={1} />
                      {!isCollapsed && (
                        <>
                          <span>{navGroups[1].label}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" strokeWidth={1} />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {studioItems.map((item: any) => {
                        const Icon = item.icon
                        const isActive = currentTab === item.value

                        return (
                          <SidebarMenuSubItem key={item.value}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive}
                              className="gap-3 [&>svg]:!text-[#27272a] dark:[&>svg]:!text-[#f0f0f0]"
                            >
                              <button
                                type="button"
                                onClick={() => handleTabChange(item.value)}
                                className="w-full"
                              >
                                <Icon className="text-[#27272a] dark:text-[#f0f0f0]" strokeWidth={1} />
                                <span>{item.title}</span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Account Collapsible */}
              <Collapsible
                open={isCollapsed ? false : isAccountOpen}
                onOpenChange={isCollapsed ? undefined : setIsAccountOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={isCollapsed ? navGroups[2].label : undefined} className="gap-3">
                      <Settings className="h-4 w-4 text-[#27272a] dark:text-[#f0f0f0]" strokeWidth={1} />
                      {!isCollapsed && (
                        <>
                          <span>{navGroups[2].label}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" strokeWidth={1} />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {accountItems.map((item: any) => {
                        const Icon = item.icon
                        const isActive = currentTab === item.value

                        return (
                          <SidebarMenuSubItem key={item.value}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive}
                              className="gap-3 [&>svg]:!text-[#27272a] dark:[&>svg]:!text-[#f0f0f0]"
                            >
                              <button
                                type="button"
                                onClick={() => handleTabChange(item.value)}
                                className="w-full"
                              >
                                <Icon className="text-[#27272a] dark:text-[#f0f0f0]" />
                                <span>{item.title}</span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {showCard && cardType === 'PRO' && (
        <SidebarFooter className="p-3 pb-4 mt-auto h-auto border-none">
          <div className="relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
            {/* Top Illustration Area */}
            <div className="h-16 bg-gradient-to-br from-[#d8b4fe] via-[#c084fc] to-[#a855f7] relative w-full flex items-center justify-center overflow-hidden">
              {/* Decorative elements representing the illustration */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.8),transparent)]" />
              <Sparkles className="h-10 w-10 text-white/40 absolute right-4 bottom-1" />
              <div className="w-12 h-12 bg-white/20 rounded-full blur-xl absolute -left-2 -top-2" />

              <button
                onClick={handleDismissCard}
                className="absolute top-1.5 right-1.5 h-6 w-6 bg-white/50 hover:bg-white/80 rounded-full flex items-center justify-center transition-colors text-black"
                aria-label="Dismiss upgrade card"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-3 bg-[#f4f4f5] dark:bg-zinc-900/50">
              <h3 className="font-semibold text-sm leading-tight mb-1">
                Upgrade to Premium
              </h3>
              <p className="text-xs text-muted-foreground mb-3 leading-snug">
                Unlock precise source tracking, real-time visitor activity, and per-link analytics.
              </p>

              <Button
                asChild
                className="w-full bg-[#18181b] hover:bg-[#27272a] text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 rounded-full h-8 px-3 text-xs shadow-sm"
              >
                <Link href="/premium">
                  Upgrade to Pro
                </Link>
              </Button>
            </div>
          </div>
        </SidebarFooter>
      )}

      {showCard && cardType === 'EXTENSION' && (
        <SidebarFooter className="p-3 pb-4 mt-auto h-auto border-none">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#B5FBC4] to-[#FEF695] text-black shadow-sm group">
            {/* Dismiss Button */}
            <button
              onClick={handleDismissCard}
              className="absolute top-1.5 right-1.5 h-6 w-6 bg-black/5 hover:bg-black/10 rounded-full flex items-center justify-center transition-colors text-black/70 hover:text-black z-10"
              aria-label="Dismiss extension card"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Content Area */}
            <a
              href="https://chromewebstore.google.com/detail/soci4l-donate/hpdblnjffdobbhohkjlniikdfkafagdk?hl=en-US&utm_source=ext_sidebar"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-3.5 flex items-center gap-3 transition-opacity hover:opacity-90 cursor-pointer block"
            >
              {/* Icon Area */}
              <div className="flex-shrink-0 bg-[#A2EDBA]/50 p-2.5 rounded-xl">
                <Chrome className="w-5 h-5 text-black/90" />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <h3 className="font-semibold text-sm leading-tight text-black/90 tracking-tight">
                  Get the extension
                </h3>
                <p className="text-[11px] font-semibold mt-0.5 inline-block text-black/70 group-hover:text-black transition-colors group-hover:underline decoration-black/40 decoration-2 underline-offset-2">
                  Install Now
                </p>
              </div>
            </a>
          </div>
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  )
}
