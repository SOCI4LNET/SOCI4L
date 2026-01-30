'use client'

import { useDemo } from '@/lib/demo/demo-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCcw, Users, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function InvestorControls() {
    const { session, setDataset, resetDemo } = useDemo()
    const router = useRouter()

    const currentDataset = session?.selectedDataset || 'builder'

    const handleDatasetChange = (val: string) => {
        setDataset(val as any)
        toast.success(`Switched to ${val} persona`)
    }

    const handleSimulateAction = (action: string) => {
        toast.info(`Simulated: ${action}`)
        // In a real demo, this might trigger a specific state change or animation
    }

    return (
        <Card className="fixed bottom-4 right-4 w-80 shadow-2xl border-primary/20 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 z-50 animate-in slide-in-from-bottom-5">
            <CardHeader className="py-3 px-4 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-primary" />
                        Investor Controls
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono">
                        EVAL-MODE
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Active Persona
                    </label>
                    <Select value={currentDataset} onValueChange={handleDatasetChange}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="builder">Builder (Dev Focused)</SelectItem>
                            <SelectItem value="creator">Creator (NFT/Art)</SelectItem>
                            <SelectItem value="collector">Collector (Whale)</SelectItem>
                            <SelectItem value="trader">Trader (DeFi)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium">Simulate Events</label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleSimulateAction('New Follower')}
                        >
                            + Follower
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleSimulateAction('New Transaction')}
                        >
                            Tx Incoming
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleSimulateAction('Profile Claim')}
                        >
                            Claim Logic
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleSimulateAction('Badge Earned')}
                        >
                            Earn Badge
                        </Button>
                    </div>
                </div>

                <div className="pt-2 border-t">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs h-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                            resetDemo()
                            router.push('/demo')
                        }}
                    >
                        <RefreshCcw className="h-3 w-3 mr-2" />
                        Reset & Exit Investor Mode
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
