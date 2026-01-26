'use client'

import { TooltipProps } from 'recharts'

// Custom tooltip for dark theme compatibility
export function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-border/60 bg-background/95 px-3 py-2 text-sm text-foreground shadow-md backdrop-blur-sm">
      {label && (
        <p className="mb-1 font-medium text-xs text-muted-foreground">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs font-medium">{entry.name || entry.dataKey}:</span>
            <span className="text-xs font-semibold">
              {typeof entry.value === 'number' ? entry.value.toLocaleString('en-US') : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Shared axis props for dark theme
export const chartAxisProps = {
  tick: {
    fill: 'hsl(var(--muted-foreground))',
    fontSize: 12,
  },
  axisLine: false,
  tickLine: false,
}

// Shared grid props
export const chartGridProps = {
  stroke: 'hsl(var(--border))',
  strokeOpacity: 0.25,
  strokeDasharray: '3 3',
}

// Shared bar props - thinner bars for cleaner look
export const chartBarProps = {
  barSize: 16,
  radius: [4, 4, 0, 0] as [number, number, number, number],
}

// Shared line props
export const chartLineProps = {
  strokeWidth: 1.5,
  dot: false,
  activeDot: { r: 4, fill: 'hsl(var(--primary))' },
}
