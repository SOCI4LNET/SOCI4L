'use client'

import { TooltipProps } from 'recharts'

// Custom tooltip for dark theme compatibility - Enhanced clarity
export function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-border/80 bg-background/98 px-4 py-2.5 text-sm text-foreground shadow-lg backdrop-blur-sm transition-all duration-150 ease-out animate-in fade-in-0 zoom-in-95">
      {label && (
        <p className="mb-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1.5">
          {label}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2.5 transition-opacity duration-150">
            <div
              className="h-2.5 w-2.5 rounded-full border border-background/50 transition-transform duration-150 hover:scale-110"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs font-medium text-muted-foreground min-w-[100px]">
              {entry.name || entry.dataKey}:
            </span>
            <span className="text-xs font-bold text-foreground">
              {typeof entry.value === 'number' ? entry.value.toLocaleString('en-US') : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Shared axis props for dark theme - Enhanced readability
export const chartAxisProps = {
  tick: {
    fill: 'hsl(var(--muted-foreground))',
    fontSize: 11,
    fontWeight: 500,
  },
  axisLine: {
    stroke: 'hsl(var(--border))',
    strokeOpacity: 0.3,
    strokeWidth: 1,
  },
  tickLine: {
    stroke: 'hsl(var(--border))',
    strokeOpacity: 0.2,
    strokeWidth: 1,
  },
  tickMargin: 8,
  interval: 'preserveStartEnd' as const,
}

// Shared grid props - Refined baseline and grid
export const chartGridProps = {
  stroke: 'hsl(var(--border))',
  strokeOpacity: 0.2,
  strokeDasharray: '2 4',
  vertical: false, // Only horizontal grid lines for cleaner look
  horizontal: true,
}

// Shared bar props - thinner bars for cleaner look
export const chartBarProps = {
  barSize: 16,
  radius: [4, 4, 0, 0] as [number, number, number, number],
}

// Shared line props - Enhanced visibility with micro-interactions
export const chartLineProps = {
  strokeWidth: 2,
  dot: false,
  activeDot: {
    r: 6,
    fill: 'hsl(var(--primary))',
    stroke: 'hsl(var(--background))',
    strokeWidth: 2,
    style: {
      transition: 'r 0.15s ease-out',
    },
  },
  animationDuration: 300,
}
