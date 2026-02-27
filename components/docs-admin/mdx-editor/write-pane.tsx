'use client'

import { useCallback, useEffect, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'
import { useEditorStore } from './use-editor-state'
import { EditorView } from '@codemirror/view'

export function WritePane() {
    const { content, setContent, setScrollPercentage, editorCommand, dispatchCommand } = useEditorStore()
    const viewRef = useRef<EditorView | null>(null)

    // Handle Commands
    useEffect(() => {
        if (!editorCommand || !viewRef.current) return

        const view = viewRef.current
        const state = view.state

        // Execute Command
        switch (editorCommand.type) {
            case 'insert': {
                const range = view.state.selection.main
                view.dispatch({
                    changes: { from: range.from, to: range.to, insert: editorCommand.text },
                    selection: { anchor: range.from + editorCommand.text.length }
                })
                break
            }
            case 'wrap': {
                const range = view.state.selection.main
                const selectedText = state.sliceDoc(range.from, range.to)
                const text = `${editorCommand.prefix}${selectedText}${editorCommand.suffix}`
                view.dispatch({
                    changes: { from: range.from, to: range.to, insert: text },
                    selection: { anchor: range.from + editorCommand.prefix.length + selectedText.length + editorCommand.suffix.length } // move to end?
                    // Better: select the inner text? For now just put cursor at end
                })
                break
            }
        }

        // Clear command
        dispatchCommand(null as any) // Reset
    }, [editorCommand, dispatchCommand])

    // We keep a local ref to avoid re-rendering loop issues if needed, 
    // but for now simple 2-way binding is fine with CodeMirror's internal diffing.

    const onChange = useCallback((val: string, viewUpdate: any) => {
        setContent(val)
    }, [setContent])

    const handleCreateEditor = (view: EditorView, state: any) => {
        viewRef.current = view
        // Attach scroll listener to the scroller DOM
        const scroller = view.scrollDOM
        scroller.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = scroller
            const maxScroll = scrollHeight - clientHeight
            if (maxScroll > 0) {
                const percentage = scrollTop / maxScroll
                setScrollPercentage(percentage)
            }
        })
    }

    return (
        <div className="h-full w-full bg-[#282c34] overflow-hidden text-sm"> {/* Match oneDark bg */}
            <CodeMirror
                value={content}
                height="100%"
                theme={oneDark}
                extensions={[
                    markdown({ base: markdownLanguage, codeLanguages: languages }),
                    EditorView.lineWrapping
                ]}
                onChange={onChange}
                onCreateEditor={handleCreateEditor}
                className="h-full"
                basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                    autocompletion: true,
                }}
            />
        </div>
    )
}
