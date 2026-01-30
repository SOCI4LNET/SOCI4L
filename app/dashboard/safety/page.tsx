"use client"

import { BlockedUsersList, MutedUsersList } from "@/components/dashboard/safety/blocked-users-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SafetyPage() {
    return (
        <div className="container max-w-4xl py-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Safety & Privacy</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your blocked accounts and muted users.
                </p>
            </div>

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
        </div>
    )
}
