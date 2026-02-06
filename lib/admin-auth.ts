import { redirect } from 'next/navigation'
import { getSessionAddress } from '@/lib/auth'

/**
 * Validates if the current session belongs to an admin.
 * 
 * @param context - 'page' (redirects on fail) or 'api' (throws error on fail)
 * @returns The normalized admin address if valid
 */
export async function requireAdmin(context: 'page' | 'api' = 'page'): Promise<string> {
    const address = await getSessionAddress()

    // Ensure strict string return type for TS
    if (!address || typeof address !== 'string') {
        if (context === 'page') {
            redirect('/admin-login?error=admin_no_session')
        } else {
            throw new Error('Unauthorized: No session')
        }
    }

    const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || '')
        .split(',')
        .map((addr: string) => addr.trim().toLowerCase())
        .filter(Boolean)

    // 1. Check strict whitelist from ENV
    if (ADMIN_ADDRESSES.includes(address)) {
        return address
    }

    // 2. Fallback: Check Role in Database
    try {
        const { prisma } = await import('@/lib/prisma')
        const profile = await prisma.profile.findUnique({
            where: { address },
            select: { role: true }
        })

        if (profile?.role === 'ADMIN') {
            return address
        }
    } catch (error) {
        console.error('[AdminAuth] DB check failed:', error)
        if (context === 'page') {
            redirect('/?error=admin_db_fail')
        } else {
            throw new Error('Internal Server Error: Admin DB check failed')
        }
    }

    // 3. Fail if neither passed
    if (context === 'page') {
        redirect('/?error=not_admin')
    } else {
        throw new Error('Forbidden: Not an admin')
    }

    // This line is technically unreachable due to redirect/throw above, but satisfies TS
    // if the function were to somehow continue execution without redirecting or throwing.
    // However, given the logic, it will always exit before this point if not an admin.
    return address as string
}

