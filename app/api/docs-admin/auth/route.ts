import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMessage } from 'viem'
import { clearDocsAdminSession, setDocsAdminSession } from '@/lib/docs-auth'
import { getNonce, markNonceAsUsed } from '@/lib/nonce-store'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        const { address, signature } = await request.json()

        if (!address || !signature) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get nonce from cookie for replay protection
        const cookieStore = await cookies()
        const nonce = cookieStore.get('aph_nonce')?.value

        if (!nonce) {
            return NextResponse.json({ error: 'Nonce not found. Please call /api/auth/nonce first.' }, { status: 400 })
        }

        const nonceRecord = getNonce(nonce)
        if (!nonceRecord || nonceRecord.used) {
            return NextResponse.json({ error: 'Nonce expired or already used' }, { status: 400 })
        }

        // Build message with nonce for replay protection
        const message = `Docs Admin login for ${address.toLowerCase()}. Nonce: ${nonce}`

        // 1. Verify Signature with nonce-bound message
        const isValid = await verifyMessage({
            address,
            message,
            signature,
        })

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        // Mark nonce as used
        markNonceAsUsed(nonce)
        cookieStore.delete('aph_nonce')

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

        // 3. Create signed session cookie
        const sessionSet = await setDocsAdminSession({
            id: admin.id,
            address: admin.address,
            role: admin.role
        })
        if (!sessionSet) {
            return NextResponse.json({ error: 'Session configuration error' }, { status: 500 })
        }

        return NextResponse.json({ success: true, admin: { name: admin.name, role: admin.role } })

    } catch (error) {
        console.error('Docs Admin Auth Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE() {
    await clearDocsAdminSession()
    return NextResponse.json({ success: true })
}
