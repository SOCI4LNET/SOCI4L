"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ProfileReadinessProps {
    profile: {
        displayName?: string | null
        bio?: string | null
        slug?: string | null
        socialLinks?: any[] | null
        avatarUrl?: string | null
    }
}

export function ProfileReadiness({ profile }: ProfileReadinessProps) {
    const steps = [
        {
            label: "Set a Display Name",
            completed: !!profile.displayName && profile.displayName.length > 0,
            link: "/dashboard/settings"
        },
        {
            label: "Add a Bio",
            completed: !!profile.bio && profile.bio.length > 0,
            link: "/dashboard/builder"
        },
        {
            label: "Claim a Custom URL",
            completed: !!profile.slug && profile.slug.length > 0,
            link: "/dashboard/settings"
        },
        {
            label: "Connect Social Links",
            completed: !!profile.socialLinks && profile.socialLinks.length > 0,
            link: "/dashboard/builder"
        }
    ]

    const completedCount = steps.filter(s => s.completed).length
    const totalSteps = steps.length
    const progress = (completedCount / totalSteps) * 100

    if (progress === 100) return null

    return (
        <Card className="bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
            <CardHeader className="pb-3">
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
                    {steps.map((step, idx) => (
                        <div key={idx} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                                {step.completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className={`text-sm ${step.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                    {step.label}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
