import { Users, UserPlus, Eye, Link2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { QuickStats } from './overview-panel-content'

interface OverviewStatsCardsProps {
    stats: QuickStats
}

export function OverviewStatsCards({ stats }: OverviewStatsCardsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border border-border/60 shadow-sm">
                <CardContent className="p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Followers</p>
                    </div>
                    {stats.followers !== null ? (
                        <p className="text-lg font-semibold tracking-tight">
                            {stats.followers.toLocaleString('en-US')}
                        </p>
                    ) : (
                        <Skeleton className="h-6 w-12" />
                    )}
                </CardContent>
            </Card>
            <Card className="bg-card border border-border/60 shadow-sm">
                <CardContent className="p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                        <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Following</p>
                    </div>
                    {stats.following !== null ? (
                        <p className="text-lg font-semibold tracking-tight">
                            {stats.following.toLocaleString('en-US')}
                        </p>
                    ) : (
                        <Skeleton className="h-6 w-12" />
                    )}
                </CardContent>
            </Card>
            <Card className="bg-card border border-border/60 shadow-sm">
                <CardContent className="p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Views (7d)</p>
                    </div>
                    {stats.views7d !== null ? (
                        <p className="text-lg font-semibold tracking-tight">
                            {stats.views7d.toLocaleString('en-US')}
                        </p>
                    ) : (
                        <Skeleton className="h-6 w-12" />
                    )}
                </CardContent>
            </Card>
            <Card className="bg-card border border-border/60 shadow-sm opacity-50">
                <CardContent className="p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                        <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Total Links</p>
                    </div>
                    {stats.totalLinks !== null ? (
                        <p className="text-lg font-semibold tracking-tight text-muted-foreground">
                            {stats.totalLinks.toLocaleString('en-US')}
                        </p>
                    ) : (
                        <Skeleton className="h-6 w-12" />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
