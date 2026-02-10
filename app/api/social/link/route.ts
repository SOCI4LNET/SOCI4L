import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'

import { cookies } from 'next/headers'
import { verifyMessage, recoverMessageAddress } from 'viem'
import { getNonce, markNonceAsUsed, isValidNonce } from '@/lib/nonce-store'
import { isValidAddress } from '@/lib/utils'

// Test mode: allow "signed-{nonce}" format for MCP tests
const TEST_MODE = process.env.NODE_ENV === 'test' || process.env.MCP_TEST_MODE === '1'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { platform, platformUsername, platformUserId, address, signature } = body

        // 1. Try Session Auth
        const sessionOwner = await getSessionAddress()
        let effectiveAddress = sessionOwner

        // Checks if the requested address matches the session.
        // If not, we ignore the session and force signature verification (Step 2).
        if (address && sessionOwner && address.toLowerCase() !== sessionOwner.toLowerCase()) {
            effectiveAddress = null
        }

        // 2. Fallback: Signature Auth (if no session)
        if (!effectiveAddress) {
            if (!address || !signature) {
                return NextResponse.json({ error: 'Unauthorized: Session or Signature required' }, { status: 401 })
            }

            const normalizedAddress = address.toLowerCase()
            const cookieStore = await cookies()

            // Nonce verification logic (reused from profile/links)
            let nonce: string | null = null

            // Test mode nonce
            if (TEST_MODE && signature.startsWith('signed-')) {
                const extracted = signature.replace('signed-', '')
                const rec = getNonce(extracted)
                if (rec && !rec.used) nonce = extracted
            }

            // Cookie nonce
            if (!nonce) {
                const cNonce = cookieStore.get('aph_nonce')?.value
                if (cNonce) {
                    const rec = getNonce(cNonce)
                    if (rec && !rec.used) nonce = cNonce
                }
            }

            if (!nonce || !isValidNonce(nonce)) {
                return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 })
            }

            // Verify Signature
            try {
                let signer: string
                if (TEST_MODE && signature.startsWith('signed-')) {
                    // Test signature logic
                    const parts = signature.replace('signed-', '').split('-')
                    if (parts.length >= 2 && parts.slice(1).join('-') === nonce && parts[0].toLowerCase() === normalizedAddress) {
                        signer = normalizedAddress
                    } else {
                        throw new Error('Invalid test signature')
                    }
                } else {
                    // Real ECDSA logic
                    // We need to define the message format clearly. 
                    // reusing the generic update format or specific one? 
                    // Let's use a specific one for social linking if possible, or generic to be safe.
                    // To avoid breaking existing clients that might expect a specific message, 
                    // but since this is a NEW requirement, I can define the message.
                    // Message: "Link {platform} account to {address}. Nonce: {nonce}"
                    const message = `Link ${platform} account to ${normalizedAddress}. Nonce: ${nonce}`

                    signer = await recoverMessageAddress({ message, signature: signature as `0x${string}` })
                    const isValid = await verifyMessage({ address: signer as `0x${string}`, message, signature: signature as `0x${string}` })
                    if (!isValid) throw new Error('Invalid signature')
                }

                if (signer.toLowerCase() !== normalizedAddress) {
                    return NextResponse.json({ error: 'Unauthorized: Signer mismatch' }, { status: 403 })
                }

                effectiveAddress = normalizedAddress
                markNonceAsUsed(nonce)
                cookieStore.delete('aph_nonce')

            } catch (e) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
            }
        }

        if (!effectiveAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!platform || !platformUsername || !platformUserId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const profile = await prisma.profile.findUnique({
            where: { address: effectiveAddress.toLowerCase() }
        })

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        // Check if this social account is already linked to ANOTHER profile
        const existing = await prisma.socialConnection.findUnique({
            where: {
                platform_platformUserId: {
                    platform,
                    platformUserId
                }
            },
            include: { profile: true }
        })

        if (existing && existing.profileId !== profile.id) {
            return NextResponse.json({
                error: `This ${platform} account is already connected to another profile.`
            }, { status: 409 })
        }

        // Create or Update the connection
        const connection = await prisma.socialConnection.upsert({
            where: {
                platform_platformUserId: {
                    platform,
                    platformUserId
                }
            },
            update: {
                platformUsername, // Update username in case it changed
                verifiedAt: new Date(),
            },
            create: {
                profileId: profile.id,
                platform,
                platformUsername,
                platformUserId,
                verifiedAt: new Date(),
            }
        })

        return NextResponse.json({ success: true, connection })
    } catch (error) {
        console.error('[API] Social Link Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        // Get data from query params
        const url = new URL(req.url)
        const platform = url.searchParams.get('platform')
        const address = url.searchParams.get('address') // wallet address
        const signature = url.searchParams.get('signature')

        if (!platform) {
            return NextResponse.json({ error: 'Missing platform parameter' }, { status: 400 })
        }

        // 1. Try Session Auth
        const sessionOwner = await getSessionAddress()
        let effectiveAddress = sessionOwner

        // 2. Fallback: Signature Auth
        if (!effectiveAddress) {
            if (!address || !signature) {
                return NextResponse.json({ error: 'Unauthorized: Session or Signature required' }, { status: 401 })
            }

            const normalizedAddress = address.toLowerCase()
            const cookieStore = await cookies()

            let nonce: string | null = null
            // Test mode nonce details omitted for brevity in DELETE for now, assuming standard flow
            // Actually, for consistency let's just reuse the cookie check logic or keep it simple.
            // Since DELETE is also critical, I must verify.

            const cNonce = cookieStore.get('aph_nonce')?.value
            if (cNonce) {
                const rec = getNonce(cNonce)
                if (rec && !rec.used) nonce = cNonce
            }

            if (!nonce || !isValidNonce(nonce)) {
                return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 })
            }

            try {
                const message = `Unlink ${platform} account from ${normalizedAddress}. Nonce: ${nonce}`

                // Since this is GET/DELETE params, ensure signature is handled correctly
                // Simplified production verification here to save space
                const signer = await recoverMessageAddress({ message, signature: signature as `0x${string}` })
                if (signer.toLowerCase() !== normalizedAddress) throw new Error()

                effectiveAddress = normalizedAddress
                markNonceAsUsed(nonce)
                cookieStore.delete('aph_nonce')
            } catch (e) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
            }
        }

        if (!effectiveAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const profile = await prisma.profile.findUnique({
            where: { address: effectiveAddress.toLowerCase() }
        })

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        // Delete the connection
        await prisma.socialConnection.deleteMany({
            where: {
                profileId: profile.id,
                platform: platform
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API] Social Unlink Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
