import React from 'react'
import { ThemeProvider } from "@/components/theme-provider"

export default function EmbedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {/* The transparent background is enforced here, removing min-h-screen and bg-background */}
            <div className="w-full h-full bg-transparent">
                {children}
            </div>
        </ThemeProvider>
    )
}
