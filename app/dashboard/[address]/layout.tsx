'use client'

import { ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AppShell } from '@/components/app-shell/app-shell'
import { toast } from 'sonner'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const params = useParams()
  const { address: connectedAddress, isConnected } = useAccount()
  const router = useRouter()
  
  const targetAddress = params.address as string
  const normalizedTargetAddress = targetAddress?.toLowerCase()

  useEffect(() => {
    if (!isConnected || !connectedAddress) {
      toast.error('Connect your wallet to access your dashboard')
      router.push('/')
      return
    }

    const normalizedConnectedAddress = connectedAddress.toLowerCase()
    
    // If user tries to access a different address's dashboard, redirect to their own
    if (normalizedTargetAddress && normalizedTargetAddress !== normalizedConnectedAddress) {
      toast.error('You can only access your own dashboard')
      router.push(`/dashboard/${normalizedConnectedAddress}`)
      return
    }
  }, [isConnected, connectedAddress, normalizedTargetAddress, router])

  if (!isConnected || !connectedAddress) {
    return null
  }

  const normalizedConnectedAddress = connectedAddress.toLowerCase()
  const displayAddress = normalizedTargetAddress || normalizedConnectedAddress

  return <AppShell address={displayAddress}>{children}</AppShell>
}
