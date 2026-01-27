import { prisma } from '@/lib/prisma'

export type AdminAction =
  | 'login'
  | 'view_overview'
  | 'view_user'
  | 'view_analytics'
  | 'view_system'
  | 'export_users'
  | 'export_subscribers'

export type AdminTargetType = 'profile' | 'link' | 'subscriber' | 'system' | 'export' | 'analytics'

interface LogAdminActionParams {
  adminAddress?: string | null
  action: AdminAction | string
  targetType?: AdminTargetType | string | null
  targetId?: string | null
  metadata?: Record<string, any> | null
  ipHash?: string | null
}

/**
 * Log an admin action to the AdminAuditLog table.
 * 
 * Note: This is a best-effort logger; it should never throw.
 */
export async function logAdminAction(params: LogAdminActionParams): Promise<void> {
  const {
    adminAddress,
    action,
    targetType = null,
    targetId = null,
    metadata = null,
    ipHash = null,
  } = params

  try {
    const normalizedAddress =
      adminAddress && adminAddress.startsWith('0x')
        ? adminAddress.toLowerCase()
        : 'unknown'

    await prisma.adminAuditLog.create({
      data: {
        adminAddress: normalizedAddress,
        action,
        targetType: targetType || null,
        targetId: targetId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipHash: ipHash || null,
      },
    })
  } catch (error) {
    console.error('[AdminAudit] Failed to log admin action', {
      error,
      action,
      targetType,
      targetId,
    })
  }
}

