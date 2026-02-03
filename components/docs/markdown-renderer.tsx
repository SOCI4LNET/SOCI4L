'use client'

import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { cn } from '@/lib/utils'

// Custom components map
const components = {
    code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '')
        return !inline && match ? (
            <SyntaxHighlighter
                {...props}
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        ) : (
            <code {...props} className={cn("bg-muted px-1.5 py-0.5 rounded font-mono text-sm", className)}>
                {children}
            </code>
        )
    },
    // Add other custom components like CodeGroup if we can parse them from raw MDX strings
    // Note: For full component support in preview, we might need 'next-mdx-remote' on client side 
    // or a more robust parser. For now, we stick to basic markdown + code highlighting.
}

export function MarkdownRenderer({ content }: { content: string }) {
    return (
        <div className="prose prose-zinc dark:prose-invert max-w-none">
            <ReactMarkdown components={components}>
                {content}
            </ReactMarkdown>
        </div>
    )
}
