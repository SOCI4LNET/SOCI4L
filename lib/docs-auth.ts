import { cookies } from 'next/headers'

export const DOCS_ADMIN_SESSION_COOKIE = 'soci4l_docs_admin_session'

export interface DocsAdminSession {
    id: string
    address: string
    role: string
}

export async function getDocsAdminSession(): Promise<DocsAdminSession | null> {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get(DOCS_ADMIN_SESSION_COOKIE)

    if (!sessionCookie) return null

    try {
        const value = sessionCookie.value.startsWith('%')
            ? decodeURIComponent(sessionCookie.value)
            : sessionCookie.value

        const session = JSON.parse(value)
        return session as DocsAdminSession
    } catch {
        return null
    }
}
