'use client'

import { useState, useRef, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Save, Code, Eye, Monitor, FileCode } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface RichMDXEditorProps {
    initialContent?: string
    onChange?: (value: string) => void
}

export function RichMDXEditor({ initialContent = '', onChange }: RichMDXEditorProps) {
    const [content, setContent] = useState(initialContent)
    const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'split'>('split')

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value
        setContent(newVal)
        onChange?.(newVal)
    }

    const insertSnippet = (snippet: string) => {
        setContent(prev => prev + '\n' + snippet)
        onChange?.(content + '\n' + snippet)
    }

    const codeTabsSnippet = `
<CodeGroup>
  <CodeBlock title="npm">
    npm install viem
  </CodeBlock>
  <CodeBlock title="pnpm">
    pnpm install viem
  </CodeBlock>
  <CodeBlock title="yarn">
    yarn add viem
  </CodeBlock>
</CodeGroup>
`

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] border border-border rounded-md overflow-hidden bg-background">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
                <div className="flex items-center gap-1">
                    <Button
                        variant={activeTab === 'write' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('write')}
                    >
                        <Code className="h-4 w-4 mr-2" /> Write
                    </Button>
                    <Button
                        variant={activeTab === 'preview' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('preview')}
                    >
                        <Eye className="h-4 w-4 mr-2" /> Preview
                    </Button>
                    <Button
                        variant={activeTab === 'split' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('split')}
                        className="hidden md:flex"
                    >
                        <Monitor className="h-4 w-4 mr-2" /> Split
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => insertSnippet(codeTabsSnippet)}>
                        <FileCode className="h-4 w-4 mr-2" /> Insert Code Tabs
                    </Button>
                </div>
            </div>

            <div className="flex-1 relative flex">
                {activeTab === 'split' ? (
                    <>
                        <div className="w-1/2 border-r border-border/40">
                            <EditorPane content={content} onChange={handleChange} />
                        </div>
                        <div className="w-1/2">
                            <PreviewPane content={content} />
                        </div>
                    </>
                ) : activeTab === 'write' ? (
                    <EditorPane content={content} onChange={handleChange} />
                ) : (
                    <PreviewPane content={content} />
                )}
            </div>
        </div>
    )
}

function EditorPane({ content, onChange }: { content: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }) {
    return (
        <Textarea
            value={content}
            onChange={onChange}
            className="w-full h-full resize-none p-4 font-mono text-sm border-0 focus-visible:ring-0 rounded-none bg-zinc-950 text-zinc-100"
            placeholder="# Start writing your article..."
        />
    )
}

function PreviewPane({ content }: { content: string }) {
    return (
        <div className="w-full h-full overflow-y-auto p-8 prose prose-zinc dark:prose-invert max-w-none bg-background">
            {/* Basic MD preview for admin - fully realized MDX will happen on frontend */}
            <ReactMarkdown>{content}</ReactMarkdown>

            {/* Hint for custom components */}
            {content.includes('<CodeGroup>') && (
                <div className="mt-4 p-4 border border-blue-500/20 bg-blue-500/10 rounded-md text-sm text-blue-400">
                    ℹ️ Custom MDX components like &lt;CodeGroup&gt; will be rendered interactively on the live site.
                </div>
            )}
        </div>
    )
}
