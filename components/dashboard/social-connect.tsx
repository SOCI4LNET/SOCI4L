'use client'

import { useAccount } from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { XIcon } from '@/components/icons/x-icon'
import { toast } from 'sonner'
import { Loader2, CheckCircle, ExternalLink } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function SocialConnect() {
    const { user, linkTwitter, unlinkTwitter, linkWallet, authenticated, ready } = usePrivy()
    const { address: connectedAddress } = useAccount()
    const [isLinking, setIsLinking] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)

    const twitterAccount = user?.twitter

    const handleLinkTwitter = async () => {
        try {
            setIsLinking(true)
            await linkTwitter()
            // Post-link logic handled by useEffect when user object updates
        } catch (error: any) {
            console.error('Failed to link Twitter:', error)
            toast.error(error?.message || 'Failed to connect Twitter account')
        } finally {
            setIsLinking(false)
        }
    }

    const performDbUnlink = async () => {
        const walletAddress = user?.wallet?.address || connectedAddress
        if (walletAddress) {
            const response = await fetch(`/api/social/link?platform=twitter&walletAddress=${walletAddress}`, {
                method: 'DELETE'
            })
            if (!response.ok) {
                console.warn('Backend social unlink failed, but Privy unlink succeeded')
            }
        }
    }

    const handleUnlinkTwitter = async () => {
        if (!twitterAccount?.subject) {
            toast.error('No Twitter account found to disconnect')
            return
        }

        try {
            setIsLinking(true)

            // 1. Unlink from Privy
            await unlinkTwitter(twitterAccount.subject)

            // 2. Remove from our database
            await performDbUnlink()

            toast.success('Twitter account disconnected')
        } catch (error: any) {
            console.error('Failed to unlink Twitter:', error)

            // Handle "Last Account" Error
            if (error?.message?.toLowerCase().includes('only one account') || error?.message?.toLowerCase().includes('last linked account')) {
                toast.info('To disconnect your last account, you must verify your wallet.', {
                    duration: 5000
                })

                try {
                    // Force link wallet first
                    await linkWallet()

                    // Retry unlink after successful link
                    await unlinkTwitter(twitterAccount.subject)
                    await performDbUnlink()

                    toast.success('Twitter account disconnected')
                    return
                } catch (linkError: any) {
                    console.error('Failed to fallback link wallet:', linkError)
                    // If user cancelled or failed linking, we stop here
                    return
                }
            }

            // Check if it's already unlinked in Privy but still in our DB
            if (error?.message?.includes('not linked') || error?.message?.includes('not found')) {
                const walletAddress = user?.wallet?.address || connectedAddress
                if (walletAddress) {
                    await fetch(`/api/social/link?platform=twitter&walletAddress=${walletAddress}`, {
                        method: 'DELETE'
                    })
                    toast.success('Connection removed from profile')
                    return
                }
            }
            toast.error(error?.message || 'Failed to disconnect Twitter account')
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

    if (!ready) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Social Connections</CardTitle>
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        )
    }

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
