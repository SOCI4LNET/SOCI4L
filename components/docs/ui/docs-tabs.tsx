import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DocsTabsProps {
    items: string[]
    defaultValue?: string
    children: React.ReactNode
}

export function DocsTabs({ items, defaultValue, children }: DocsTabsProps) {
    const defaultTab = defaultValue || items[0]

    return (
        <Tabs defaultValue={defaultTab} className="w-full my-4">
            <TabsList className="bg-muted/50 w-full justify-start h-10 p-0 border-b rounded-none bg-transparent">
                {items.map((item) => (
                    <TabsTrigger
                        key={item}
                        value={item}
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none"
                    >
                        {item}
                    </TabsTrigger>
                ))}
            </TabsList>
            {children}
        </Tabs>
    )
}

interface DocsTabProps {
    value: string
    children: React.ReactNode
}

export function DocsTab({ value, children }: DocsTabProps) {
    return (
        <TabsContent value={value} className="mt-4 border rounded-md p-4 bg-muted/30">
            {children}
        </TabsContent>
    )
}
