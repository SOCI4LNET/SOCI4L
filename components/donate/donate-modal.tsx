'use client'

import { useState } from 'react'
import { formatAddress } from '@/lib/utils'
import confetti from 'canvas-confetti'
import { DonateSuccessCard } from './donate-success-card'

import { Heart, Loader2 } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'


interface DonateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    recipient: {
        address: string
        displayName?: string
        slug?: string
        avatar?: string
    }
    donationAlertVisual?: 'confetti' | 'heart' | 'star' | 'fire'
    onDonate?: (amount: string, message: string) => Promise<void>
}

const QUICK_AMOUNTS = ['0.1', '0.5', '1.0'] as const
const MESSAGE_TEMPLATES = [
    'Keep building! 🚀',
    'Great work! 💪',
    'Love your content ❤️',
    'Amazing! ⭐',
    'Thank you! 🙏',
] as const

const PLATFORM_FEE_PERCENT = 3

export function DonateModal({ open, onOpenChange, recipient, donationAlertVisual = 'confetti', onDonate }: DonateModalProps) {
    const [amount, setAmount] = useState('')
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [successTxHash, setSuccessTxHash] = useState<string | undefined>()
    const [successAmount, setSuccessAmount] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const platformFee = amount ? (parseFloat(amount) * PLATFORM_FEE_PERCENT / 100).toFixed(6) : '0'
    const recipientAmount = amount ? (parseFloat(amount) * (100 - PLATFORM_FEE_PERCENT) / 100).toFixed(6) : '0'

    const handleDonate = async () => {
        if (!amount || parseFloat(amount) < 0.01) {
            return
        }

        setIsLoading(true)
        try {
            await onDonate?.(amount, message)

            // Define custom shapes if needed
            const heart = confetti.shapeFromText({ text: '❤️', scalar: 2 })
            const star = confetti.shapeFromText({ text: '⭐', scalar: 2 })
            const fire = confetti.shapeFromText({ text: '🔥', scalar: 2 })

            // Success confetti animation
            const duration = 3000
            const end = Date.now() + duration

            const frame = () => {
                const colors = donationAlertVisual === 'heart' ? ['#FF0000', '#FF69B4', '#FFB6C1'] :
                    donationAlertVisual === 'star' ? ['#FFD700', '#FFFACD', '#FFFFE0'] :
                        donationAlertVisual === 'fire' ? ['#FF4500', '#FF8C00', '#FFA500'] :
                            ['#2845D6', '#FAFAFA', '#818CF8']

                const shapes = donationAlertVisual === 'heart' ? [heart] :
                    donationAlertVisual === 'star' ? [star] :
                        donationAlertVisual === 'fire' ? [fire] :
                            ['square', 'circle']

                if (donationAlertVisual === 'fire') {
                    // Fire effect: particles moving UP from the bottom
                    confetti({
                        particleCount: 2,
                        angle: 90,
                        spread: 30,
                        origin: { x: Math.random(), y: 0.8 },
                        colors,
                        shapes: [fire] as any,
                        startVelocity: 30,
                        gravity: -0.2, // Moving up
                        ticks: 60
                    })
                } else {
                    confetti({
                        particleCount: 3,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0 },
                        colors,
                        shapes: shapes as any
                    })
                    confetti({
                        particleCount: 3,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1 },
                        colors,
                        shapes: shapes as any
                    })
                }

                if (Date.now() < end) {
                    requestAnimationFrame(frame)
                }
            }
            frame()

            // Show success card after confetti
            setTimeout(() => {
                setSuccessAmount(amount)
                setSuccessMessage(message)
                setShowSuccess(true)
                onOpenChange(false)
                setAmount('')
                setMessage('')
            }, 2000)
        } catch (error) {
            console.error('Donation failed:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold tracking-tight">
                            Send Donation
                        </DialogTitle>
                        <DialogDescription>
                            Support {recipient.displayName || formatAddress(recipient.address)} with AVAX
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Recipient Preview */}
                        <div className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-muted/30">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={recipient.avatar} />
                                <AvatarFallback>
                                    {recipient.displayName?.[0] || formatAddress(recipient.address).slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                    {recipient.displayName || formatAddress(recipient.address)}
                                </p>
                                <p className="text-sm text-muted-foreground font-mono">
                                    {formatAddress(recipient.address)}
                                </p>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-3">
                            <Label htmlFor="amount">Amount (AVAX)</Label>
                            <div className="space-y-2">
                                {/* Quick Select Buttons */}
                                <div className="grid grid-cols-3 gap-2">
                                    {QUICK_AMOUNTS.map((quickAmount) => (
                                        <Button
                                            key={quickAmount}
                                            type="button"
                                            variant={amount === quickAmount ? 'default' : 'outline'}
                                            onClick={() => setAmount(quickAmount)}
                                            className="h-9"
                                        >
                                            {quickAmount}
                                        </Button>
                                    ))}
                                </div>
                                {/* Custom Amount Input */}
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="Custom amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="font-mono"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Minimum: 0.01 AVAX
                                </p>
                            </div>
                        </div>

                        {/* Message Template */}
                        <div className="space-y-3">
                            <Label htmlFor="message">Message (Optional)</Label>
                            <Select value={message || undefined} onValueChange={setMessage}>
                                <SelectTrigger id="message">
                                    <SelectValue placeholder="Select a message or leave empty" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MESSAGE_TEMPLATES.map((template) => (
                                        <SelectItem key={template} value={template}>
                                            {template}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Summary */}
                        {amount && parseFloat(amount) >= 0.01 && (
                            <div className="space-y-2 p-4 rounded-lg border border-border/50 bg-muted/20">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Donation amount</span>
                                    <span className="font-mono">{parseFloat(amount).toFixed(2)} AVAX</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Platform fee (3%)</span>
                                    <span className="font-mono text-muted-foreground">{platformFee} AVAX</span>
                                </div>
                                <div className="h-px bg-border my-2" />
                                <div className="flex justify-between font-medium">
                                    <span>Recipient receives</span>
                                    <span className="font-mono">{recipientAmount} AVAX</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDonate}
                            className="flex-1"
                            disabled={!amount || parseFloat(amount) < 0.01 || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Heart className="mr-2 h-4 w-4" />
                                    Donate {amount ? parseFloat(amount).toFixed(2) : ''} AVAX
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success Card */}
            <DonateSuccessCard
                open={showSuccess}
                onOpenChange={(open) => {
                    setShowSuccess(open)
                    if (!open) {
                        setSuccessAmount('')
                        setSuccessMessage('')
                        setSuccessTxHash(undefined)
                    }
                }}
                recipient={recipient}
                amount={successAmount}
                message={successMessage}
                txHash={successTxHash}
            />
        </>
    )
}
