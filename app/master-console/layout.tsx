'use client'

import { ReactNode, useEffect, useState, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/admin-shell'

const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || '')
  .split(',')
  .map((addr) => addr.trim().toLowerCase())
  .filter(Boolean)

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [walletChecked, setWalletChecked] = useState(false)
  const loggedLoginRef = useRef(false)
  const lastPathnameRef = useRef<string | null>(null)

  // Wagmi hooks - safe to call, but only use values after mount and status check
  const { address, isConnected, status } = useAccount()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Wait for Wagmi to be ready before checking wallet connection
  useEffect(() => {
    if (!mounted) return

    // Wait for Wagmi status to be determined (not 'connecting' or 'reconnecting')
    if (status === 'connecting' || status === 'reconnecting') {
      return
    }

    // Mark wallet as checked once status is determined
    if (!walletChecked) {
      setWalletChecked(true)
    }
  }, [mounted, status, walletChecked])

  useEffect(() => {
    if (!mounted || !walletChecked) return

    // Only check after Wagmi has determined connection status
    if (status !== 'connected' || !isConnected || !address) {
      // Do nothing - UI will handle "Not connected" state
      return
    }

    const normalized = address.toLowerCase()
    if (!ADMIN_ADDRESSES.includes(normalized)) {
      // Do nothing - UI will handle "Access Denied" state
      return
    }

    // Log admin login (only once)
    if (!loggedLoginRef.current) {
      loggedLoginRef.current = true
      fetch('/api/admin/log-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          targetType: 'system',
          metadata: { adminAddress: normalized },
        }),
      }).catch(() => {
        // Silently fail
      })
    }

    // Log page views when pathname changes
    const lastPathname = lastPathnameRef.current
    if (lastPathname && lastPathname !== pathname) {
      let action = 'view_system'
      let targetType: string | undefined = 'system'
      let targetId: string | undefined = undefined

      if (pathname === '/master-console') {
        action = 'view_overview'
        targetType = 'analytics'
      } else if (pathname === '/master-console/users') {
        action = 'view_users'
        targetType = 'system'
      } else if (pathname.startsWith('/master-console/users/')) {
        action = 'view_user'
        targetType = 'profile'
        const match = pathname.match(/\/master-console\/users\/(.+)$/)
        if (match) {
          targetId = decodeURIComponent(match[1]).toLowerCase()
        }
      } else if (pathname === '/master-console/analytics') {
        action = 'view_analytics'
        targetType = 'analytics'
      } else if (pathname === '/master-console/system') {
        action = 'view_system'
        targetType = 'system'
      }

      fetch('/api/admin/log-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          targetType,
          targetId,
          metadata: {
            adminAddress: normalized,
            pathname,
          },
        }),
      }).catch(() => {
        // Silently fail
      })
    }

    lastPathnameRef.current = pathname
  }, [mounted, walletChecked, status, isConnected, address, router, pathname])

  // Show loading state while checking wallet connection
  if (!mounted || !walletChecked) {
    return (
      <div className="flex min-h-svh w-full">
        <div className="flex flex-1 flex-col">
          <div className="h-16 border-b" />
          <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
            <div className="space-y-4">
              <div className="h-8 w-48 animate-pulse rounded bg-muted" />
              <div className="h-64 w-full animate-pulse rounded bg-muted" />
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Not connected state - show manual connect prompt instead of redirecting
  if (status !== 'connected' || !isConnected || !address) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            {/* Simple lock icon or wallet icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-primary"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Admin Access Required</h1>
          <p className="text-sm text-muted-foreground">
            Please connect your wallet to access the Master Console.
          </p>
          {/* We rely on the global header connect button usually, but here we can just guide them */}
          <div className="text-xs text-muted-foreground">
            Click "Connect Wallet" in the top right.
          </div>
        </div>
      </div>
    )
  }

  const normalizedAddress = address.toLowerCase()
  const isAdmin = ADMIN_ADDRESSES.includes(normalizedAddress)

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-destructive"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            The wallet <span className="font-mono text-xs font-medium text-foreground">{address}</span> is not authorized to access the Master Console.
          </p>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-primary hover:underline underline-offset-4"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex flex-1 flex-col">
        <AdminShell>{children}</AdminShell>
      </div>
    </div>
  )
}

