
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Book, Key, Layers, Shield } from "lucide-react"

export default function DocsPage() {
    return (
        <div className="max-w-4xl space-y-10 pb-10">
            {/* Hero Section */}
            <div className="space-y-4 border-b pb-8">
                <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium">
                    <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                    Documentation v1.0
                </div>
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
                    Welcome to SOCI4L
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                    The all-in-one Web3 functionality layer. Turn any wallet address into a comprehensive, measurable public profile.
                </p>
                <div className="flex items-center gap-4 pt-4">
                    <Button size="lg" className="gap-2">
                        Get Started <ArrowRight className="size-4" />
                    </Button>
                    <Button variant="outline" size="lg">
                        View API Reference
                    </Button>
                </div>
            </div>

            {/* Quick Links Grid */}
            <section>
                <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0 mb-6">
                    Quick Start
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Book className="size-5 text-primary group-hover:scale-110 transition-transform" />
                                Introduction
                            </CardTitle>
                            <CardDescription>
                                Learn the basics of SOCI4L architecture.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="size-5 text-blue-500 group-hover:scale-110 transition-transform" />
                                Project Structure
                            </CardTitle>
                            <CardDescription>
                                Understand the codebase and components.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="size-5 text-amber-500 group-hover:scale-110 transition-transform" />
                                Authentication
                            </CardTitle>
                            <CardDescription>
                                Deep dive into wallet-based auth.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </section>

            {/* Core Features */}
            <section className="space-y-4">
                <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
                    Core Concepts
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                            <Shield className="size-5 text-green-500" />
                            Privacy First
                        </h3>
                        <p className="text-muted-foreground">
                            We believe your data belongs to you. SOCI4L is built with privacy as a foundational pillar, ensuring you have granular control over what you share.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                            <Layers className="size-5 text-purple-500" />
                            Modular Design
                        </h3>
                        <p className="text-muted-foreground">
                            Built on top of refined shadcn/ui components, our system is designed to be easily extensible and customizable for any Web3 need.
                        </p>
                    </div>
                </div>
            </section>

            {/* Helper */}
            <div className="rounded-lg border bg-muted/30 p-8 text-center mt-8">
                <p className="text-muted-foreground mb-4">
                    Need help integrating? Check out our community resources.
                </p>
                <span className="text-primary font-medium hover:underline cursor-pointer">
                    Join our Discord Community &rarr;
                </span>
            </div>
        </div>
    )
}
