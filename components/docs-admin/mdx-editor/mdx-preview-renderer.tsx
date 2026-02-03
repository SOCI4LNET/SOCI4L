'use client'

import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { cn } from '@/lib/utils'
import { components as sharedComponents } from '@/components/docs/mdx-components'
// import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

// Custom Components Implementation for Preview
// We use components from @/components/docs/mdx-components

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
    ...sharedComponents,
    // Override code to keep syntax highlighting which might be missing in shared components client-side usage if not using rehype-pretty-code
    code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '')
        return !inline && match ? (
            <SyntaxHighlighter
                {...props}
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                className="rounded-md !bg-zinc-950 !p-4 !m-0 my-4"
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        ) : (
            <code {...props} className={cn("bg-muted px-1.5 py-0.5 rounded font-mono text-sm", className)}>
                {children}
            </code>
        )
    },
}

export function MDXPreviewRenderer({ content }: { content: string }) {
    return (
        <div className="w-full">
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
