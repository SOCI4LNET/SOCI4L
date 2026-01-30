import { PageShell } from "@/components/app-shell/page-shell"
import { BlockedUsersList, MutedUsersList } from "@/components/dashboard/safety/blocked-users-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SafetyPage() {
    return (
        <PageShell title="Safety & Privacy" subtitle="Manage your blocked and muted users.">
            <Tabs defaultValue="blocked" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="blocked">Blocked Accounts</TabsTrigger>
                    <TabsTrigger value="muted">Muted Accounts</TabsTrigger>
                </TabsList>
                <TabsContent value="blocked" className="mt-6">
                    <BlockedUsersList />
                </TabsContent>
                <TabsContent value="muted" className="mt-6">
                    <MutedUsersList />
                </TabsContent>
            </Tabs>
        </PageShell>
    )
}
