import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress, setSessionAddress } from '@/lib/auth'

import { cookies } from 'next/headers'
import { verifyMessage, recoverMessageAddress } from 'viem'
import { getNonce, markNonceAsUsed, isValidNonce } from '@/lib/nonce-store'
import { isValidAddress } from '@/lib/utils'

// Explicit allowlist of supported social platforms (LOW-6).
// Adding a new platform requires a code change — prevents arbitrary strings
// from being stored in the database.
const ALLOWED_PLATFORMS = new Set([
  'twitter',
  'x',
  'github',
  'linkedin',
  'instagram',
  'farcaster',
  'lens',
  'discord',
  'telegram',
  'youtube',
  'tiktok',
  'twitch',
  'reddit',
  'spotify',
  'medium',
  'substack',
  'mirror',
  'website',
])

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

            // Get nonce from cookie
            let nonce: string | null = null

            const cNonce = cookieStore.get('aph_nonce')?.value
            if (cNonce) {
                const rec = getNonce(cNonce)
                if (rec && !rec.used) nonce = cNonce
            }

            if (!nonce || !isValidNonce(nonce)) {
                return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 })
            }

            // Verify Signature (ECDSA)
            try {
                let signer: string
                const message = `Link ${platform} account to ${normalizedAddress}. Nonce: ${nonce}`

                signer = await recoverMessageAddress({ message, signature: signature as `0x${string}` })
                const isValid = await verifyMessage({ address: signer as `0x${string}`, message, signature: signature as `0x${string}` })
                if (!isValid) throw new Error('Invalid signature')

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

        // Validate platform against allowlist (LOW-6)
        if (!ALLOWED_PLATFORMS.has(platform.toLowerCase())) {
            return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
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

        // Also set aph_session cookie to "login" the user if they linked successfully
        await setSessionAddress(effectiveAddress.toLowerCase().slice(0, 42))

        return NextResponse.json({ success: true, connection })
    } catch (error) {
        console.error('[API] Social Link Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        // Read all parameters from the JSON body — never from query params,
        // because query strings are recorded in server access logs, proxy logs,
        // and browser history, which would expose the ECDSA signature.
        let platform: string | null = null
        let address: string | null = null
        let signature: string | null = null

        try {
            const body = await req.json()
            platform = body.platform ?? null
            address = body.address ?? null
            signature = body.signature ?? null
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        if (!platform) {
            return NextResponse.json({ error: 'Missing platform parameter' }, { status: 400 })
        }

        // 1. Try Session Auth
        const sessionOwner = await getSessionAddress()
        let effectiveAddress = null

        // If session exists AND it matches requested address (if any), use it
        if (sessionOwner) {
            if (!address || sessionOwner.toLowerCase() === address.toLowerCase()) {
                effectiveAddress = sessionOwner
            }
        }

        // 2. Fallback: Signature Auth
        if (!effectiveAddress) {
            // If we have no session or it doesn't match, we REQUIRE a signature
            if (!address || !signature) {
                return NextResponse.json({
                    error: 'Unauthorized: Session mismatch or expired. Signature required.',
                    needsSignature: true
                }, { status: 401 })
            }

            const normalizedAddress = address.toLowerCase()
            const cookieStore = await cookies()

            let nonce: string | null = null
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
                const signer = await recoverMessageAddress({ message, signature: signature as `0x${string}` })
                if (signer.toLowerCase() !== normalizedAddress) throw new Error()

                effectiveAddress = normalizedAddress
                markNonceAsUsed(nonce)
                cookieStore.delete('aph_nonce')

                // Also set session so they don't have to sign again soon
                await setSessionAddress(effectiveAddress.slice(0, 42))
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
        const deleted = await prisma.socialConnection.deleteMany({
            where: {
                profileId: profile.id,
                platform: platform
            }
        })

        if (deleted.count === 0) {
            return NextResponse.json({ error: 'No connected account found for this profile.' }, { status: 404 })
        }

        return NextResponse.json({ success: true, deletedCount: deleted.count })
    } catch (error) {
        console.error('[API] Social Unlink Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
