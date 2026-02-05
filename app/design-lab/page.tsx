import { PageShell } from '@/components/app-shell/page-shell'
import { Badge } from '@/components/ui/badge'
import { IdentityHolocard } from '@/components/showcase/identity-holocard'
import { SocialConstellation } from '@/components/showcase/social-constellation'
import { AnalyticsPulse } from '@/components/showcase/analytics-pulse'
import { WalletScanner } from '@/components/showcase/wallet-scanner'
import { DegenMatrix } from '@/components/showcase/degen-matrix'
import { LinkIntelligenceNode } from '@/components/showcase/link-intelligence-node'
import { OnChainReputationMeter } from '@/components/showcase/on-chain-reputation-meter'
import { SmartContractVerdict } from '@/components/showcase/smart-contract-verdict'
import { AssetPortfolioPrism } from '@/components/showcase/asset-portfolio-prism'
import { QuantumCodeScanner } from '@/components/showcase/quantum-code-scanner'
import { DidVault } from '@/components/showcase/did-vault'
import { SocialEchoRadar } from '@/components/showcase/social-echo-radar'
import { GlobalNetworkMap } from '@/components/showcase/global-network-map'

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

                {/* Component 2: Social Constellation */}
                <div className="col-span-1 min-h-[400px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">02. Social Constellation</h3>
                        <Badge variant="outline">Network</Badge>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-muted/10 relative overflow-hidden">
                        <SocialConstellation />
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
                <div className="col-span-1 min-h-[400px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">05. Degen Matrix</h3>
                        <Badge variant="outline">Theme: Degen</Badge>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-black relative overflow-hidden">
                        <DegenMatrix />
                    </div>
                </div>

                {/* Component 6: Link Intelligence Node */}
                <div className="col-span-1 min-h-[400px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">06. Link Intelligence</h3>
                        <Badge variant="outline">Connectivity</Badge>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-muted/10 relative overflow-hidden">
                        <LinkIntelligenceNode />
                    </div>
                </div>

                {/* Component 7: On-Chain Reputation Meter */}
                <div className="col-span-1 min-h-[400px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">07. Reputation Meter</h3>
                        <Badge variant="outline">Scoring</Badge>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-muted/10 relative overflow-hidden">
                        <OnChainReputationMeter />
                    </div>
                </div>

                {/* Component 8: Smart Contract Verdict */}
                <div className="col-span-1 min-h-[400px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">08. Contract Verdict</h3>
                        <Badge variant="outline">Security</Badge>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-muted/10 relative overflow-hidden">
                        <SmartContractVerdict />
                    </div>
                </div>

                {/* Component 9: Asset Portfolio Prism */}
                <div className="col-span-1 min-h-[400px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">09. Asset Prism</h3>
                        <Badge variant="outline">Assets</Badge>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-muted/10 relative overflow-hidden">
                        <AssetPortfolioPrism />
                    </div>
                </div>

                {/* Component 10: Quantum Code Scanner */}
                <div className="col-span-1 min-h-[400px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">10. Quantum QR</h3>
                        <Badge variant="outline">Sharing</Badge>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-muted/10 relative overflow-hidden">
                        <QuantumCodeScanner />
                    </div>
                </div>

                {/* Component 11: DID Vault */}
                <div className="col-span-1 min-h-[400px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">11. DID Vault</h3>
                        <Badge variant="outline">Privacy</Badge>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-muted/10 relative overflow-hidden">
                        <DidVault />
                    </div>
                </div>

                {/* Component 12: Social Echo Radar */}
                <div className="col-span-1 min-h-[400px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">12. Echo Radar</h3>
                        <Badge variant="outline">Discovery</Badge>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-muted/10 relative overflow-hidden">
                        <SocialEchoRadar />
                    </div>
                </div>

                {/* Component 13: Global Network Map */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 min-h-[500px] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">13. Global Network Map</h3>
                        <Badge variant="outline">Ecosystem</Badge>
                    </div>
                    <div className="flex-1 rounded-xl border border-dashed border-border p-6 flex items-center justify-center bg-black relative overflow-hidden">
                        <GlobalNetworkMap />
                    </div>
                </div>

            </div>
        </PageShell>
    )
}
