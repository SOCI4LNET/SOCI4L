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
                className={cn("sm:max-w-[425px] flex flex-col items-center justify-center p-10 gap-6", className)}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-accent-primary/10">
                    <Loader2 className="h-10 w-10 animate-spin text-accent-primary" />
                </div>

                <div className="text-center space-y-2">
                    <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground">
                        {description}
                    </DialogDescription>
                </div>
            </DialogContent>
        </Dialog>
    )
}
