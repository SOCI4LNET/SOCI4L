import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

import {
    Card as ShadcnCard,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface DocsCardProps {
    href: string
    title?: string
    description?: string
    icon?: React.ReactNode
    className?: string
    children?: React.ReactNode
}

export function DocsCard({
    href,
    title,
    description,
    icon,
    className,
    children,
    ...props
}: DocsCardProps) {
    return (
        <Link href={href} className="group block h-full">
            <ShadcnCard
                className={cn(
                    "h-full overflow-hidden transition-all duration-200 border bg-card hover:border-primary/50 hover:shadow-sm relative",
                    className
                )}
                {...props}
            >
                <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="w-5 h-5 text-primary" />
                </div>

                {title ? (
                    <>
                        <CardHeader className="pb-1">
                            <div className="flex items-center gap-3">
                                {icon && (
                                    <div className="flex h-8 w-8 items-center justify-center text-foreground">
                                        {icon}
                                    </div>
                                )}
                                <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors" data-toc-ignore>{title}</CardTitle>
                            </div>
                        </CardHeader>
                        {description && (
                            <CardContent>
                                <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                                    {description}
                                </CardDescription>
                            </CardContent>
                        )}
                        {/* Render children as description extension if explicit title is provided but children exist (migrated content might have body text) */}
                        {!description && children && (
                            <CardContent>
                                <div className="text-sm text-muted-foreground leading-relaxed">
                                    {children}
                                </div>
                            </CardContent>
                        )}
                    </>
                ) : (
                    <CardHeader>
                        <CardContent className="p-0">
                            {children}
                        </CardContent>
                    </CardHeader>
                )}
            </ShadcnCard>
        </Link>
    )
}
