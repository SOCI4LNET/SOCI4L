'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { ArrowRight, Book, Key, Layers, Shield } from "lucide-react"

// Map of components available in MDX
export const components = {
    // Shadcn Components
    Card: ({ href, children, ...props }: any) => {
        // If href provided, wrap in Link
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

    // Standard HTML overrides
    a: ({ href, children, ...props }: any) => (
        <Link href={href || '#'} {...props} className="text-primary hover:underline font-medium">
            {children}
        </Link>
    ),

    // Code block syntax highlighting? handled by rehype plugins often, or custom component
}
