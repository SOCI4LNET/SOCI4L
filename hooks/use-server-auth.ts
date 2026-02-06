import { useAccount, useSignMessage } from 'wagmi'
import { useTransaction } from '@/components/providers/transaction-provider'
import { toast } from 'sonner'
import { useState } from 'react'

interface UseServerAuthReturn {
    ensureSession: () => Promise<boolean>
}

export function useServerAuth(): UseServerAuthReturn {
    const { address: connectedAddress, isConnected } = useAccount()
    const { signMessageAsync } = useSignMessage()
    const { showTransactionLoader, hideTransactionLoader } = useTransaction()

    const ensureSession = async (): Promise<boolean> => {
        if (!isConnected || !connectedAddress) {
            return false
        }

        try {
            // Step 1: Check if we have a valid session by trying to get a nonce (lite check)
            // Or better, checking verify endpoint directly? No, verify is POST.
            // We can try to hit a protected endpoint or just 'follow-status' as a probe, 
            // but a clean way is to just call nonce. If we have a session, nonce might not be needed?
            // Actually, the most reliable way the original code used was:
            // Try a protected action (or probe), if 401, then do the dance.
            // Let's implement the FULL dance here assuming we suspect we need it.
            // But we shouldn't force signature if valid.
            // Let's try to fetch a lightweight protected endpoint to check status.
            // For now, let's replicate the logic: Check ONE protected endpoint.
            // We can use a dedicated /api/auth/session-status endpoint if it existed, 
            // but since it doesn't, let's probe /api/auth/nonce. 
            // Wait, nonce is public.

            // Let's look at how FollowToggle did it:
            // It called /api/profile/.../follow-status. If 401 -> authenticate.
            // We can make this generic.

            // Probe: Check if we can access a simple protected resource or just rely on the caller to know they got a 401?
            // Better: The hook provides `ensureSession` which performs the check first.

            // Let's probe /api/me/blocked as it's the one failing for the user.
            // Or just /api/auth/nonce? No.
            // Let's probe /api/profile/[address]/score or similar light endpoint.
            // Actually, let's probe /api/auth/verify (GET) if it exists? No.

            // Probe: Check if we have a valid session
            const probe = await fetch('/api/auth/session', {
                cache: 'no-store',
                credentials: 'include'
            })

            if (probe.status === 200) {
                // Double check it matches connected address if needed? 
                // But mostly we just care if ANY session exists that the server trusts.
                return true
            }

            // If not 200, start authentication flow
            const normalizedAddress = connectedAddress.toLowerCase()

            // 1. Get Nonce
            const nonceResponse = await fetch('/api/auth/nonce', {
                credentials: 'include',
            })
            if (!nonceResponse.ok) {
                toast.error('Connection failed. Please try again.')
                return false
            }
            const { nonce } = await nonceResponse.json()

            // 2. Sign Message
            const message = `Follow auth for SOCI4L. Address: ${normalizedAddress}. Nonce: ${nonce}`

            showTransactionLoader("Confirm in Wallet...")
            const signature = await signMessageAsync({ message })
            showTransactionLoader("Creating session...")

            // 3. Verify & Create Session
            const verifyResponse = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ address: connectedAddress, signature }),
            })

            if (!verifyResponse.ok) {
                toast.error('Failed to create session. Please try again.')
                return false
            }

            // 4. Wait for cookie propagation (Serverless consistency)
            // Retry verification loop
            for (let attempt = 0; attempt < 3; attempt++) {
                await new Promise(resolve => setTimeout(resolve, 200 + (attempt * 100)))

                const verifyProbe = await fetch('/api/auth/session', {
                    cache: 'no-store',
                    credentials: 'include',
                })

                if (verifyProbe.status === 200) {
                    hideTransactionLoader()
                    return true
                }
            }

            console.error('Session creation verification failed after retries')
            toast.error('Session created but verification failed. Please try again.')
            return false

        } catch (error: any) {
            console.error('Error ensuring session:', error)
            if (error?.message?.includes('User rejected') || error?.name === 'UserRejectedRequestError') {
                toast.error('Signature request rejected')
            } else {
                toast.error('Session verification failed. Please try again.')
            }
            return false
        } finally {
            hideTransactionLoader()
        }
    }

    return { ensureSession }
}
