'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useSignMessage } from 'wagmi'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Bookmark as BookmarkIcon, Users, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { isValidAddress } from '@/lib/utils'
import { useTransaction } from '@/components/providers/transaction-provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface FollowToggleProps {
  address: string
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowToggle({ address, onFollowChange }: FollowToggleProps) {
  const [mounted, setMounted] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const { address: connectedAddress, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { signMessageAsync } = useSignMessage()
  const { showTransactionLoader, hideTransactionLoader } = useTransaction()
  const queryClient = useQueryClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch follow status
  useEffect(() => {
    if (!mounted || !isValidAddress(address)) return

    const fetchStatus = async () => {
      try {
        const normalizedAddress = address.toLowerCase()

        // Fetch follow status (requires session)
        if (isConnected && connectedAddress) {
          const normalizedConnectedAddress = connectedAddress.toLowerCase()
          // Include connected address as query param to verify session matches
          const statusResponse = await fetch(`/api/profile/${normalizedAddress}/follow-status?connectedAddress=${encodeURIComponent(normalizedConnectedAddress)}`, {
            cache: 'no-store',
            credentials: 'include',
          })

          if (statusResponse.ok) {
            const status = await statusResponse.json()
            setIsFollowing(status.isFollowing || false)
          } else {
            setIsFollowing(false)
          }
        } else {
          setIsFollowing(false)
        }
      } catch (error) {
        console.error('Error fetching follow status:', error)
        setIsFollowing(false)
      }
    }

    fetchStatus()
  }, [mounted, address, isConnected, connectedAddress])

  const ensureSession = async (): Promise<boolean> => {
    if (!isConnected || !connectedAddress) {
      if (connectors.length > 0) {
        connect({ connector: connectors[0] })
      }
      return false
    }

    // Check if we have a valid session by trying to get follow status
    try {
      const normalizedAddress = address.toLowerCase()
      const normalizedConnectedAddress = connectedAddress.toLowerCase()
      // Include connected address as query param to verify session matches
      const statusResponse = await fetch(`/api/profile/${normalizedAddress}/follow-status?connectedAddress=${encodeURIComponent(normalizedConnectedAddress)}`, {
        cache: 'no-store',
        credentials: 'include',
      })

      // If 401, we need to create a session
      if (statusResponse.status === 401) {
        // Step 1: Get nonce
        const nonceResponse = await fetch('/api/auth/nonce', {
          credentials: 'include',
        })
        if (!nonceResponse.ok) {
          toast.error('Connection failed. Please try again.')
          return false
        }
        const { nonce } = await nonceResponse.json()

        // Step 2: Sign message (use lowercase address to match backend verification)
        const normalizedConnectedAddress = connectedAddress.toLowerCase()
        const message = `Follow auth for SOCI4L. Address: ${normalizedConnectedAddress}. Nonce: ${nonce}`
        let signature: string
        try {
          showTransactionLoader("Confirm in Wallet...")
          signature = await signMessageAsync({ message })
          showTransactionLoader("Creating session...")
        } catch (error: any) {
          hideTransactionLoader()
          // Re-throw to be handled by the main catch block
          throw error
        }

        // Step 3: Verify and create session
        const verifyResponse = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ address: connectedAddress, signature }),
        })

        if (!verifyResponse.ok) {
          const error = await verifyResponse.json()
          toast.error('Failed to create session. Please try again.')
          return false
        }

        // Wait for cookie to be written (serverless-friendly)
        // Retry verification up to 3 times with increasing delays
        let sessionVerified = false
        for (let attempt = 0; attempt < 3; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 200 + (attempt * 100)))

          // Verify session was created by checking follow status
          const verifyStatusResponse = await fetch(`/api/profile/${normalizedAddress}/follow-status?connectedAddress=${encodeURIComponent(normalizedConnectedAddress)}`, {
            cache: 'no-store',
            credentials: 'include',
          })

          // If not 401, session exists
          if (verifyStatusResponse.status !== 401) {
            sessionVerified = true
            break
          }
        }

        // If still 401 after retries, session creation failed
        if (!sessionVerified) {
          console.error('Session creation verification failed after retries')
          toast.error('Session created but verification failed. Please try again.')
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error ensuring session:', error)
      toast.error('Session verification failed. Please try again.')
      return false
    }
  }

  const handleToggle = async (pressed: boolean) => {
    if (!mounted) return

    // If not connected, show connect dialog
    if (!isConnected) {
      setShowConnectDialog(true)
      return
    }

    if (isPending) return

    const normalizedAddress = address.toLowerCase()
    const normalizedConnectedAddress = connectedAddress?.toLowerCase()
    if (!normalizedConnectedAddress) {
      toast.error('Wallet address not found')
      return
    }

    // Prevent self-follow
    if (normalizedConnectedAddress === normalizedAddress) {
      toast.error('You cannot follow yourself')
      return
    }

    setIsPending(true)
    const previousState = isFollowing

    // Ensure session exists (before optimistic update)
    const hasSession = await ensureSession()
    if (!hasSession) {
      // Session creation failed - ensureSession already shows error toast
      setIsPending(false)
      return
    }

    // Additional delay to ensure cookie is written (serverless-friendly)
    await new Promise(resolve => setTimeout(resolve, 300))

    // Optimistic update
    setIsFollowing(pressed)

    try {
      showTransactionLoader(pressed ? "Following..." : "Unfollowing...")

      const endpoint = `/api/profile/${normalizedAddress}/follow?connectedAddress=${encodeURIComponent(normalizedConnectedAddress)}`

      let response
      if (pressed) {
        response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
        })
      } else {
        response = await fetch(endpoint, {
          method: 'DELETE',
          credentials: 'include',
        })
      }

      if (!response.ok) {
        // Handle auth retries if needed
        if (response.status === 401 || response.status === 403) {
          // ... simple retry logic or just fail
          // For brevity, defaulting to failure message if simple session ensure failed
          toast.error('Session expired. Please reconnect your wallet.')
          setIsFollowing(previousState)
          return
        }
        const error = await response.json()
        throw new Error(error.error || 'Action failed')
      }

      const data = await response.json()

      // Update local state with truth from server
      setIsFollowing(data.isFollowing ?? pressed)
      onFollowChange?.(data.isFollowing ?? pressed)

      // Update FollowStats cache immediately so follower count updates on public profile.
      // Do NOT invalidateQueries here — refetch can return cached/0 and overwrite this.
      queryClient.setQueryData(
        ['follow-stats', normalizedAddress],
        (prev: { followersCount?: number; followingCount?: number; isFollowing?: boolean } | undefined) => ({
          ...prev,
          followersCount: data.followersCount ?? prev?.followersCount ?? 0,
          followingCount: prev?.followingCount ?? 0,
          isFollowing: data.isFollowing ?? pressed,
        })
      )

    } catch (error: any) {
      // Rollback on error
      setIsFollowing(previousState)
      if (error?.message?.includes('User rejected') || error?.name === 'UserRejectedRequestError') {
        toast.error('Transaction rejected')
      } else {
        toast.error('Action failed. Please try again.')
      }
    } finally {
      setIsPending(false)
      hideTransactionLoader()
    }
  }

  if (!mounted) {
    return null
  }

  const normalizedAddress = address.toLowerCase()
  const normalizedConnectedAddress = connectedAddress?.toLowerCase()
  const isSelfProfile = normalizedConnectedAddress === normalizedAddress

  const handleConnect = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] })
      setShowConnectDialog(false)
    }
  }

  const getTooltipText = () => {
    if (isSelfProfile) {
      return "You can't follow yourself"
    }
    if (!isConnected) {
      return 'Connect your wallet to follow profiles'
    }
    if (isFollowing) {
      return 'Unfollow this profile'
    }
    return 'Follow this profile'
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Toggle
                aria-label="Follow profile"
                size="sm"
                variant="outline"
                pressed={isFollowing}
                onPressedChange={handleToggle}
                disabled={!isConnected || isPending || isSelfProfile}
                className="gap-2"
              >
                <BookmarkIcon className="h-3.5 w-3.5 group-data-[state=on]/toggle:fill-foreground" />
                {isFollowing ? 'Following' : 'Follow'}
              </Toggle>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AlertDialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connect Wallet</AlertDialogTitle>
            <AlertDialogDescription>
              You need to connect your wallet to follow profiles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConnect} disabled={isConnecting || connectors.length === 0}>
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function FollowStats({ address }: { address: string }) {
  const [mounted, setMounted] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['follow-stats', address?.toLowerCase()],
    queryFn: async () => {
      if (!isValidAddress(address)) throw new Error('Invalid address')
      const normalizedAddress = address.toLowerCase()
      const response = await fetch(`/api/profile/${normalizedAddress}/follow-stats`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      return response.json()
    },
    enabled: isValidAddress(address),
    staleTime: 1000 * 60, // 1 minute (since we invalidate manually on change)
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const followersCount = stats?.followersCount || 0
  const followingCount = stats?.followingCount || 0

  return (
    <div className="flex items-center gap-5">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm text-muted-foreground">Followers</span>
          <span className="text-base font-semibold text-foreground">{followersCount}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm text-muted-foreground">Following</span>
          <span className="text-base font-semibold text-foreground">{followingCount}</span>
        </div>
      </div>
    </div>
  )
}
