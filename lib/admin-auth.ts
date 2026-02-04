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

    if (!address) {
        if (context === 'page') {
            redirect('/')
        } else {
            throw new Error('Unauthorized: No session')
        }
    }

    const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || '')
        .split(',')
        .map((addr: string) => addr.trim().toLowerCase())
        .filter(Boolean)

    if (!ADMIN_ADDRESSES.includes(address)) {
        if (context === 'page') {
            redirect('/')
        } else {
            throw new Error('Forbidden: Not an admin')
        }
    }

    return address
}
