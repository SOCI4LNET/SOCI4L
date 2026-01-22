'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useSignMessage } from 'wagmi'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Bookmark as BookmarkIcon } from 'lucide-react'
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
  const { address: connectedAddress, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
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
          const statusResponse = await fetch(`/api/profile/${normalizedAddress}/follow-status`, {
            cache: 'no-store',
            credentials: 'include',
          })
          if (statusResponse.ok) {
            const status = await statusResponse.json()
            setIsFollowing(status.isFollowing || false)
          }
        }
      } catch (error) {
        console.error('Error fetching follow data:', error)
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
      const statusResponse = await fetch(`/api/profile/${normalizedAddress}/follow-status`, {
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
          toast.error('Nonce alınamadı')
          return false
        }
        const { nonce } = await nonceResponse.json()

        // Step 2: Sign message
        const message = `Follow auth for Avalanche Profile Hub. Address: ${connectedAddress}. Nonce: ${nonce}`
        let signature: string
        try {
          signature = await signMessageAsync({ message })
        } catch (error: any) {
          if (error.code === 4001) {
            toast.error('İmza reddedildi')
          } else {
            toast.error('İmza hatası')
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
          toast.error(error.error || 'Oturum oluşturulamadı')
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error ensuring session:', error)
      toast.error('Oturum kontrolü başarısız')
      return false
    }
  }

  const handleToggle = async (pressed: boolean) => {
    if (!mounted) return

    // Ensure session exists
    const hasSession = await ensureSession()
    if (!hasSession) {
      return
    }

    if (isPending) return

    const normalizedAddress = address.toLowerCase()
    const normalizedConnectedAddress = connectedAddress?.toLowerCase()

    // Prevent self-follow
    if (normalizedConnectedAddress === normalizedAddress) {
      toast.error('Kendinizi takip edemezsiniz')
      return
    }

    setIsPending(true)
    const previousState = isFollowing

    // Optimistic update
    setIsFollowing(pressed)
    if (pressed) {
      setFollowersCount((prev) => prev + 1)
    } else {
      setFollowersCount((prev) => Math.max(0, prev - 1))
    }

    try {
      if (pressed) {
        // Follow
        const response = await fetch(`/api/profile/${normalizedAddress}/follow`, {
          method: 'POST',
          credentials: 'include',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Takip başarısız')
        }

        const data = await response.json()
        setFollowersCount(data.followersCount || followersCount + 1)
        setIsFollowing(true)
        onFollowChange?.(true)
      } else {
        // Unfollow
        const response = await fetch(`/api/profile/${normalizedAddress}/follow`, {
          method: 'DELETE',
          credentials: 'include',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Takibi bırakma başarısız')
        }

        const data = await response.json()
        setFollowersCount(data.followersCount || Math.max(0, followersCount - 1))
        setIsFollowing(false)
        onFollowChange?.(false)
      }
    } catch (error: any) {
      // Rollback on error
      setIsFollowing(previousState)
      if (pressed) {
        setFollowersCount((prev) => Math.max(0, prev - 1))
      } else {
        setFollowersCount((prev) => prev + 1)
      }
      toast.error(error.message || 'Bir hata oluştu')
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

  if (!isConnected) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{toggleButton}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Connect wallet to follow</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (isSelfProfile) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{toggleButton}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>You can't follow yourself</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return toggleButton
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
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span>Followers {followersCount}</span>
      <span>Following {followingCount}</span>
    </div>
  )
}
