'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'

interface AdminActivityLoggerProps {
  action: string
  targetType?: string
  targetId?: string
  metadata?: Record<string, any>
}

/**
 * Client component to log admin activity when mounted.
 * Should be used in admin pages to track views.
 */
export function AdminActivityLogger({
  action,
  targetType,
  targetId,
  metadata,
}: AdminActivityLoggerProps) {
  const { address } = useAccount()
  const pathname = usePathname()

  useEffect(() => {
    // Only log if wallet is connected
    if (!address) return

    const normalizedAddress = address.toLowerCase()

    // Call API to log the action (server-side logging)
    fetch('/api/admin/log-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        targetType,
        targetId,
        metadata: {
          ...metadata,
          pathname,
          adminAddress: normalizedAddress,
        },
      }),
    }).catch(() => {
      // Silently fail - logging should never break the UI
    })
  }, [address, action, targetType, targetId, pathname, metadata])

  return null
}
