'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserPlus, Activity, Eye, Info } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

interface SocialStats {
    mutuals: number
    new7d: {
        followers: number
        following: number
    }
    active30d: number
    topInteracted: number | null
}

interface SocialKPICardsProps {
    stats: SocialStats | null | undefined
    loading?: boolean
}

function StatCard({
    label,
    value,
    icon: Icon,
    description,
    trend,
    privacyLocked = false,
}: {
    label: string
    value: number | string
    icon: React.ComponentType<{ className?: string }>
    description: string
    trend?: string
    privacyLocked?: boolean
}) {
    return (
        <Card className="bg-card border border-border/60">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <p className="text-xs font-medium text-muted-foreground">{label}</p>
                            {privacyLocked && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs">Privacy setting required</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{description}</p>
                    </div>
                    {trend && (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            {trend}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export function SocialKPICards({ stats, loading = false }: SocialKPICardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="bg-card border border-border/60">
                        <CardContent className="p-4">
                            <Skeleton className="h-4 w-20 mb-2" />
                            <Skeleton className="h-8 w-16 mb-1" />
                            <Skeleton className="h-3 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!stats) {
        return null
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard
                label="Mutuals"
                value={stats.mutuals}
                icon={Users}
                description="Mutual connections"
            />
            <StatCard
                label="New (7d)"
                value={stats.new7d.followers + stats.new7d.following}
                icon={UserPlus}
                description={`${stats.new7d.followers} followers, ${stats.new7d.following} following`}
            />
            <StatCard
                label="Active (30d)"
                value={stats.active30d}
                icon={Activity}
                description="Active in last 30 days"
            />
            <StatCard
                label="Top Interacted"
                value={stats.topInteracted ?? '—'}
                icon={Eye}
                description="Most interactions"
                privacyLocked={stats.topInteracted === null}
            />
        </div>
    )
}
