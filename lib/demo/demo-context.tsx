'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { DemoMode, DemoSession, DemoProfile, DemoContextType } from './types'
import { getCanonicalData, DEFAULT_DATASET } from './mock-data'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'

const DemoContext = createContext<DemoContextType | undefined>(undefined)

const STORAGE_KEY = 'soci4l_demo_session'

export function DemoProvider({ children }: { children: ReactNode }) {
    const router = useRouter()
    const searchParams = useSearchParams()
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

    const startSandbox = () => {
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
    }

    const resetDemo = () => {
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
    }

    const updateProfile = (overrides: Partial<DemoProfile>) => {
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
    }

    const setDataset = (dataset: DemoSession['selectedDataset']) => {
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
    }

    // Composed Data
    const baseData = getCanonicalData(session?.selectedDataset || DEFAULT_DATASET)

    const profile: DemoProfile = {
        ...baseData.profile,
        ...(session?.profileOverrides || {})
    }

    const walletData = {
        ...baseData.walletData,
        ...(session?.walletOverrides || {})
    }

    return (
        <DemoContext.Provider value={{
            mode,
            session,
            profile,
            walletData,
            isLoading,
            startSandbox,
            resetDemo,
            updateProfile,
            setDataset,
            isDemo: true
        }}>
            {children}
        </DemoContext.Provider>
    )
}

export function useDemo() {
    const context = useContext(DemoContext)
    if (context === undefined) {
        throw new Error('useDemo must be used within a DemoProvider')
    }
    return context
}
