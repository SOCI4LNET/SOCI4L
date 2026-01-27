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

interface FollowToggleProps {
  address: string
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowToggle({ address, onFollowChange }: FollowToggleProps) {
  const [mounted, setMounted] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const { address: connectedAddress, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { signMessageAsync } = useSignMessage()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch follow stats and status
  useEffect(() => {
    if (!mounted || !isValidAddress(address)) return

    const fetchData = async () => {
      try {
        const normalizedAddress = address.toLowerCase()

        // Fetch stats (public)
        const statsResponse = await fetch(`/api/profile/${normalizedAddress}/follow-stats`, {
          cache: 'no-store',
        })
        if (statsResponse.ok) {
          const stats = await statsResponse.json()
          setFollowersCount(stats.followersCount || 0)
          setFollowingCount(stats.followingCount || 0)
        }

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
            // API will return false if session doesn't match connected wallet
            setIsFollowing(status.isFollowing || false)
          } else if (statusResponse.status === 401) {
            // No valid session or session doesn't match connected wallet
            setIsFollowing(false)
          } else {
            // Other error - default to false
            setIsFollowing(false)
          }
        } else {
          // Not connected - definitely not following
          setIsFollowing(false)
        }
      } catch (error) {
        console.error('Error fetching follow data:', error)
        // On error, default to false
        setIsFollowing(false)
      }
    }

    fetchData()
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
          signature = await signMessageAsync({ message })
        } catch (error: any) {
          if (error.code === 4001) {
            toast.error('Signature rejected')
          } else {
            toast.error('Signing failed')
          }
          return false
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

    // Prevent self-follow
    if (normalizedConnectedAddress === normalizedAddress) {
      toast.error('You cannot follow yourself')
      return
    }

    setIsPending(true)
    const previousState = isFollowing
    const previousFollowersCount = followersCount

    // Ensure session exists (before optimistic update)
    const hasSession = await ensureSession()
    if (!hasSession) {
      // Session creation failed - ensureSession already shows error toast
      setIsPending(false)
      return
    }

    // Additional delay to ensure cookie is written (serverless-friendly)
    // This helps with race conditions where session is created but cookie not yet available
    await new Promise(resolve => setTimeout(resolve, 300))

    // Optimistic update (for UI responsiveness)
    setIsFollowing(pressed)
    if (pressed) {
      setFollowersCount((prev) => prev + 1)
    } else {
      setFollowersCount((prev) => Math.max(0, prev - 1))
    }

    try {
      if (pressed) {
        // Follow - include connected address to verify session matches
        const response = await fetch(`/api/profile/${normalizedAddress}/follow?connectedAddress=${encodeURIComponent(normalizedConnectedAddress)}`, {
          method: 'POST',
          credentials: 'include',
        })

        if (!response.ok) {
          const error = await response.json()
          // Handle session mismatch or expired error
          if (response.status === 401 || response.status === 403) {
            // Try to recreate session and retry once
            const retrySession = await ensureSession()
            if (retrySession) {
              // Wait for cookie to be written and verify session with retries
              let sessionReady = false
              for (let attempt = 0; attempt < 3; attempt++) {
                await new Promise(resolve => setTimeout(resolve, 300 + (attempt * 100)))
                
                // Verify session was created by checking follow status
                const verifyResponse = await fetch(`/api/profile/${normalizedAddress}/follow-status?connectedAddress=${encodeURIComponent(normalizedConnectedAddress)}`, {
                  cache: 'no-store',
                  credentials: 'include',
                })
                
                // If verifyResponse is ok, session exists and we can retry
                if (verifyResponse.ok) {
                  sessionReady = true
                  break
                }
              }
              
              if (sessionReady) {
                // Session exists, retry the follow request
                const retryResponse = await fetch(`/api/profile/${normalizedAddress}/follow?connectedAddress=${encodeURIComponent(normalizedConnectedAddress)}`, {
                  method: 'POST',
                  credentials: 'include',
                })
                if (retryResponse.ok) {
                  const retryData = await retryResponse.json()
                  setFollowersCount(retryData.followersCount ?? followersCount)
                  setIsFollowing(retryData.isFollowing ?? true)
                  onFollowChange?.(retryData.isFollowing ?? true)
                  return
                }
                // If retry still fails, check if it's still a session error
                if (retryResponse.status === 401 || retryResponse.status === 403) {
                  toast.error('Session expired. Please reconnect your wallet.')
                  setIsFollowing(false)
                  setFollowersCount(previousFollowersCount)
                  return
                }
              } else {
                // Session verification failed after retries
                toast.error('Session created but not ready. Please try again.')
                setIsFollowing(false)
                setFollowersCount(previousFollowersCount)
                return
              }
            }
            toast.error('Session expired. Please reconnect your wallet.')
            // Reset follow status to false
            setIsFollowing(false)
            setFollowersCount(previousFollowersCount)
            return
          }
          throw new Error(error.error || 'Follow failed')
        }

        const data = await response.json()
        // Use backend response to ensure accuracy (overrides optimistic update)
        // Backend returns the actual current state, handling idempotent operations
        setFollowersCount(data.followersCount ?? followersCount)
        setIsFollowing(data.isFollowing ?? true)
        onFollowChange?.(data.isFollowing ?? true)
      } else {
        // Unfollow - include connected address to verify session matches
        const response = await fetch(`/api/profile/${normalizedAddress}/follow?connectedAddress=${encodeURIComponent(normalizedConnectedAddress)}`, {
          method: 'DELETE',
          credentials: 'include',
        })

        if (!response.ok) {
          const error = await response.json()
          // Handle session mismatch or expired error
          if (response.status === 401 || response.status === 403) {
            // Try to recreate session and retry once
            const retrySession = await ensureSession()
            if (retrySession) {
              // Wait for cookie to be written and verify session with retries
              let sessionReady = false
              for (let attempt = 0; attempt < 3; attempt++) {
                await new Promise(resolve => setTimeout(resolve, 300 + (attempt * 100)))
                
                // Verify session was created by checking follow status
                const verifyResponse = await fetch(`/api/profile/${normalizedAddress}/follow-status?connectedAddress=${encodeURIComponent(normalizedConnectedAddress)}`, {
                  cache: 'no-store',
                  credentials: 'include',
                })
                
                // If verifyResponse is ok, session exists and we can retry
                if (verifyResponse.ok) {
                  sessionReady = true
                  break
                }
              }
              
              if (sessionReady) {
                // Session exists, retry the unfollow request
                const retryResponse = await fetch(`/api/profile/${normalizedAddress}/follow?connectedAddress=${encodeURIComponent(normalizedConnectedAddress)}`, {
                  method: 'DELETE',
                  credentials: 'include',
                })
                if (retryResponse.ok) {
                  const retryData = await retryResponse.json()
                  setFollowersCount(retryData.followersCount ?? Math.max(0, followersCount - 1))
                  setIsFollowing(retryData.isFollowing ?? false)
                  onFollowChange?.(retryData.isFollowing ?? false)
                  return
                }
                // If retry still fails, check if it's still a session error
                if (retryResponse.status === 401 || retryResponse.status === 403) {
                  toast.error('Session expired. Please reconnect your wallet.')
                  setIsFollowing(previousState)
                  setFollowersCount(previousFollowersCount)
                  return
                }
              } else {
                // Session verification failed after retries
                toast.error('Session created but not ready. Please try again.')
                setIsFollowing(previousState)
                setFollowersCount(previousFollowersCount)
                return
              }
            }
            toast.error('Session expired. Please reconnect your wallet.')
            // Reset follow status to previous state
            setIsFollowing(previousState)
            setFollowersCount(previousFollowersCount)
            return
          }
          throw new Error(error.error || 'Unfollow failed')
        }

        const data = await response.json()
        // Use backend response to ensure accuracy (overrides optimistic update)
        setFollowersCount(data.followersCount ?? Math.max(0, followersCount - 1))
        setIsFollowing(data.isFollowing ?? false)
        onFollowChange?.(data.isFollowing ?? false)
      }
    } catch (error: any) {
      // Rollback on error - restore previous state
      setIsFollowing(previousState)
      setFollowersCount(previousFollowersCount)
      toast.error('Action failed. Please try again.')
    } finally {
      setIsPending(false)
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

  // Determine tooltip text based on state
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

  const toggleButton = (
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
  )

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{toggleButton}</div>
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
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !isValidAddress(address)) return

    const fetchStats = async () => {
      try {
        const normalizedAddress = address.toLowerCase()
        const response = await fetch(`/api/profile/${normalizedAddress}/follow-stats`, {
          cache: 'no-store',
        })
        if (response.ok) {
          const stats = await response.json()
          setFollowersCount(stats.followersCount || 0)
          setFollowingCount(stats.followingCount || 0)
        }
      } catch (error) {
        console.error('Error fetching follow stats:', error)
      }
    }

    fetchStats()
  }, [mounted, address])

  if (!mounted) {
    return null
  }

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
