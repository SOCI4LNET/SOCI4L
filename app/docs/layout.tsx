import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import SiteFooter from '@/components/app-shell/site-footer'
import { DocsSidebar } from '@/components/docs/docs-sidebar'
import { DocsTOC } from '@/components/docs/docs-toc'
import { DocsHeader } from '@/components/docs/docs-header'
import { prisma } from '@/lib/prisma'

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
    // Fetch articles on the server
    const articles = await prisma.docsArticle.findMany({
        where: { published: true },
        select: {
            title: true,
            slug: true,
            category: true,
        },
        orderBy: [
            { category: 'asc' },
            { title: 'asc' }
        ]
    })

    return (
        <SidebarProvider defaultOpen={true}>
            <DocsSidebar articles={articles} />

            <SidebarInset className="flex w-full flex-col">
                <DocsHeader />

                <div className="flex-1 overflow-y-auto">
                    <div className="container max-w-screen-2xl mx-auto">
                        <main className="relative py-6 lg:gap-10 lg:py-10 xl:grid xl:grid-cols-[1fr_250px] w-full px-4 md:px-8">
                            <div className="mx-auto w-full min-w-0 max-w-3xl">
                                {children}
                            </div>

                            {/* Table of Contents Column */}
                            <div className="hidden text-sm xl:block pl-6">
                                <div className="sticky top-6 h-[calc(100vh-7rem)] overflow-y-auto">
                                    <DocsTOC />
                                    <div className="mt-10 pt-6 border-t border-border/40">
                                        <p className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">Community</p>
                                        <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
                                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_0_rgba(34,197,94,0.5)]"></span>
                                            Systems Normal
                                        </a>
                                        <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                            Join Discord
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
                <SiteFooter className="mt-auto" />
            </SidebarInset>
        </SidebarProvider>
    )
}
