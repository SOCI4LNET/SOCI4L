import { Trophy, Shield, Users, Award } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ScoreSystemPage() {
    return (
        <div className="max-w-4xl space-y-10 pb-10">
            {/* Hero Section */}
            <div className="space-y-4 border-b pb-8">
                <div className="inline-flex items-center rounded-lg bg-yellow-500/10 text-yellow-500 px-3 py-1 text-sm font-medium">
                    <Trophy className="mr-2 size-4" />
                    Rank System Documentation
                </div>
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
                    SOCI4L Score System
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                    A reputation measures profile completeness and social engagement. Scores are designed to be valuable — even 10 points matters.
                </p>
            </div>

            {/* Overview Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Example Starter</CardTitle>
                        <div className="text-2xl font-bold">0 pts</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">Minimal profile with no data</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Example Rising</CardTitle>
                        <div className="text-2xl font-bold">30.5 pts</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">Complete profile + 15 followers</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Example Elite</CardTitle>
                        <div className="text-2xl font-bold">67.5 pts</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">Popular profile + 100 followers</div>
                    </CardContent>
                </Card>
            </div>


            {/* Profile Completion Section */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <Shield className="size-6 text-primary" />
                    Profile Completion
                </h2>
                <p className="text-muted-foreground">
                    Early actions are worth more to encourage setup. Maximum 25 points available.
                </p>
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Action</TableHead>
                                <TableHead>Points</TableHead>
                                <TableHead>Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Claim Profile</TableCell>
                                <TableCell>+5</TableCell>
                                <TableCell>Claiming ownership of your wallet address</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Display Name</TableCell>
                                <TableCell>+2</TableCell>
                                <TableCell>Adding a display name to your profile</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Bio</TableCell>
                                <TableCell>+3</TableCell>
                                <TableCell>Adding a bio/description</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Social Links</TableCell>
                                <TableCell>+1 ea (max 5)</TableCell>
                                <TableCell>Adding X, GitHub, etc.</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Profile Links</TableCell>
                                <TableCell>+1 ea (max 10)</TableCell>
                                <TableCell>Adding custom links to your profile</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Card>
            </section>

            {/* Social Scoring Section */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <Users className="size-6 text-blue-500" />
                    Social Engagement
                </h2>
                <p className="text-muted-foreground">
                    Followers use a <strong>tiered diminishing returns</strong> system to prevent score inflation.
                </p>
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Follower Range</TableHead>
                                <TableHead>Points per Follower</TableHead>
                                <TableHead>Cumulative Max</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">1 - 10</TableCell>
                                <TableCell>1.0</TableCell>
                                <TableCell>10 pts</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">11 - 50</TableCell>
                                <TableCell>0.5</TableCell>
                                <TableCell>30 pts</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">51 - 200</TableCell>
                                <TableCell>0.25</TableCell>
                                <TableCell>67.5 pts</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">200+</TableCell>
                                <TableCell>0.1</TableCell>
                                <TableCell>Unlimited</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Card>
            </section>

            {/* Tiers Section */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <Award className="size-6 text-orange-500" />
                    Score Tiers
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle className="text-lg">Tiers breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium">Starter</span>
                                <span className="text-muted-foreground">0+ pts</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium">Newcomer</span>
                                <span className="text-muted-foreground">5+ pts</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium">Rising</span>
                                <span className="text-muted-foreground">10+ pts</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium text-primary">Established</span>
                                <span className="text-primary font-bold">25+ pts</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium text-purple-500">Elite</span>
                                <span className="text-purple-500 font-bold">50+ pts</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-yellow-500">Legendary</span>
                                <span className="text-yellow-500 font-bold">100+ pts</span>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg border bg-card">
                            <h3 className="font-semibold mb-2">Why Diminishing Returns?</h3>
                            <p className="text-sm text-muted-foreground">
                                We want to ensure that early growth feels rewarding, but also that "whales" or massive influencers don't break the scale. Getting your first 10 followers is just as important for your score as getting your next 100.
                            </p>
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                            <h3 className="font-semibold mb-2">Design Principles</h3>
                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                <li>Every point matters</li>
                                <li>Completeness is rewarded</li>
                                <li>Social engagement drives growth</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
