import SiteFooter from "@/components/app-shell/site-footer"

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
            <SiteFooter className="mt-auto" />
        </div>
    )
}
