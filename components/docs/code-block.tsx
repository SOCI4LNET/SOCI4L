import { ReactNode } from 'react'

interface CodeBlockProps {
    title: string
    children: ReactNode
}

export function CodeBlock({ title, children }: CodeBlockProps) {
    // This component is mostly a data carrier for CodeGroup
    // But if used standalone, it should render something
    return (
        <div className="rounded-lg border bg-muted/30 my-4">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
            </div>
            <div className="p-4 overflow-x-auto">
                {children}
            </div>
        </div>
    )
}
