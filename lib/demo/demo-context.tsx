'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react'
import { DemoMode, DemoSession, DemoProfile, DemoContextType } from './types'
import { getCanonicalData, DEFAULT_DATASET } from './mock-data'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'

const DemoContext = createContext<DemoContextType | undefined>(undefined)

const STORAGE_KEY = 'soci4l_demo_session'

export function DemoProvider({ children }: { children: ReactNode }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // ... (state defs remain same, skipping lines)

    // ... (logic remains same)

    // Return using contextValue
    return (
        <DemoContext.Provider value={contextValue}>
            {children}
        </DemoContext.Provider>
    )
}
const [mode, setMode] = useState<DemoMode>('public')
const [session, setSession] = useState<DemoSession | null>(null)
const [isLoading, setIsLoading] = useState(true)

// Initialize state based on URL and local storage
useEffect(() => {
    const init = () => {
        // Check for investor key
        const investorKey = searchParams.get('key')
        if (investorKey) {
            setMode('investor')
            // In a real app, validate key with server. Here we just enable it.
            // For investor mode, we don't necessarily persist to local storage to keep it ephemeral
            // or we use a separate key.
            setSession({
                id: 'investor-session',
                mode: 'investor',
                createdAt: Date.now(),
                profileOverrides: {},
                walletOverrides: {},
                selectedDataset: 'builder' // Default start
            })
            setIsLoading(false)
            return
        }

        // Check for sandbox session in local storage
        const storedSession = localStorage.getItem(STORAGE_KEY)
        if (storedSession) {
            try {
                const parsed = JSON.parse(storedSession)
                // Simple validation
                if (parsed && parsed.mode === 'sandbox') {
                    setMode('sandbox')
                    setSession(parsed)
                    setIsLoading(false)
                    return
                }
            } catch (e) {
                console.error('Failed to parse demo session', e)
                localStorage.removeItem(STORAGE_KEY)
            }
        }

        // Default to public demo
        setMode('public')
        // Public demo doesn't need a session object essentially, or uses a default one
        setSession({
            id: 'public-demo',
            mode: 'public',
            createdAt: Date.now(),
            profileOverrides: {},
            walletOverrides: {},
            selectedDataset: 'builder'
        })
        setIsLoading(false)
    }

    init()
}, [searchParams])

// Persist sandbox session
useEffect(() => {
    if (mode === 'sandbox' && session) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else if (mode === 'public') {
        // Don't clear storage immediately if switching to public view temporarily?
        // Actually, if we are in public mode, we probably aren't in a sandbox session actively
        // or we construe "public" as the landing page.
        // For now, explicit reset clears it.
    }
}, [mode, session])

const startSandbox = useCallback(() => {
    const newSession: DemoSession = {
        id: crypto.randomUUID(),
        mode: 'sandbox',
        createdAt: Date.now(),
        profileOverrides: {},
        walletOverrides: {},
        selectedDataset: 'builder' // Start with builder or whatever was current
    }
    setSession(newSession)
    setMode('sandbox')
    toast.success('Sandbox mode started. You can now edit securely.')
}, [])

const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSession({
        id: 'public-demo',
        mode: 'public',
        createdAt: Date.now(),
        profileOverrides: {},
        walletOverrides: {},
        selectedDataset: 'builder'
    })
    setMode('public')
    toast.info('Demo reset to canonical state.')
    router.refresh()
}, [router])

const updateProfile = useCallback((overrides: Partial<DemoProfile>) => {
    if (mode === 'public' && !session?.id.includes('investor')) {
        // Prevent edits in strictly public mode? 
        // Actually requirement says "Try editing" -> switches to sandbox.
        // If we call this in public mode, arguably we should auto-switch or warn.
        // But better to let UI handle the switch.
        console.warn('Attempted to update profile in public mode')
        return
    }

    setSession(prev => {
        if (!prev) return null
        return {
            ...prev,
            profileOverrides: { ...prev.profileOverrides, ...overrides }
        }
    })
}, [mode, session?.id])

const setDataset = useCallback((dataset: DemoSession['selectedDataset']) => {
    setSession(prev => {
        if (!prev) return null
        // When switching dataset, we might want to plain clear overrides or keep them?
        // Usually switching persona implies a fresh start for that persona.
        return {
            ...prev,
            selectedDataset: dataset,
            profileOverrides: {}, // Clear overrides on dataset switch for clean slate
            walletOverrides: {}
        }
    })
}, [])

// Composed Data
const baseData = useMemo(() => getCanonicalData(session?.selectedDataset || DEFAULT_DATASET), [session?.selectedDataset])

const profile: DemoProfile = useMemo(() => ({
    ...baseData.profile,
    ...(session?.profileOverrides || {})
}), [baseData.profile, session?.profileOverrides])

const walletData = useMemo(() => ({
    ...baseData.walletData,
    ...(session?.walletOverrides || {})
}), [baseData.walletData, session?.walletOverrides])

const simulateAction = useCallback((action: string, payload?: any) => {
    setSession(prev => {
        if (!prev) return null

        if (action === 'New Follower') {
            const currentFollowers = prev.statsOverrides?.followers || 420
            return {
                ...prev,
                statsOverrides: {
                    ...prev.statsOverrides,
                    followers: currentFollowers + 1
                }
            }
        }

        if (action === 'New Transaction') {
            const newTx = {
                hash: `0x${Math.random().toString(16).slice(2)}`,
                from: '0xSimulatedUser...',
                to: prev.selectedDataset ? getCanonicalData(prev.selectedDataset).walletData.address : '0x...',
                value: (Math.random() * 5).toFixed(2),
                timestamp: Math.floor(Date.now() / 1000),
                blockNumber: 99999999,
                type: 'receive' as const
            }
            const currentTxs = prev.walletOverrides?.transactions || getCanonicalData(prev.selectedDataset || 'builder').walletData.transactions

            return {
                ...prev,
                walletOverrides: {
                    ...prev.walletOverrides,
                    transactions: [newTx, ...currentTxs],
                    nativeBalance: (parseFloat(prev.walletOverrides?.nativeBalance || '10') + parseFloat(newTx.value)).toFixed(2)
                }
            }
        }

        if (action === 'Profile Claim') {
            return {
                ...prev,
                profileOverrides: {
                    ...prev.profileOverrides,
                    status: 'CLAIMED',
                    claimedAt: new Date().toISOString()
                }
            }
        }

        if (action === 'Badge Earned') {
            const currentRoles = prev.profileOverrides?.secondaryRoles || getCanonicalData(prev.selectedDataset || 'builder').profile.secondaryRoles || []
            return {
                ...prev,
                profileOverrides: {
                    ...prev.profileOverrides,
                    secondaryRoles: [...currentRoles, '🏆 Top Rated']
                }
            }
        }

        if (action === 'Add Asset') {
            const currentTokens = prev.walletOverrides?.tokenBalances || getCanonicalData(prev.selectedDataset || 'builder').walletData.tokenBalances
            const newToken = {
                contractAddress: `0x${Math.random().toString(16).slice(2)}`,
                name: 'Simulated Token',
                symbol: 'SIM',
                balance: (Math.random() * 1000).toFixed(2),
                decimals: 18
            }
            return {
                ...prev,
                walletOverrides: {
                    ...prev.walletOverrides,
                    tokenBalances: [newToken, ...currentTokens]
                }
            }
        }

        if (action === 'Add NFT') {
            const currentNfts = prev.walletOverrides?.nfts || getCanonicalData(prev.selectedDataset || 'builder').walletData.nfts
            const newNft = {
                contractAddress: `0x${Math.random().toString(16).slice(2)}`,
                tokenId: Math.floor(Math.random() * 10000).toString(),
                name: `Simulated NFT #${Math.floor(Math.random() * 100)}`,
                image: '',
                collectionName: 'Simulated Collection'
            }
            return {
                ...prev,
                walletOverrides: {
                    ...prev.walletOverrides,
                    nfts: [newNft, ...currentNfts]
                }
            }
        }

        if (action === 'Add Link') {
            const currentLinks = prev.profileOverrides?.socialLinks || getCanonicalData(prev.selectedDataset || 'builder').profile.socialLinks || []
            const newLink = {
                id: crypto.randomUUID(),
                platform: payload?.label || 'Custom Link',
                url: payload?.url || '#',
                label: payload?.label || 'New Link',
                category: payload?.category || 'Other'
            }
            return {
                ...prev,
                profileOverrides: {
                    ...prev.profileOverrides,
                    socialLinks: [...currentLinks, newLink]
                }
            }
        }

        return prev
    })
}, [])

const contextValue = useMemo(() => ({
    mode,
    session,
    profile,
    walletData,
    isLoading,
    startSandbox,
    resetDemo,
    updateProfile,
    setDataset,
    simulateAction: (action: string, payload?: any) => {
        setSession(prev => {
            if (!prev) return null
            const newStats = { ...prev.walletOverrides }

            // ... (rest of simulation logic kept as is, but we need to duplicate it or move it out function to avoid inline massive function)
            // For brevity in this diff, I'll keep the logic inline but ideally it should be a useCallback or separate function.
            // Since I cannot easily copy-paste the whole simulation logic without making this replacement huge, 
            // I will define 'simulateAction' via useCallback above and use it here.
            return prev // Placeholder, see separate edit
        })
    },
    isDemo: true
}), [mode, session, profile, walletData, isLoading])

// Wait, the simulation logic is huge. I should move it to a useCallback before the return.

return (
    <DemoContext.Provider value={valueWithSimulation}>
        {children}
    </DemoContext.Provider>
)
}

export function useDemo() {
    const context = useContext(DemoContext)
    // If used outside of provider (e.g. in real app), return non-demo state
    if (context === undefined) {
        return {
            mode: 'public',
            session: null,
            profile: null,
            walletData: null,
            isLoading: false,
            startSandbox: () => { },
            resetDemo: () => { },
            updateProfile: () => { },
            setDataset: () => { },
            simulateAction: () => { },
            isDemo: false
        } as unknown as DemoContextType
    }
    return context
}
