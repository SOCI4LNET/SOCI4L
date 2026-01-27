'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { CustomTooltip, chartAxisProps, chartGridProps, chartLineProps } from '@/components/insights/chart-theme'

interface TrendDataPoint {
  date: string
  profiles: number
  follows: number
  links: number
  views: number
  clicks: number
}

interface OverviewTrendsProps {
  trends: TrendDataPoint[]
}

export function OverviewTrends({ trends }: OverviewTrendsProps) {
  // Format Y-axis ticks (defined in client component to avoid serialization issues)
  const formatYAxisTick = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
    return value.toString()
  }

  if (trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Growth Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-80 min-h-[320px] text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-2">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">No trend data available yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Check back in a few days to see growth trends
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = trends.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    profiles: point.profiles,
    follows: point.follows,
    links: point.links,
    views: point.views,
    clicks: point.clicks,
  }))

  // Calculate max value for Y-axis domain
  const maxValue = Math.max(
    ...chartData.map((d) => Math.max(d.profiles, d.follows, d.links, d.views, d.clicks)),
  )
  const yAxisDomain = [0, Math.ceil(maxValue * 1.1)] // Add 10% padding

  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth Trends (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 min-h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 12, bottom: 8, left: 8 }}
            >
              <CartesianGrid {...chartGridProps} />
              <XAxis
                dataKey="date"
                {...chartAxisProps}
                angle={-45}
                textAnchor="end"
                height={60}
                interval="preserveStartEnd"
              />
              <YAxis
                {...chartAxisProps}
                domain={yAxisDomain}
                tickFormatter={formatYAxisTick}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="profiles"
                stroke="hsl(var(--primary))"
                name="New Profiles"
                {...chartLineProps}
              />
              <Line
                type="monotone"
                dataKey="follows"
                stroke="hsl(var(--primary))"
                strokeDasharray="5 5"
                name="New Follows"
                {...chartLineProps}
              />
              <Line
                type="monotone"
                dataKey="links"
                stroke="hsl(var(--primary))"
                strokeDasharray="3 3"
                name="New Links"
                {...chartLineProps}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
