import { DocsSidebar } from "@/components/docs/docs-sidebar"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider className="h-screen w-full overflow-hidden">
            <DocsSidebar />
            <SidebarInset className="h-full flex flex-col overflow-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background z-10">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="font-semibold">Documentation</div>
                    <div className="ml-auto relative w-full max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search documentation..." className="pl-8 h-9 w-full md:w-[300px]" />
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto space-y-4 p-8 pt-6">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
