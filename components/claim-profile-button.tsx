'use client'

import { useState, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { WalletConnectButtons } from '@/components/wallet-connect-buttons'

interface ClaimProfileButtonProps {
  address: string
  onSuccess?: (profile?: { status: string; claimedAt: string | Date | null; slug: string | null; displayName: string | null }) => void
}

export function ClaimProfileButton({ address, onSuccess }: ClaimProfileButtonProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClaimed, setIsClaimed] = useState(false)
  const { address: connectedAddress, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleClaim = async () => {
    if (!isConnected || !connectedAddress) {
      // Connection will be handled by WalletConnectButtons component
      return
    }

    if (connectedAddress.toLowerCase() !== address.toLowerCase()) {
      return // Alert will be shown below
    }

    // Prevent multiple clicks
    if (isSubmitting || isClaimed) {
      return
    }

    setIsSubmitting(true)

    try {
      // Step 1: Get nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce')
      }
      const { nonce } = await nonceResponse.json()

      // Step 2: Sign message
      const message = `Claim Avalanche Profile Hub for ${address}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      // Step 3: Claim profile
      // Normalize address to lowercase before sending
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

      // Success - mark as claimed (whether it was already claimed or newly claimed)
      setIsClaimed(true)
      if (result.alreadyClaimed) {
        toast.success('Profile already claimed')
      } else {
        toast.success('Profile claimed successfully!')
      }
      
      // Refresh router cache
      router.refresh()
      
      if (onSuccess) {
        // Call onSuccess callback with profile data from API response
        // This allows immediate UI update without waiting for loadData()
        onSuccess(result.profile ? {
          status: result.profile.status,
          claimedAt: result.profile.claimedAt,
          slug: result.profile.slug,
          displayName: null, // displayName might not be in claim response, will be loaded by loadData()
        } : undefined)
      } else {
        // Default: Navigate to dashboard after claim
        // Use replace to avoid back button issues
        router.replace(`/dashboard/${normalizedAddress}`)
      }
    } catch (error: any) {
      console.error('Error claiming profile:', error)
      toast.error('Profil sahiplenme başarısız. Lütfen tekrar deneyin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Prevent hydration mismatch by showing consistent UI until mounted
  if (!mounted) {
    return (
      <Button variant="default" size="sm" disabled className="bg-accent-primary text-black">
        Claim Profile
      </Button>
    )
  }

  if (!isConnected) {
    return (
      <WalletConnectButtons
        variant="default"
        size="sm"
        className="bg-accent-primary text-black hover:bg-accent-primary/90"
      />
    )
  }

  // Address mismatch: return null - parent component should handle guard state
  if (connectedAddress.toLowerCase() !== address.toLowerCase()) {
    return null
  }

  // If already claimed, show a non-clickable badge instead of button
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
      disabled={isSubmitting} 
      variant="default"
      size="sm"
      className={`bg-accent-primary text-black hover:bg-accent-primary/90 ${isSubmitting ? "pointer-events-none" : ""}`}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Claiming...
        </>
      ) : (
        'Claim Profile'
      )}
    </Button>
  )
}
