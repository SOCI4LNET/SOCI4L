'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Eye, Clock, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DocsAdminDashboard() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                <Button asChild>
                    <Link href="/docs-admin/editor/new">Create New Article</Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Articles" value="12" icon={FileText} />
                <StatCard title="Total Views" value="1,234" icon={Eye} />
                <StatCard title="Last Updated" value="2h ago" icon={Clock} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Articles</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground p-8 text-center border border-dashed rounded-lg">
                        No articles yet. Start by creating one.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function StatCard({ title, value, icon: Icon }: any) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}
