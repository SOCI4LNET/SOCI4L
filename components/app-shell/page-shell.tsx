'use client'

import { ReactNode } from 'react'
import { PageContent } from './page-content'

interface PageShellProps {
  title: string
  subtitle?: string
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
      <div className="space-y-6 min-h-0">
        {/* Page Header */}
        <div className="shrink-0 border-b border-border pb-4 mb-6">
          <h1 className="text-lg font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-6 min-h-0">
          {children}
        </div>
      </div>
    </PageContent>
  )
}
