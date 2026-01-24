'use client'

import Footer15 from '@/components/blocks/footer15'

/**
 * DashboardFooter - Full-width footer wrapper for dashboard layout.
 * 
 * Footer spans the entire viewport width (including area under sidebar).
 * Footer content is aligned with dashboard main content column using
 * the same max-width and padding as PageShell.
 * 
 * This component is mounted at the layout level, outside AppShell,
 * so it's not constrained by the sidebar+content flex layout.
 * 
 * Note: Sidebar border continuation is handled inside Footer15 component.
 */
export function DashboardFooter() {
  return (
    <div className="w-full">
      <Footer15 />
    </div>
  )
}
