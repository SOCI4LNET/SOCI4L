'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || '')
    .split(',')
    .map((addr) => addr.trim().toLowerCase())
    .filter(Boolean)

/**
 * Checks if the given address is an authorized admin.
 */
function isAdmin(address: string) {
    return ADMIN_ADDRESSES.includes(address.toLowerCase())
}

/**
 * Bans a user profile.
 */
export async function banUser(adminAddress: string, targetAddress: string, reason: string) {
    if (!isAdmin(adminAddress)) {
        throw new Error('Unauthorized')
    }

    const normalizedTarget = targetAddress.toLowerCase()

    try {
        // Update profile
        await prisma.profile.update({
            where: { address: normalizedTarget },
            data: { isBanned: true },
        })

        // Log action
        await prisma.userActivityLog.create({
            data: {
                profileId: (await prisma.profile.findUniqueOrThrow({ where: { address: normalizedTarget } })).id,
                action: 'ban',
                metadata: JSON.stringify({ reason, admin: adminAddress }),
            },
        })

        revalidatePath('/master-console/users')
        revalidatePath(`/master-console/users/${encodeURIComponent(normalizedTarget)}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to ban user:', error)
        throw new Error('Failed to ban user')
    }
}

/**
 * Unbans a user profile.
 */
export async function unbanUser(adminAddress: string, targetAddress: string) {
    if (!isAdmin(adminAddress)) {
        throw new Error('Unauthorized')
    }

    const normalizedTarget = targetAddress.toLowerCase()

    try {
        // Update profile
        await prisma.profile.update({
            where: { address: normalizedTarget },
            data: { isBanned: false },
        })

        // Log action
        await prisma.userActivityLog.create({
            data: {
                profileId: (await prisma.profile.findUniqueOrThrow({ where: { address: normalizedTarget } })).id,
                action: 'unban',
                metadata: JSON.stringify({ admin: adminAddress }),
            },
        })

        revalidatePath('/master-console/users')
        revalidatePath(`/master-console/users/${encodeURIComponent(normalizedTarget)}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to unban user:', error)
        throw new Error('Failed to unban user')
    }
}

/**
 * Updates a user profile (Bio only for now as requested).
 */
export async function updateUserProfile(
    adminAddress: string,
    targetAddress: string,
    data: { bio?: string; displayName?: string }
) {
    if (!isAdmin(adminAddress)) {
        throw new Error('Unauthorized')
    }

    const normalizedTarget = targetAddress.toLowerCase()

    try {
        await prisma.profile.update({
            where: { address: normalizedTarget },
            data: {
                bio: data.bio,
                displayName: data.displayName,
            },
        })

        // Log action
        await prisma.userActivityLog.create({
            data: {
                profileId: (await prisma.profile.findUniqueOrThrow({ where: { address: normalizedTarget } })).id,
                action: 'update_profile_admin',
                metadata: JSON.stringify({ changes: data, admin: adminAddress }),
            },
        })

        revalidatePath(`/master-console/users/${encodeURIComponent(normalizedTarget)}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to update user profile:', error)
        throw new Error('Failed to update user profile')
    }
}
