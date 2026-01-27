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
  const loggedLoginRef = useRef(false)
  const lastPathnameRef = useRef<string | null>(null)
  
  // Wagmi hooks - safe to call, but only use values after mount
  const { address, isConnected } = useAccount()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!isConnected || !address) {
      toast.error('Connect your wallet to access admin')
      router.push('/')
      return
    }

    const normalized = address.toLowerCase()
    if (!ADMIN_ADDRESSES.includes(normalized)) {
      toast.error('You are not authorized to access admin')
      router.push('/')
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

      if (pathname === '/admin') {
        action = 'view_overview'
        targetType = 'analytics'
      } else if (pathname === '/admin/users') {
        action = 'view_users'
        targetType = 'system'
      } else if (pathname.startsWith('/admin/users/')) {
        action = 'view_user'
        targetType = 'profile'
        const match = pathname.match(/\/admin\/users\/(.+)$/)
        if (match) {
          targetId = decodeURIComponent(match[1]).toLowerCase()
        }
      } else if (pathname === '/admin/analytics') {
        action = 'view_analytics'
        targetType = 'analytics'
      } else if (pathname === '/admin/system') {
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
  }, [mounted, isConnected, address, router, pathname])

  if (!mounted) {
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

  const normalizedAddress = address?.toLowerCase()
  const isAdmin = isConnected && normalizedAddress && ADMIN_ADDRESSES.includes(normalizedAddress)

  if (!isAdmin) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex flex-1 flex-col">
        <AdminShell>{children}</AdminShell>
      </div>
    </div>
  )
}

