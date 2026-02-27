'use client'

import { useRef, useEffect } from 'react'
import { MDXPreviewRenderer } from './mdx-preview-renderer'
import { useEditorStore } from './use-editor-state'

export function PreviewPane() {
    const { content, scrollPercentage } = useEditorStore()
    const containerRef = useRef<HTMLDivElement>(null)
    const isScrollingRef = useRef(false)

    // Sync Scroll from Store -> DOM
    useEffect(() => {
        if (isScrollingRef.current) return

        const container = containerRef.current
        if (!container) return

        const { scrollHeight, clientHeight } = container
        const maxScroll = scrollHeight - clientHeight
        // Only scroll if we can
        if (maxScroll > 0) {
            container.scrollTop = maxScroll * scrollPercentage
        }
    }, [scrollPercentage])

    return (
        <div
            ref={containerRef}
            className="h-full w-full overflow-y-auto bg-background p-8 border-l border-border"
        >
            <div className="w-full max-w-4xl mx-auto pb-20">
                <MDXPreviewRenderer content={content} />
            </div>
        </div>
    )
}
