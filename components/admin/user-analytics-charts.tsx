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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TimeSeriesDataPoint {
  date: string
  views: number
  clicks: number
}

interface TopClickedLink {
  linkId: string | null
  linkTitle: string
  linkUrl: string | null
  clicks: number
}

interface UserAnalyticsChartsProps {
  timeSeriesData: TimeSeriesDataPoint[]
  totalProfileViews: number
  totalLinkClicks: number
  topClickedLinks: TopClickedLink[]
}

export function UserAnalyticsCharts({
  timeSeriesData,
  totalProfileViews,
  totalLinkClicks,
  topClickedLinks,
}: UserAnalyticsChartsProps) {
  return (
    <div className="grid gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div>
              <p className="text-xs text-muted-foreground">Total Profile Views</p>
              <p className="text-2xl font-semibold">
                {totalProfileViews.toLocaleString('en-US')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Link Clicks</p>
              <p className="text-2xl font-semibold">
                {totalLinkClicks.toLocaleString('en-US')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
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

      {topClickedLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Clicked Links</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link</TableHead>
                  <TableHead>Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topClickedLinks.map((link, idx) => (
                  <TableRow key={link.linkId || `link-${idx}`}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="text-sm font-medium">{link.linkTitle}</div>
                        {link.linkUrl && (
                          <a
                            href={link.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:underline truncate max-w-xs"
                          >
                            {link.linkUrl}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold">
                        {link.clicks.toLocaleString('en-US')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
