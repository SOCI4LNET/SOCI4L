
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { ArrowRight, Book, Key, Layers, Shield, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { CodeBlock } from "@/components/docs/code-block"
import { CodeGroup } from "@/components/docs/code-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

// --- Custom Components ---

const Callout = ({ type = "info", title, children, ...props }: any) => {
    let Icon = Info
    let variant: "default" | "destructive" = "default"
    let className = "border-blue-500/50 text-blue-500 dark:border-blue-500/30"

    if (type === 'warning') { Icon = AlertTriangle; className = "border-yellow-500/50 text-yellow-600 dark:text-yellow-500 dark:border-yellow-500/30" }
    if (type === 'danger' || type === 'error') { Icon = XCircle; variant = "destructive" }
    if (type === 'success' || type === 'tip') { Icon = CheckCircle; className = "border-green-500/50 text-green-600 dark:text-green-500 dark:border-green-500/30" }

    return (
        <Alert variant={variant} className={cn("my-6", className)} {...props}>
            <Icon className="h-4 w-4" />
            {title && <AlertTitle>{title}</AlertTitle>}
            <AlertDescription className="mt-2 text-sm [&>p]:leading-normal">
                {children}
            </AlertDescription>
        </Alert>
    )
}

const Tabs = ({ items, children }: any) => {
    return (
        <div className="my-6 border rounded-md overflow-hidden bg-background">
            {/* Simple tab rendering for now, matching preview renderer */}
            <div className="bg-muted/50 p-2 flex gap-2 border-b">
                {items?.map((item: string) => (
                    <span key={item} className="text-xs font-mono px-2 py-1 bg-background rounded border shadow-sm">{item}</span>
                ))}
            </div>
            <div className="p-0 [&>pre]:m-0 [&>pre]:rounded-none [&>pre]:border-0">
                {children}
            </div>
        </div>
    )
}

const Steps = ({ children }: any) => {
    return (
        <div className="space-y-4 pl-4 border-l-2 border-muted my-6 counter-reset-step">
            {children}
        </div>
    )
}

// Map of components available in MDX
export const components = {
    // Shadcn Components
    Card: ({ href, children, ...props }: any) => {
        if (href) {
            return (
                <Link href={href} className="block not-prose h-full">
                    <Card {...props} className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                        <CardHeader>
                            {children}
                        </CardHeader>
                    </Card>
                </Link>
            )
        }
        return (
            <Card {...props} className="not-prose hover:border-primary/50 transition-colors">
                <CardHeader>{children}</CardHeader>
            </Card>
        )
    },
    CardTitle,
    CardDescription,
    CardContent,
    CardHeader,
    Button,

    // Icons
    ArrowRight,
    Book,
    Key,
    Layers,
    Shield,

    // Custom Docs Components
    Callout,
    Tabs,
    Tab: ({ children }: any) => <>{children}</>, // Pass through content for now
    Steps,

    // Standard HTML overrides
    a: ({ href, children, ...props }: any) => (
        <Link href={href || '#'} {...props} className="text-primary hover:underline font-medium">
            {children}
        </Link>
    ),

    // Explicit overrides for typography plugin to pick up
    h1: ({ children }: any) => <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mt-12 mb-6">{children}</h1>,
    h2: ({ children }: any) => <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-12 mb-6">{children}</h2>,
    h3: ({ children }: any) => <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4">{children}</h3>,
    ul: ({ children }: any) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>,
    ol: ({ children }: any) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>,
    li: ({ children }: any) => <li className="leading-7">{children}</li>,

    // Explicit override for pre to ensure scrolling
    pre: ({ children }: any) => (
        <div className="relative rounded-lg border bg-muted/50 my-6 overflow-x-auto">
            <pre className="p-4">{children}</pre>
        </div>
    ),

    // Code block syntax highlighting? handled by rehype plugins often, or custom component
    CodeBlock,
    CodeGroup,
}
