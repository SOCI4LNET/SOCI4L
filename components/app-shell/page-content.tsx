'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PAGE_GUTTER, PAGE_PADDING_Y, CONTENT_MAX_WIDTH } from '@/lib/layout-constants'

interface PageContentProps {
  children: ReactNode
  /**
   * Layout mode:
   * - 'constrained': Max-width ~1280px, centered within full-width container (for Overview, Settings, Social)
   * - 'full-width': No max-width, spans available width (for Assets, Activity tables)
   * 
   * Defaults to 'constrained' for better readability on content-heavy pages.
   */
  mode?: 'constrained' | 'full-width'
  className?: string
}

/**
 * PageContent - Wrapper for page content that ensures alignment with header gutter.
 * 
 * This component:
 * - Always uses the same horizontal padding (PAGE_GUTTER) as the header
 * - In constrained mode: centers content with max-width, but container itself is full-width
 * - In full-width mode: spans available width for tables
 * - Ensures perfect visual alignment between header and content
 */
export function PageContent({ children, mode = 'constrained', className }: PageContentProps) {
  // In full-width mode, render children directly without inner wrapper
  // This ensures true full-width layout without any constraints
  if (mode === 'full-width') {
    return (
      <div className={cn(
        // Base: full-width container with shared gutter padding
        'w-full',
        PAGE_GUTTER,
        PAGE_PADDING_Y,
        // Footer için yeterli alt padding ekle (footer yüksekliği ~350-400px)
        'pb-32 md:pb-40',
        className
      )}>
        {children}
      </div>
    )
  }

  // In constrained mode, use inner container with max-width
  return (
    <div className={cn(
      // Base: full-width container with shared gutter padding
      'w-full',
      PAGE_GUTTER,
      PAGE_PADDING_Y,
      // Footer için yeterli alt padding ekle (footer yüksekliği ~350-400px)
      'pb-32 md:pb-40',
      className
    )}>
      <div className={cn(
        // Inner container: constrained width in constrained mode
        'w-full',
        CONTENT_MAX_WIDTH,
        'mx-auto'
      )}>
        {children}
      </div>
    </div>
  )
}
