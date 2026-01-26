'use client'

import { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  description?: string
  rightSlot?: ReactNode
}

export function SectionHeader({ title, description, rightSlot }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold mb-1">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
    </div>
  )
}
