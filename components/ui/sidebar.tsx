"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_LOCALSTORAGE_KEY = "soc4l_sidebar_collapsed"
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "50px"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"
const SIDEBAR_MOBILE_BREAKPOINT = 1024 // lg breakpoint

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(({ defaultOpen = true, open: openProp, onOpenChange, className, style, children, ...props }, ref) => {
  const [openMobile, setOpenMobile] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  // Load persisted sidebar state from localStorage (desktop only)
  const getInitialOpenState = React.useCallback(() => {
    if (typeof window === "undefined") return defaultOpen

    try {
      // On desktop, check localStorage for persisted state
      if (window.innerWidth >= SIDEBAR_MOBILE_BREAKPOINT) {
        const persisted = localStorage.getItem(SIDEBAR_LOCALSTORAGE_KEY)
        if (persisted !== null) {
          return persisted === "false" // stored as string
        }
      }
    } catch (error) {
      // Silently fail if localStorage is not available (e.g., in SSR or private browsing)
      console.warn('[Sidebar] Failed to access localStorage', error)
    }

    return defaultOpen
  }, [defaultOpen])

  // Handle controlled/uncontrolled state
  const [internalOpen, setInternalOpen] = React.useState(getInitialOpenState)
  const open = openProp ?? internalOpen
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const newOpen = typeof value === "function" ? value(open) : value
      if (openProp === undefined) {
        setInternalOpen(newOpen)

        // Persist to localStorage on desktop (only when collapsed)
        if (typeof window !== "undefined" && window.innerWidth >= SIDEBAR_MOBILE_BREAKPOINT) {
          try {
            localStorage.setItem(SIDEBAR_LOCALSTORAGE_KEY, String(!newOpen))
          } catch (error) {
            // Silently fail if localStorage is not available
            console.warn('[Sidebar] Failed to save to localStorage', error)
          }
        }
      }
      onOpenChange?.(newOpen)
    },
    [open, openProp, onOpenChange]
  )

  // Mobile detection (lg breakpoint: 1024px)
  React.useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < SIDEBAR_MOBILE_BREAKPOINT
      setIsMobile(isMobileView)

      // On desktop, restore persisted state
      if (!isMobileView && openProp === undefined) {
        try {
          const persisted = localStorage.getItem(SIDEBAR_LOCALSTORAGE_KEY)
          if (persisted !== null) {
            setInternalOpen(persisted === "false")
          }
        } catch (error) {
          // Silently fail if localStorage is not available
          console.warn('[Sidebar] Failed to read from localStorage', error)
        }
      }
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [openProp])

  // Keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(!open)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, setOpen])

  const toggleSidebar = React.useCallback(() => {
    return setOpen(!open)
  }, [open, setOpen])

  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContext>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn("group/sidebar-wrapper flex h-svh w-full bg-background", className)}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
})
SidebarProvider.displayName = "SidebarProvider"

const sidebarVariants = cva(
  "group/sidebar flex h-full flex-col bg-background text-sidebar-foreground transition-[width] duration-200 ease-linear border-r border-sidebar-border overflow-x-hidden",
  {
    variants: {
      variant: {
        sidebar: "",
        floating: "",
        inset: "",
      },
      side: {
        left: "left-0 top-0",
        right: "right-0 top-0",
      },
    },
    defaultVariants: {
      variant: "sidebar",
      side: "left",
    },
  }
)

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
  VariantProps<typeof sidebarVariants> & {
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()
  const mobile = isMobile && collapsible !== "none"
  const sidebarRef = React.useRef<HTMLDivElement>(null)
  const [translateY, setTranslateY] = React.useState(0)

  // Combine refs
  React.useImperativeHandle(ref, () => sidebarRef.current as HTMLDivElement)

  // Track scroll position - simplified as sticky positioning is usually enough for a sidebar
  React.useEffect(() => {
    if (mobile || typeof window === 'undefined') return

    const updateSidebarHeight = () => {
      // Just ensure the sidebar is correctly sized, CSS handles the sticky behavior usually
      setTranslateY(0)
    }

    // Update on resize
    window.addEventListener('resize', updateSidebarHeight)

    return () => {
      window.removeEventListener('resize', updateSidebarHeight)
    }
  }, [mobile])

  if (mobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-mobile="true"
          className="w-[--sidebar-width] bg-background p-0 text-sidebar-foreground [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
        >
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  // Determine width based on collapsed state
  const widthClass = state === "collapsed" && collapsible === "icon"
    ? "w-[--sidebar-width-icon]"
    : "w-[--sidebar-width]"

  // Add overflow-hidden when collapsed to prevent text from showing and horizontal scrollbar
  const overflowClass = state === "collapsed" && collapsible === "icon"
    ? "overflow-hidden overflow-x-hidden"
    : ""

  // Add sticky positioning - sidebar stays fixed until footer is reached
  const stickyClass = "sticky top-0 self-start"

  return (
    <aside
      ref={sidebarRef}
      className={cn(sidebarVariants({ variant, side }), widthClass, overflowClass, stickyClass, className)}
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-sidebar="sidebar"
      data-variant={variant}
      style={{
        transform: translateY !== 0 ? `translateY(${translateY}px)` : undefined,
        transition: 'transform 0.1s ease-out',
        ...props.style,
      } as React.CSSProperties}
      {...props}
    >
      {children}
    </aside>
  )
})
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar, openMobile, setOpenMobile, isMobile, open } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event)
        if (isMobile) {
          setOpenMobile(!openMobile)
        } else {
          toggleSidebar()
        }
      }}
      aria-label="Toggle sidebar"
      aria-expanded={isMobile ? openMobile : open}
      {...props}
    >
      <PanelLeft strokeWidth={1} />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar()

    return (
      <button
        ref={ref}
        data-sidebar="rail"
        aria-label="Toggle Sidebar"
        tabIndex={-1}
        onClick={toggleSidebar}
        className={cn("absolute inset-y-0 z-50 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] after:-translate-x-1/2 after:bg-sidebar-border after:opacity-0 after:transition-opacity after:duration-200 hover:after:opacity-100 group-data-[collapsible=icon]:block", className)}
        {...props}
      />
    )
  }
)
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn("relative flex min-h-svh flex-1 flex-col bg-background", className)}
        {...props}
      />
    )
  }
)
SidebarInset.displayName = "SidebarInset"

const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="header"
        className={cn("flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-4 group-data-[collapsible=icon]:px-2", className)}
        {...props}
      />
    )
  }
)
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="footer"
        className={cn("flex h-16 shrink-0 items-center gap-2 border-t border-sidebar-border px-4", className)}
        {...props}
      />
    )
  }
)
SidebarFooter.displayName = "SidebarFooter"

const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="content"
        className={cn("flex flex-1 flex-col gap-2 overflow-auto overflow-x-hidden group-data-[collapsible=icon]:overflow-hidden", className)}
        {...props}
      />
    )
  }
)
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="group"
        className={cn("relative flex w-full min-w-0 flex-col p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:items-center", className)}
        {...props}
      />
    )
  }
)
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="group-label"
        className={cn("duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", "group-data-[collapsible=icon]:hidden", className)}
        {...props}
      />
    )
  }
)
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        data-sidebar="group-action"
        className={cn("absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", "group-data-[collapsible=icon]:hidden", className)}
        {...props}
      />
    )
  }
)
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="group-content"
        className={cn("w-full text-sm group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center", className)}
        {...props}
      />
    )
  }
)
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => {
    return (
      <ul
        ref={ref}
        data-sidebar="menu"
        className={cn("flex w-full min-w-0 flex-col gap-1 group-data-[collapsible=icon]:items-center", className)}
        {...props}
      />
    )
  }
)
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => {
    return (
      <li
        ref={ref}
        data-sidebar="menu-item"
        className={cn("group/menu-item relative group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center", className)}
        {...props}
      />
    )
  }
)
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-accent/60 hover:text-accent-foreground focus-visible:ring-2 active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground data-[state=open]:hover:bg-accent data-[state=open]:hover:text-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!w-8 group-data-[collapsible=icon]:!min-w-8 group-data-[collapsible=icon]:!max-w-8 group-data-[collapsible=icon]:!mx-auto group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!items-center group-data-[collapsible=icon]:!gap-0 group-data-[collapsible=icon]:!text-center [&>span:last-child]:truncate group-data-[collapsible=icon]:[&>span]:!hidden group-data-[collapsible=icon]:[&>span]:!w-0 group-data-[collapsible=icon]:[&>span]:!opacity-0 group-data-[collapsible=icon]:[&>span]:!overflow-hidden group-data-[collapsible=icon]:[&>span]:!m-0 group-data-[collapsible=icon]:[&>span]:!p-0 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-accent/60 hover:text-accent-foreground",
        outline: "bg-sidebar border border-sidebar-border hover:bg-accent/60 hover:text-accent-foreground",
      },
      size: {
        default: "h-9 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const button = (
    <Comp
      ref={ref}
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  )

  // Only show tooltip when sidebar is collapsed (icon mode)
  if (!tooltip || !isCollapsed) {
    return button
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" align="center" hidden={false} {...tooltip} className={cn("z-[100]", tooltip && (tooltip as any).className)} />
    </Tooltip>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn("absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0", "peer-data-[size=sm]/menu-button:top-1", "peer-data-[size=lg]/menu-button:top-2.5", showOnHover && "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground", showOnHover ? "opacity-0" : "opacity-100", className)}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="menu-badge"
        className={cn("absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none", "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground", "group-data-[collapsible=icon]:hidden", className)}
        {...props}
      />
    )
  }
)
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<HTMLDivElement, React.ComponentProps<"div"> & {
  showIcon?: boolean
}>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("rounded-md h-8 flex gap-2 px-2 items-center", className)}
      {...props}
    >
      {showIcon && (
        <div className="flex h-4 w-4 shrink-0 animate-pulse rounded-md bg-sidebar-primary/10" />
      )}
      <div
        className="h-4 animate-pulse rounded-md bg-sidebar-primary/10"
        style={{
          width,
        }}
      />
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => {
    return (
      <ul
        ref={ref}
        data-sidebar="menu-sub"
        className={cn("mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5", "group-data-[collapsible=icon]:hidden", className)}
        {...props}
      />
    )
  }
)
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ ...props }, ref) => {
    return <li ref={ref} {...props} />
  }
)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean
    size?: "sm" | "md"
    isActive?: boolean
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn("flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-foreground/50", size === "sm" && "text-xs", isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground", className)}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
}
