'use client'

import { ReactNode } from 'react'
import { PageContent } from './page-content'

interface PageShellProps {
  title: string
  subtitle?: ReactNode | string
  children: ReactNode
  /**
   * Layout mode:
   * - 'constrained': Max-width ~1280px, centered within full-width container (for Overview, Settings, Social)
   * - 'full-width': No max-width, spans available width (for Assets, Activity)
   * 
   * Defaults to 'constrained' for better readability on content-heavy pages.
   */
  mode?: 'constrained' | 'full-width'
}

/**
 * PageShell - Wrapper for page content with title/subtitle.
 * 
 * Uses PageContent internally to ensure proper alignment with header gutter.
 * The shell itself is always full-width; only the inner content area is constrained.
 */
export function PageShell({ title, subtitle, children, mode = 'constrained' }: PageShellProps) {
  return (
    <PageContent mode={mode}>
      <div className="space-y-8 min-h-0">
        {/* Page Header */}
        <div className="shrink-0 space-y-1 pb-6 border-b border-border/60">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-8 min-h-0">
          {children}
        </div>
      </div>
    </PageContent>
  )
}
