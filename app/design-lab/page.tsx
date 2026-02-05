import { PageShell } from '@/components/app-shell/page-shell'
import { Badge } from '@/components/ui/badge'
import { IdentityHolocard } from '@/components/showcase/identity-holocard'
import { SocialGraphOrb } from '@/components/showcase/social-graph-orb'
import { AnalyticsPulse } from '@/components/showcase/analytics-pulse'
import { WalletScanner } from '@/components/showcase/wallet-scanner'
import { DegenMatrix } from '@/components/showcase/degen-matrix'

export default function DesignLabPage() {
    return (
        <PageShell
            title="Design Lab"
            subtitle="A private showcase of premium interactive components."
            mode="constrained"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                {/* Component 1: Identity Holocard */}
                <div className="col-span-1 min-h-[400px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">01. Identity Holocard</h3>
                        <Badge variant="outline">Profile</Badge>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-muted/10 relative overflow-hidden group">
                        <IdentityHolocard />
                    </div>
                </div>

                {/* Component 2: Social Graph Orb */}
                <div className="col-span-1 min-h-[400px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">02. Social Graph Orb</h3>
                        <Badge variant="outline">Network</Badge>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-muted/10 relative overflow-hidden">
                        <SocialGraphOrb />
                    </div>
                </div>

                {/* Component 3: Analytics Pulse */}
                <div className="col-span-1 min-h-[400px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">03. Analytics Pulse</h3>
                        <Badge variant="outline">Data</Badge>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-muted/10 relative overflow-hidden">
                        <AnalyticsPulse />
                    </div>
                </div>

                {/* Component 4: Wallet Scanner */}
                <div className="col-span-1 min-h-[400px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">04. Wallet Scanner</h3>
                        <Badge variant="outline">Verification</Badge>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-muted/10 relative overflow-hidden">
                        <WalletScanner />
                    </div>
                </div>

                {/* Component 5: Degen Matrix */}
                <div className="col-span-1 md:col-span-2 min-h-[400px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">05. Degen Matrix</h3>
                        <Badge variant="outline">Theme: Degen</Badge>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-black relative overflow-hidden">
                        <DegenMatrix />
                    </div>
                </div>

            </div>
        </PageShell>
    )
}
