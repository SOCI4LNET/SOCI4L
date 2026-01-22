'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useSignMessage } from 'wagmi'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ClaimProfileButtonProps {
  address: string
  onSuccess?: () => void
}

export function ClaimProfileButton({ address, onSuccess }: ClaimProfileButtonProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClaimed, setIsClaimed] = useState(false)
  const { address: connectedAddress, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { signMessageAsync } = useSignMessage()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleClaim = async () => {
    if (!isConnected || !connectedAddress) {
      // Try to connect if not connected
      if (connectors.length > 0) {
        connect({ connector: connectors[0] })
      }
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
        throw new Error('Nonce alınamadı')
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
        throw new Error(result.error || 'Profil talep edilemedi')
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
        // Call onSuccess callback (which should handle navigation and refresh)
        onSuccess()
      } else {
        // Default: Navigate to dashboard after claim
        // Use replace to avoid back button issues
        router.replace(`/dashboard/${normalizedAddress}`)
      }
    } catch (error: any) {
      console.error('Error claiming profile:', error)
      toast.error(error.message || 'Profil talep edilirken bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Prevent hydration mismatch by showing consistent UI until mounted
  if (!mounted) {
    return (
      <Button variant="default" size="sm" disabled>
        Claim Profile
      </Button>
    )
  }

  if (!isConnected) {
    return (
      <Button
        onClick={() => {
          if (connectors.length > 0) {
            connect({ connector: connectors[0] })
          }
        }}
        variant="default"
        size="sm"
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          'Connect Wallet to Claim'
        )}
      </Button>
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
      className={isSubmitting ? "pointer-events-none" : ""}
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
