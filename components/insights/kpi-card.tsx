'use client'

import { cn } from '@/lib/utils'

import { LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: string
  description: string
  className?: string
}

export function KpiCard({ icon: Icon, label, value, description, className }: KpiCardProps) {
  return (
    <Card
      className={cn(
        'bg-card border border-border/60 shadow-sm hover:shadow-md transition-shadow min-h-[120px] flex flex-col',
        className
      )}
    >
      <div className="p-4 md:p-6 flex flex-col flex-1 min-w-0">
        {/* A) Top row: icon + label */}
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
            {label}
          </p>
        </div>

        {/* B) Main value */}
        <p className="text-3xl font-bold truncate mt-4">{value}</p>

        {/* C) Description */}
        <p className="text-xs text-muted-foreground truncate mt-1">{description}</p>
      </div>
    </Card>
  )
}
