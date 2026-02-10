import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PageShell } from '@/components/app-shell/page-shell'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Eye, Crown, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow, differenceInDays } from 'date-fns'

// Force dynamic rendering since this page might show real-time data
export const dynamic = 'force-dynamic'

async function getPremiumUsers() {
    // Fetch profiles that have a premium subscription (expiration date in future or past)
    const profiles = await prisma.profile.findMany({
        where: {
            premiumExpiresAt: {
                not: null
            }
        },
        orderBy: {
            premiumExpiresAt: 'desc'
        },
    })

    // Fetch related billing interactions for precise payment info
    const txHashes = profiles.map(p => p.premiumLastTxHash).filter(Boolean) as string[]

    // Create a map of txHash -> BillingInteraction
    const interactionMap = new Map()

    if (txHashes.length > 0) {
        const interactions = await prisma.billingInteraction.findMany({
            where: {
                txHash: {
                    in: txHashes
                }
            }
        })

        interactions.forEach(i => {
            interactionMap.set(i.txHash, i)
        })
    }

    return { profiles, interactionMap }
}

export default async function AdminPremiumPage() {
    const { profiles, interactionMap } = await getPremiumUsers()

    // Calculate stats
    const totalPremium = profiles.length
    const activePremium = profiles.filter(p => p.premiumExpiresAt && new Date(p.premiumExpiresAt) > new Date()).length
    const expiredPremium = totalPremium - activePremium

    return (
        <PageShell
            title="Premium Users"
            subtitle="Monitor and manage Pro subscriptions."
            mode="constrained"
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Premium Users</h3>
                        <Crown className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{totalPremium}</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Active Subscriptions</h3>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activePremium}</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Expired Subscriptions</h3>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{expiredPremium}</div>
                </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border/60">
                            <TableHead className="min-w-[140px] h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                User
                            </TableHead>
                            <TableHead className="min-w-[100px] h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Status
                            </TableHead>
                            <TableHead className="min-w-[140px] h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Expiration
                            </TableHead>
                            <TableHead className="min-w-[140px] hidden md:table-cell h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Last Payment
                            </TableHead>
                            <TableHead className="min-w-[140px] hidden lg:table-cell h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                TX Hash
                            </TableHead>
                            <TableHead className="text-right min-w-[140px] h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {profiles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                    No premium users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            profiles.map((profile) => {
                                const expiresAt = profile.premiumExpiresAt ? new Date(profile.premiumExpiresAt) : null
                                const isActive = expiresAt && expiresAt > new Date()
                                const daysRemaining = expiresAt ? differenceInDays(expiresAt, new Date()) : 0

                                const interaction = profile.premiumLastTxHash ? interactionMap.get(profile.premiumLastTxHash) : null

                                return (
                                    <TableRow key={profile.id} className="group hover:bg-muted/50 transition-colors">
                                        <TableCell className="py-4 align-top">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{profile.displayName || 'Unnamed User'}</span>
                                                <span className="font-mono text-xs text-muted-foreground">{profile.address.slice(0, 6)}...{profile.address.slice(-4)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 align-top">
                                            <Badge
                                                variant={isActive ? "default" : "destructive"}
                                                className={`text-xs font-semibold ${isActive
                                                    ? 'bg-green-600/10 text-green-700 dark:text-green-400 border-green-600/20'
                                                    : 'bg-red-600/10 text-red-700 dark:text-red-400 border-red-600/20'
                                                    }`}
                                            >
                                                {isActive ? 'Active' : 'Expired'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 align-top">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {expiresAt ? expiresAt.toLocaleDateString() : 'N/A'}
                                                </span>
                                                {isActive && (
                                                    <span className="text-xs text-muted-foreground relative top-[-2px]">
                                                        {daysRemaining} days left
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell py-4 align-top">
                                            <div className="flex flex-col">
                                                {interaction ? (
                                                    <>
                                                        <span className="text-sm font-medium">{interaction.amount}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(interaction.timestamp).toLocaleDateString()}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        {profile.premiumLastTxHash ? 'Data missing' : '—'}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell py-4 align-top font-mono text-xs">
                                            {profile.premiumLastTxHash ? (
                                                <Link
                                                    href={`https://snowtrace.io/tx/${profile.premiumLastTxHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 hover:text-primary transition-colors hover:underline"
                                                >
                                                    {profile.premiumLastTxHash.slice(0, 10)}...
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            ) : (
                                                <span className="text-muted-foreground/50">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right py-4 align-top">
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs font-medium gap-1.5"
                                                >
                                                    <Link href={`/master-console/users/${encodeURIComponent(profile.address.toLowerCase())}`}>
                                                        <Eye className="h-3 w-3" />
                                                        Details
                                                    </Link>
                                                </Button>
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs font-medium gap-1.5"
                                                >
                                                    <Link href={`/p/${profile.slug || profile.address}`} target="_blank">
                                                        <ExternalLink className="h-3 w-3" />
                                                        Profile
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </PageShell>
    )
}
