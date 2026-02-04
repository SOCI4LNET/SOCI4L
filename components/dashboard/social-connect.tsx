'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { XIcon } from '@/components/icons/x-icon'
import { toast } from 'sonner'
import { Loader2, CheckCircle, ExternalLink } from 'lucide-react'

export function SocialConnect() {
    const { user, linkTwitter, unlinkTwitter, connectWallet } = usePrivy()
    const [isLinking, setIsLinking] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)

    const twitterAccount = user?.twitter

    const handleLinkTwitter = async () => {
        try {
            setIsLinking(true)
            await linkTwitter()
            // Post-link logic handled by useEffect when user object updates
        } catch (error) {
            console.error('Failed to link Twitter:', error)
            toast.error('Failed to connect Twitter account')
        } finally {
            setIsLinking(false)
        }
    }

    const handleUnlinkTwitter = async () => {
        if (!twitterAccount?.subject) return

        try {
            setIsLinking(true)
            await unlinkTwitter(twitterAccount.subject)
            toast.success('Twitter account disconnected')
            // You should also call backend to remove the link from your DB here if needed
            // await deleteSocialConnection('twitter')
        } catch (error) {
            console.error('Failed to unlink Twitter:', error)
            toast.error('Failed to disconnect Twitter account')
        } finally {
            setIsLinking(false)
        }
    }

    // Sync with backend when Twitter account is detected
    useEffect(() => {
        const syncSocial = async () => {
            if (twitterAccount && !isSyncing) {
                // Prevent double sync if already verified recently (can add timestamp check)
                const lastSync = localStorage.getItem(`soci4l_twitter_sync_${twitterAccount.username}`)
                const now = Date.now()

                // Don't re-sync if synced in last 1 minute
                if (lastSync && now - parseInt(lastSync) < 60000) return

                try {
                    setIsSyncing(true)
                    const response = await fetch('/api/social/link', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            platform: 'twitter',
                            platformUsername: twitterAccount.username,
                            platformUserId: twitterAccount.subject, // Privy uses 'subject' as ID
                            // In a real production app, you should send the Privy auth token 
                            // and verify it on server side via VerifyAuthToken
                        }),
                    })

                    if (response.ok) {
                        toast.success(`Connected as @${twitterAccount.username}`)
                        localStorage.setItem(`soci4l_twitter_sync_${twitterAccount.username}`, now.toString())
                    } else {
                        console.error('Backend sync failed')
                    }
                } catch (error) {
                    console.error('Sync error:', error)
                } finally {
                    setIsSyncing(false)
                }
            }
        }

        if (twitterAccount) {
            syncSocial()
        }
    }, [twitterAccount])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Social Connections</CardTitle>
                <CardDescription>
                    Connect existing social profiles to verify your identity and unlock features.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-black text-white rounded-full">
                            <XIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">X (Twitter)</p>
                            {twitterAccount ? (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="text-green-500 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Verified
                                    </span>
                                    <span>•</span>
                                    <span>@{twitterAccount.username}</span>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">Not connected</p>
                            )}
                        </div>
                    </div>

                    <div>
                        {twitterAccount ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleUnlinkTwitter}
                                disabled={isLinking}
                                className="text-xs h-8"
                            >
                                {isLinking ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                Disconnect
                            </Button>
                        ) : (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleLinkTwitter}
                                disabled={isLinking}
                                className="text-xs h-8 bg-black hover:bg-black/90 text-white"
                            >
                                {isLinking ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                Connect X
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
