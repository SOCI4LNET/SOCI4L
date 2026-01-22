'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Copy } from 'lucide-react'
import { formatAddress, isValidAddress } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [addressInput, setAddressInput] = useState('')
  const { address: connectedAddress, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const router = useRouter()
  const [hasClaimedProfile, setHasClaimedProfile] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !isConnected || !connectedAddress) {
      setLoading(false)
      return
    }

    // Check if connected address has a claimed profile
    const checkProfile = async () => {
      try {
        const response = await fetch(`/api/wallet?address=${connectedAddress}`)
        const data = await response.json()
        
        if (data.profile && data.profile.status === 'CLAIMED') {
          setHasClaimedProfile(true)
        }
      } catch (error) {
        console.error('Error checking profile:', error)
      } finally {
        setLoading(false)
      }
    }

    checkProfile()
  }, [mounted, isConnected, connectedAddress])

  const handleAddressSubmit = () => {
    if (!addressInput.trim()) return
    
    const trimmedAddress = addressInput.trim()
    if (isValidAddress(trimmedAddress)) {
      // Normalize address to lowercase
      const normalizedAddress = trimmedAddress.toLowerCase()
      router.push(`/dashboard/${normalizedAddress}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddressSubmit()
    }
  }

  const handleCopyAddress = async () => {
    if (!connectedAddress) return
    
    try {
      await navigator.clipboard.writeText(connectedAddress)
      toast.success('Address copied')
    } catch (error) {
      toast.error('Copy failed')
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Select a profile to manage
        </p>
      </div>

      {!isConnected ? (
        <Card>
          <CardHeader>
            <CardTitle>Wallet Connection Required</CardTitle>
            <CardDescription>Connect your wallet to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {connectors.length > 0 ? (
              <Button
                onClick={() => connect({ connector: connectors[0] })}
                variant="default"
                size="sm"
                className="w-full"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </Button>
            ) : (
              <p className="text-center text-muted-foreground">
                No wallet connectors available
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Current connected address */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Wallet</CardTitle>
              <CardDescription>Your currently connected wallet address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">{formatAddress(connectedAddress || '')}</p>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={handleCopyAddress}
                      aria-label="Copy address"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Current account</p>
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : hasClaimedProfile ? (
                  <Link href={`/dashboard/${connectedAddress?.toLowerCase()}`}>
                    <Button variant="default" size="sm">Manage My Profile</Button>
                  </Link>
                ) : (
                  <Link href={`/dashboard/${connectedAddress?.toLowerCase()}`}>
                    <Button variant="outline" size="sm">Claim Profile</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address input for other profiles */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Another Profile</CardTitle>
              <CardDescription>
                Enter a wallet address to manage its profile (if you own it)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Wallet Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    placeholder="0x..."
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddressSubmit}
                    disabled={!isValidAddress(addressInput.trim())}
                    size="sm"
                  >
                    Go
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info about account switching */}
          <Alert>
            <AlertDescription>
              <p className="font-semibold mb-1">Multiple Accounts?</p>
              <p className="text-sm">
                If you have multiple accounts in your wallet, switch accounts in your wallet extension,
                then click "Manage My Profile" above or enter the address manually.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
