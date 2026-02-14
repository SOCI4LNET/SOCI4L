'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { formatAddress } from '@/lib/utils'
import { Download, Share2, X } from 'lucide-react'
import confetti from 'canvas-confetti'
import Image from 'next/image'

interface DonateSuccessCardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    recipient: {
        displayName?: string
        avatar?: string
        address: string
    }
    amount: string
    message?: string
    txHash?: string
}

export function DonateSuccessCard({
    open,
    onOpenChange,
    recipient,
    amount,
    message,
    txHash
}: DonateSuccessCardProps) {
    const [isGenerating, setIsGenerating] = useState(false)

    const downloadAsPNG = async () => {
        setIsGenerating(true)
        try {
            // Dynamic import to avoid SSR issues
            const { toPng } = await import('html-to-image')
            const element = document.getElementById('donate-success-card')
            if (!element) return

            const dataUrl = await toPng(element, {
                quality: 1,
                pixelRatio: 2,
            })

            const link = document.createElement('a')
            link.download = `soci4l-donation-${Date.now()}.png`
            link.href = dataUrl
            link.click()
        } catch (error) {
            console.error('Failed to generate PNG:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const shareOnTwitter = () => {
        const recipientName = recipient.displayName || formatAddress(recipient.address)
        const tweetText = `I just donated ${parseFloat(amount).toFixed(2)} AVAX to ${recipientName} on @SOCI4L_NET! 🎉\n\nSupporting amazing creators on Avalanche. 🔺\n\n${txHash ? `https://snowtrace.io/tx/${txHash}` : 'https://soci4l.net'}`

        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
        window.open(twitterUrl, '_blank', 'noopener,noreferrer')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                <div className="relative px-6 pt-8 pb-6">
                    {/* Close button */}
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>

                    {/* Success Card */}
                    <div id="donate-success-card" className="space-y-6">
                        {/* Background Image Card */}
                        <Card className="relative overflow-hidden border-2 border-brand-500/20">
                            <CardContent className="p-0">
                                <div className="relative h-64 w-full">
                                    <Image
                                        src="/og-background.png"
                                        alt="Donation background"
                                        fill
                                        className="object-cover rounded-md"
                                        style={{ borderRadius: '6px' }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent" />

                                    {/* Content Overlay */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                        <Avatar className="h-16 w-16 mb-4 ring-2 ring-brand-500/50">
                                            <AvatarImage src={recipient.avatar} />
                                            <AvatarFallback>
                                                {recipient.displayName?.[0] || formatAddress(recipient.address).slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
                                            {parseFloat(amount).toFixed(2)} AVAX
                                        </h3>

                                        <p className="text-base text-muted-foreground mb-1">
                                            Donated to
                                        </p>

                                        <p className="text-xl font-semibold">
                                            {recipient.displayName || formatAddress(recipient.address)}
                                        </p>

                                        {message && (
                                            <p className="text-sm text-muted-foreground mt-3 italic max-w-xs">
                                                "{message}"
                                            </p>
                                        )}

                                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="px-2 py-1 rounded-full bg-brand-500/10 text-brand-500">
                                                SOCI4L.NET
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Success Message */}
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Donation Sent! 🎉</h2>
                            <p className="text-sm text-muted-foreground">
                                Your donation has been successfully sent on Avalanche C-Chain
                            </p>
                            {txHash && (
                                <a
                                    href={`https://snowtrace.io/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-brand-500 hover:underline inline-block mt-1"
                                >
                                    View on Snowtrace →
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={downloadAsPNG}
                            disabled={isGenerating}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            {isGenerating ? 'Generating...' : 'Download PNG'}
                        </Button>
                        <Button
                            onClick={shareOnTwitter}
                            className="gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
                        >
                            <Share2 className="h-4 w-4" />
                            Share on X
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
