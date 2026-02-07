'use client'

import { useState, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { WalletConnectButtons } from '@/components/wallet-connect-buttons'
import { useTransaction } from '@/components/providers/transaction-provider'

interface ClaimProfileButtonProps {
  address: string
  onSuccess?: (profile?: { status: string; claimedAt: string | Date | null; slug: string | null; displayName: string | null }) => void
}

export function ClaimProfileButton({ address, onSuccess }: ClaimProfileButtonProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isClaimed, setIsClaimed] = useState(false)
  const { address: connectedAddress, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { showTransactionLoader, hideTransactionLoader } = useTransaction()

  useEffect(() => {
    setMounted(true)
    // Check if we just claimed (handled by onSuccess/parent usually, but good for local state)
  }, [])

  const handleClaim = async () => {
    if (!isConnected || !connectedAddress) {
      return
    }

    if (connectedAddress.toLowerCase() !== address.toLowerCase()) {
      return
    }

    // Prevent multiple clicks if already claimed (basic check)
    if (isClaimed) return

    try {
      showTransactionLoader("Waiting for signature...")

      // Step 1: Get nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce')
      }
      const { nonce } = await nonceResponse.json()

      // Step 2: Sign message
      const message = `Claim SOCI4L profile for ${address}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      showTransactionLoader("Claiming profile...")

      // Step 3: Claim profile
      const normalizedAddress = connectedAddress.toLowerCase()
      const claimResponse = await fetch('/api/profile/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: normalizedAddress,
          signature,
        }),
      })

      const result = await claimResponse.json()

      if (!claimResponse.ok) {
        throw new Error(result.error || 'Failed to claim profile')
      }

      // Success
      setIsClaimed(true)
      if (result.alreadyClaimed) {
        toast.success('Profile already claimed')
      } else {
        toast.success('Profile claimed successfully!')
      }

      router.refresh()

      if (onSuccess) {
        onSuccess(result.profile ? {
          status: result.profile.status,
          claimedAt: result.profile.claimedAt,
          slug: result.profile.slug,
          displayName: null,
        } : undefined)
      } else {
        router.replace(`/dashboard/${normalizedAddress}`)
      }
    } catch (error: any) {
      console.error('Error claiming profile:', error)
      // Only show error if it's not a user rejection (usually matches "User rejected" or "User denied")
      if (error?.message?.includes('User rejected') || error?.name === 'UserRejectedRequestError') {
        toast.error('Transaction rejected')
      } else {
        toast.error('Failed to claim profile. Please try again.')
      }
    } finally {
      hideTransactionLoader()
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="default" size="sm" disabled>
        Claim Profile
      </Button>
    )
  }

  if (!isConnected) {
    return (
      <WalletConnectButtons
        variant="default"
        size="sm"
        className="w-full"
      />
    )
  }

  if (connectedAddress?.toLowerCase() !== address.toLowerCase()) {
    return null
  }

  if (isClaimed) {
    return (
      <Badge variant="default" className="px-4 py-2">
        Claimed
      </Badge>
    )
  }

  return (
    <Button
      onClick={handleClaim}
      variant="default"
      size="sm"
    >
      Claim Profile
    </Button>
  )
}
