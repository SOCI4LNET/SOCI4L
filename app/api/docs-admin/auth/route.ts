import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMessage } from 'viem'
import { cookies } from 'next/headers'
import { DOCS_ADMIN_SESSION_COOKIE } from '@/lib/docs-auth'

export async function POST(request: NextRequest) {
    try {
        const { address, signature, message } = await request.json()

        if (!address || !signature || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Verify Signature
        const isValid = await verifyMessage({
            address,
            message,
            signature,
        })

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        // 2. Check if user is a DocsAdmin
        const admin = await prisma.docsAdmin.findUnique({
            where: { address: address.toLowerCase() },
        })

        if (!admin) {
            // Allow the very first user or a hardcoded master admin to seed it?
            // For now, return unauthorized if not in DB. 
            // User requested "separate database records", so manual insertion or seed needed.
            return NextResponse.json({ error: 'Not authorized as Docs Admin' }, { status: 403 })
        }

        // 3. Create Session Cookie (Simple for now, can be JWT later)
        // Using httpOnly cookie for security
        const cookieStore = cookies()
        cookieStore.set(DOCS_ADMIN_SESSION_COOKIE, JSON.stringify({
            id: admin.id,
            address: admin.address,
            role: admin.role
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        })

        return NextResponse.json({ success: true, admin: { name: admin.name, role: admin.role } })

    } catch (error) {
        console.error('Docs Admin Auth Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE() {
    const cookieStore = cookies()
    cookieStore.delete(DOCS_ADMIN_SESSION_COOKIE)
    return NextResponse.json({ success: true })
}
