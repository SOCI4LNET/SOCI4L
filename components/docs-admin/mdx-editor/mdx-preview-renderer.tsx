'use client'

import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

// Custom Components Implementation for Preview
const Callout = ({ type = "info", title, children }: any) => {
    let Icon = Info
    let variant: "default" | "destructive" = "default"
    let className = "border-blue-500/50 text-blue-500 dark:border-blue-500/30"

    if (type === 'warning') { Icon = AlertTriangle; className = "border-yellow-500/50 text-yellow-600 dark:text-yellow-500 dark:border-yellow-500/30" }
    if (type === 'danger' || type === 'error') { Icon = XCircle; variant = "destructive" }
    if (type === 'success' || type === 'tip') { Icon = CheckCircle; className = "border-green-500/50 text-green-600 dark:text-green-500 dark:border-green-500/30" }

    // Ensure children are rendered properly even if they are blocks
    return (
        <Alert variant={variant} className={cn("my-4", className)}>
            <Icon className="h-4 w-4" />
            {title && <AlertTitle>{title}</AlertTitle>}
            <AlertDescription className="mt-2 text-sm [&>p]:leading-normal">
                {children}
            </AlertDescription>
        </Alert>
    )
}

const CodeTabs = ({ items, children }: any) => {
    return (
        <div className="my-4 border rounded-md overflow-hidden bg-background">
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

// Map components
const components = {
    code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '')
        return !inline && match ? (
            <SyntaxHighlighter
                {...props}
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                className="rounded-md !bg-zinc-950 !p-4 !m-0"
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        ) : (
            <code {...props} className={cn("bg-muted px-1.5 py-0.5 rounded font-mono text-sm", className)}>
                {children}
            </code>
        )
    },
    // Explicitly handle standard elements to ensure prose styles apply or we can override
    ul: ({ children }: any) => <ul className="list-disc pl-6 my-4 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-6 my-4 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="leading-snug">{children}</li>,
    h1: ({ children }: any) => <h1 className="text-3xl font-bold mt-8 mb-4 tracking-tight">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-semibold mt-8 mb-4 tracking-tight border-b pb-2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-semibold mt-6 mb-3 tracking-tight">{children}</h3>,

    // Custom MDX components
    callout: Callout,
    Callout: Callout,
    tabs: CodeTabs,
    Tabs: CodeTabs,
    steps: ({ children }: any) => <div className="space-y-4 pl-4 border-l-2 border-muted my-4 counter-reset-step">{children}</div>,
    Steps: ({ children }: any) => <div className="space-y-4 pl-4 border-l-2 border-muted my-4 counter-reset-step">{children}</div>,
}

export function MDXPreviewRenderer({ content }: { content: string }) {
    return (
        <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-heading prose-code:font-mono">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]} // Essential for parsing tables, strikethrough, etc.
                rehypePlugins={[rehypeRaw]}
                components={components as any}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
