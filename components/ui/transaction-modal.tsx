'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface TransactionModalProps {
    open: boolean
    title?: string
    description?: string
    className?: string
}

export function TransactionModal({
    open,
    title = 'Waiting for confirmation',
    description = 'Please confirm the transaction in your wallet.',
    className,
}: TransactionModalProps) {
    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent
                hideClose
                className={cn(
                    "sm:max-w-[400px] flex flex-col items-center justify-center p-12 gap-8 border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl",
                    className
                )}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                {/* Premium Pulsing Loader */}
                <div className="relative flex items-center justify-center group">
                    <div className="absolute inset-0 animate-ping rounded-full bg-accent-primary/20 opacity-75" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-accent-primary/10 border border-accent-primary/30 shadow-[0_0_20px_rgba(var(--accent-primary),0.2)]">
                        <Loader2 className="h-10 w-10 animate-spin text-accent-primary" />
                    </div>
                </div>

                <div className="text-center space-y-3">
                    <DialogTitle className="text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground/80 font-medium leading-relaxed">
                        {description}
                    </DialogDescription>
                </div>

                {/* Subtle Progress Hint */}
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden opacity-50">
                    <div className="h-full bg-accent-primary animate-[shimmer_2s_infinite_linear] bg-[length:200%_100%] bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
                </div>
            </DialogContent>
        </Dialog>
    )
}
