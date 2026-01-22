"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Simple tooltip implementation without Radix UI dependency
// For sidebar collapsed state, tooltips are shown via CSS title attribute
const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { ref, ...props } as any)
  }
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    side?: "top" | "right" | "bottom" | "left"
    sideOffset?: number
    align?: "start" | "center" | "end"
    hidden?: boolean
  }
>(({ className, sideOffset = 4, hidden, children, ...props }, ref) => {
  // Hide tooltip if hidden prop is true
  // For collapsed sidebar, we'll use CSS-based tooltips or native title attribute
  if (hidden) {
    return null
  }
  
  // Simple tooltip - only show when explicitly requested (collapsed sidebar)
  // For now, return null to prevent duplicate rendering
  // Native browser tooltips via title attribute work better for collapsed state
  return null
})
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
