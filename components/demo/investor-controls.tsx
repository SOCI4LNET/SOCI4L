'use client'

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDemo } from '@/lib/demo/demo-context'

import { RefreshCcw, Users, Wand2, Plus, Link as LinkIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


export function InvestorControls() {
    const { session, setDataset, resetDemo, simulateAction } = useDemo()
    const router = useRouter()
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
    const [newLink, setNewLink] = useState({ category: 'Social', label: '', url: '' })

    const currentDataset = session?.selectedDataset || 'builder'

    const handleDatasetChange = (val: string) => {
        setDataset(val as any)
        toast.success(`Switched to ${val} persona`)
    }

    const handleSimulateAction = (action: string, payload?: any) => {
        simulateAction(action, payload)
        toast.success(`Simulated: ${action}`)
    }

    const handleAddLink = () => {
        handleSimulateAction('Add Link', newLink)
        setIsLinkDialogOpen(false)
        setNewLink({ category: 'Social', label: '', url: '' })
    }

    return (
        <Card className="fixed bottom-4 right-4 w-80 shadow-2xl border-primary/20 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 z-50 animate-in slide-in-from-bottom-5 max-h-[80vh] overflow-y-auto">
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
                            onClick={() => handleSimulateAction('Add Asset')}
                        >
                            Add Asset
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleSimulateAction('Add NFT')}
                        >
                            Add NFT
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

                    <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" size="sm" className="w-full h-8 text-xs mt-2">
                                <Plus className="h-3 w-3 mr-1" /> Add Custom Link
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Profile Link</DialogTitle>
                                <DialogDescription>
                                    Add a new link to the demo profile.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={newLink.category}
                                        onValueChange={(v) => setNewLink({ ...newLink, category: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Social">Social</SelectItem>
                                            <SelectItem value="Portfolio">Portfolio</SelectItem>
                                            <SelectItem value="Contact">Contact</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Label</Label>
                                    <Input
                                        placeholder="e.g. My Portfolio"
                                        value={newLink.label}
                                        onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>URL</Label>
                                    <Input
                                        placeholder="https://..."
                                        value={newLink.url}
                                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddLink}>Add Link</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
