'use client'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Bold, Italic, Code, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Heading4, Type, Terminal, Box, Layers, Play } from 'lucide-react'
import { useEditorStore } from './use-editor-state'

export function Toolbar() {
    const { dispatchCommand } = useEditorStore()

    const handleHeading = (level: number) => {
        const prefix = '#'.repeat(level) + ' '
        dispatchCommand({ type: 'insert', text: prefix })
    }

    const handleFormat = (type: 'bold' | 'italic' | 'code') => {
        switch (type) {
            case 'bold': dispatchCommand({ type: 'wrap', prefix: '**', suffix: '**' }); break;
            case 'italic': dispatchCommand({ type: 'wrap', prefix: '_', suffix: '_' }); break;
            case 'code': dispatchCommand({ type: 'wrap', prefix: '`', suffix: '`' }); break;
        }
    }

    const handleList = (type: 'bullet' | 'number') => {
        dispatchCommand({ type: 'insert', text: type === 'bullet' ? '- ' : '1. ' })
    }

    const insertCallout = (type: 'info' | 'warning' | 'tip' | 'danger' = 'info') => {
        const snippet = `
<Callout type="${type}">
  Title
  
  Content goes here...
</Callout>
`
        dispatchCommand({ type: 'insert', text: snippet })
    }

    const insertTabs = () => {
        const snippet = `
<Tabs items={['npm', 'pnpm', 'yarn']}>
  <Tab value="npm">
    \`\`\`bash
    npm install package
    \`\`\`
  </Tab>
  <Tab value="pnpm">
    \`\`\`bash
    pnpm install package
    \`\`\`
  </Tab>
</Tabs>
`
        dispatchCommand({ type: 'insert', text: snippet })
    }

    const insertSteps = () => {
        const snippet = `
<Steps>
### Step 1

Description...

### Step 2

Description...
</Steps>
`
        dispatchCommand({ type: 'insert', text: snippet })
    }

    return (
        <div className="flex items-center gap-1 p-2 border-b border-border bg-background sticky top-0 z-10 overflow-x-auto">
            {/* Headings */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Type className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleHeading(1)}><Heading1 className="h-4 w-4 mr-2" /> Heading 1</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleHeading(2)}><Heading2 className="h-4 w-4 mr-2" /> Heading 2</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleHeading(3)}><Heading3 className="h-4 w-4 mr-2" /> Heading 3</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Formatting */}
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleFormat('bold')}>
                    <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleFormat('italic')}>
                    <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleFormat('code')}>
                    <Code className="h-4 w-4" />
                </Button>
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Lists */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleList('bullet')}>
                <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleList('number')}>
                <ListOrdered className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* MDX Components */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2">
                        <Box className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:inline-block">Components</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => insertCallout('info')}>
                        <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                            Info Callout
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => insertCallout('warning')}>
                        <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
                            Warning Callout
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => insertTabs()}>
                        <Layers className="h-4 w-4 mr-2" /> Code Tabs
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => insertSteps()}>
                        <Play className="h-4 w-4 mr-2" /> Steps
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
