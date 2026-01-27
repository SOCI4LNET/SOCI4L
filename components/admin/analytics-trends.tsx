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

interface AnalyticsTrendDataPoint {
  date: string
  views: number
  clicks: number
}

interface AnalyticsTrendsProps {
  trends: AnalyticsTrendDataPoint[]
}

export function AnalyticsTrends({ trends }: AnalyticsTrendsProps) {
  if (trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Engagement Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-xs text-muted-foreground">
            No analytics data available yet.
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
    views: point.views,
    clicks: point.clicks,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Trends (Last 30 Days)</CardTitle>
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
                dataKey="views"
                stroke="hsl(var(--primary))"
                name="Profile Views"
                {...chartLineProps}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="hsl(var(--primary))"
                strokeDasharray="5 5"
                name="Link Clicks"
                {...chartLineProps}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
