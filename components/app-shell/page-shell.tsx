'use client'

import { ReactNode } from 'react'

interface PageShellProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-6">
      {/* Page Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}
