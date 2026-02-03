'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReactElement, useState, Children, isValidElement } from 'react'

interface CodeGroupProps {
    children: ReactElement[] | ReactElement
}

export function CodeGroup({ children }: CodeGroupProps) {
    // Extract titles from children CodeBlocks
    const items = Children.toArray(children).filter(isValidElement) as ReactElement[]
    const [value, setValue] = useState((items[0]?.props as any)?.title || '')

    return (
        <Tabs defaultValue={value} onValueChange={setValue} className="w-full my-6">
            <TabsList className="w-full justify-start rounded-b-none border-b bg-muted/40 p-0">
                {items.map((item: any) => (
                    <TabsTrigger
                        key={item.props.title}
                        value={item.props.title}
                        className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                    >
                        {item.props.title}
                    </TabsTrigger>
                ))}
            </TabsList>
            {items.map((item: any) => (
                <TabsContent key={item.props.title} value={item.props.title} className="mt-0 rounded-b-lg border border-t-0 bg-muted/10 px-4 py-2">
                    {/* Render the children of CodeBlock, which is usually a <pre> or <code> */}
                    {item.props.children}
                </TabsContent>
            ))}
        </Tabs>
    )
}
