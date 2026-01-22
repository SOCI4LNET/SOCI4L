'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useSignMessage } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ClaimProfileButtonProps {
  address: string
  onSuccess?: () => void
}

export function ClaimProfileButton({ address, onSuccess }: ClaimProfileButtonProps) {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
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

    setLoading(true)

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
      const claimResponse = await fetch('/api/profile/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: connectedAddress,
          signature,
        }),
      })

      const result = await claimResponse.json()

      if (!claimResponse.ok) {
        throw new Error(result.error || 'Profil talep edilemedi')
      }

      // Success
      toast.success('Profile claimed successfully!')
      if (onSuccess) {
        onSuccess()
      } else {
        // Refresh page
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Error claiming profile:', error)
      toast.error(error.message || 'Profil talep edilirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Prevent hydration mismatch by showing consistent UI until mounted
  if (!mounted) {
    return (
      <Button variant="default" disabled>
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

  if (connectedAddress.toLowerCase() !== address.toLowerCase()) {
    return (
      <div className="space-y-2">
        <Alert variant="destructive">
          <AlertDescription>
            You can only claim a profile for your connected wallet address. 
            Please connect the wallet matching this profile address.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <Button onClick={handleClaim} disabled={loading} variant="default">
      {loading ? (
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
