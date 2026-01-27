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
  if (trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Growth Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-xs text-muted-foreground">
            No trend data available yet. Check back in a few days.
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth Trends (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="date" {...chartAxisProps} />
              <YAxis {...chartAxisProps} />
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
