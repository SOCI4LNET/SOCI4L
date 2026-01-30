"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ProfileReadinessProps {
    profile: {
        displayName?: string | null
        bio?: string | null
        slug?: string | null
        socialLinks?: any[] | null
        avatarUrl?: string | null
    }
    address: string
    onClose?: () => void
}

export function ProfileReadiness({ profile, address, onClose }: ProfileReadinessProps) {
    const router = useRouter()

    const steps = [
        {
            label: "Set a Display Name",
            completed: !!profile.displayName && profile.displayName.length > 0,
            link: `?tab=settings`
        },
        {
            label: "Add a Bio",
            completed: !!profile.bio && profile.bio.length > 0,
            link: `?tab=builder`
        },
        {
            label: "Claim a Custom URL",
            completed: !!profile.slug && profile.slug.length > 0,
            link: `?tab=settings`
        },
        {
            label: "Connect Social Links",
            completed: !!profile.socialLinks && profile.socialLinks.length > 0,
            link: `?tab=builder`
        }
    ]

    const completedCount = steps.filter(s => s.completed).length
    const totalSteps = steps.length
    const progress = (completedCount / totalSteps) * 100

    if (progress === 100) return null

    return (
        <Card className="bg-gradient-to-br from-primary/5 via-card to-card border-primary/20 relative group">
            {onClose && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={onClose}
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </Button>
            )}
            <CardHeader className="pb-3 pr-10">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Profile Setup</CardTitle>
                    <span className="text-sm font-medium text-primary">{Math.round(progress)}% Complete</span>
                </div>
                <CardDescription>
                    Complete your profile to increase visibility and trust.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Progress value={progress} className="h-2" />
                <div className="grid gap-2">
                    {steps.map((step, idx) => {
                        const content = (
                            <>
                                {step.completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <span className={`text-sm ${step.completed ? 'text-muted-foreground line-through' : 'font-medium'}`}>
                                    {step.label}
                                </span>
                            </>
                        )

                        if (step.completed) {
                            return (
                                <div key={idx} className="flex items-center gap-2 p-1.5 rounded-md opacity-60">
                                    {content}
                                </div>
                            )
                        }

                        return (
                            <Link
                                key={idx}
                                href={`/dashboard/${address}${step.link}`}
                                className="flex items-center gap-2 p-1.5 rounded-md transition-colors hover:bg-primary/5"
                            >
                                {content}
                            </Link>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
