'use client'

import * as React from 'react'
import { TransactionModal } from '@/components/ui/transaction-modal'

interface TransactionContextType {
    isLoading: boolean
    message: string
    showTransactionLoader: (message?: string) => void
    hideTransactionLoader: () => void
}

const TransactionContext = React.createContext<TransactionContextType | undefined>(undefined)

export function TransactionProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [message, setMessage] = React.useState('Please confirm the transaction in your wallet.')

    const showTransactionLoader = React.useCallback((msg?: string) => {
        if (msg) setMessage(msg)
        setIsLoading(true)
    }, [])

    const hideTransactionLoader = React.useCallback(() => {
        setIsLoading(false)
        // Reset message after a delay to ensure smooth transition if reopened immediately
        setTimeout(() => setMessage('Please confirm the transaction in your wallet.'), 300)
    }, [])

    return (
        <TransactionContext.Provider value={{ isLoading, message, showTransactionLoader, hideTransactionLoader }}>
            {children}
            <TransactionModal
                open={isLoading}
                description={message}
            />
        </TransactionContext.Provider>
    )
}

export function useTransaction() {
    const context = React.useContext(TransactionContext)
    if (context === undefined) {
        throw new Error('useTransaction must be used within a TransactionProvider')
    }
    return context
}
