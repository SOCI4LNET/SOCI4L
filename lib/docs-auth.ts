import { cookies } from 'next/headers'
import {
    createDocsAdminSessionToken,
    DOCS_ADMIN_SESSION_COOKIE,
    DOCS_ADMIN_SESSION_MAX_AGE_SECONDS,
    verifyDocsAdminSessionToken,
} from '@/lib/docs-auth-token'

export interface DocsAdminSession {
    id: string
    address: string
    role: string
}

export async function getDocsAdminSession(): Promise<DocsAdminSession | null> {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(DOCS_ADMIN_SESSION_COOKIE)

    if (!sessionCookie) return null

    const session = await verifyDocsAdminSessionToken(sessionCookie.value)
    if (!session) {
        return null
    }

    return {
        id: session.id,
        address: session.address,
        role: session.role,
    }
}

export async function setDocsAdminSession(session: DocsAdminSession): Promise<boolean> {
    const token = await createDocsAdminSessionToken(session)
    if (!token) return false

    const cookieStore = await cookies()
    cookieStore.set(DOCS_ADMIN_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: DOCS_ADMIN_SESSION_MAX_AGE_SECONDS,
        path: '/',
    })

    return true
}

export async function clearDocsAdminSession(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(DOCS_ADMIN_SESSION_COOKIE)
}
