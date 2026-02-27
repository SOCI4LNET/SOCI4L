'use client'

import { useEffect } from 'react'
import { Toolbar } from './toolbar'
import { WritePane } from './write-pane'
import { PreviewPane } from './preview-pane'
import { useEditorStore } from './use-editor-state'

import { Eye, Monitor, PenTool } from 'lucide-react'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'

interface EditorShellProps {
    initialContent?: string
    onChange?: (value: string) => void
}

export function EditorShell({ initialContent = '', onChange }: EditorShellProps) {
    const { viewMode, content, setContent, setViewMode } = useEditorStore()

    // Initialize
    useEffect(() => {
        if (initialContent) {
            setContent(initialContent)
        }
    }, [initialContent, setContent])

    // Propagate changes up
    useEffect(() => {
        onChange?.(content)
    }, [content, onChange])

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] border border-border rounded-md overflow-hidden bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-muted/20 px-2 h-10">
                {/* View Toggles (Left) */}
                <div className="flex items-center gap-1">
                    <Button
                        variant={viewMode === 'write' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('write')}
                        className="h-7 px-2 text-xs"
                    >
                        <PenTool className="h-3.5 w-3.5 mr-1" /> Write
                    </Button>
                    <Button
                        variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('preview')}
                        className="h-7 px-2 text-xs"
                    >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                    </Button>
                    <Button
                        variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('split')}
                        className="h-7 px-2 text-xs hidden sm:flex"
                    >
                        <Monitor className="h-3.5 w-3.5 mr-1" /> Split
                    </Button>
                </div>
            </div>

            <Toolbar />

            <div className="flex-1 relative overflow-hidden">
                {viewMode === 'split' ? (
                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel defaultSize={50} minSize={30}>
                            <WritePane />
                        </ResizablePanel>
                        <ResizableHandle />
                        <ResizablePanel defaultSize={50} minSize={30}>
                            <PreviewPane />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                ) : viewMode === 'write' ? (
                    <WritePane />
                ) : (
                    <PreviewPane />
                )}
            </div>

            {/* Status Bar */}
            <div className="h-6 border-t border-border bg-muted/40 text-[10px] flex items-center px-4 text-muted-foreground justify-between">
                <div>Markdown Mode</div>
                <div>{content.length} chars</div>
            </div>
        </div>
    )
}
