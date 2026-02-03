import { create } from 'zustand'

export type EditorViewMode = 'write' | 'preview' | 'split'

interface EditorState {
    content: string
    viewMode: EditorViewMode
    setContent: (content: string) => void
    setViewMode: (mode: EditorViewMode) => void

    // For precise cursor/scroll syncing (future proofing)
    scrollPercentage: number
    setScrollPercentage: (pct: number) => void

    // Command handling (Toolbar -> Editor)
    editorCommand: EditorCommand | null
    dispatchCommand: (cmd: EditorCommand) => void
}

export type EditorCommand =
    | { type: 'insert'; text: string; range?: { from: number; to: number } }
    | { type: 'wrap'; prefix: string; suffix: string }
    | { type: 'replace'; text: string }

export const useEditorStore = create<EditorState>((set) => ({
    content: '',
    viewMode: 'split',
    scrollPercentage: 0,
    editorCommand: null,
    setContent: (content) => set({ content }),
    setViewMode: (viewMode) => set({ viewMode }),
    setScrollPercentage: (scrollPercentage) => set({ scrollPercentage }),
    dispatchCommand: (cmd) => set({ editorCommand: cmd }),
}))
