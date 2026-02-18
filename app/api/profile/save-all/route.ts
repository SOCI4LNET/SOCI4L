import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import {
    normalizeLayoutConfig,
    type ProfileLayoutConfig,
} from '@/lib/profile-layout'
import {
    normalizeAppearanceConfig,
    type ProfileAppearanceConfig,
} from '@/lib/profile-appearance'
import { cookies } from 'next/headers'
import { verifyMessage, recoverMessageAddress } from 'viem'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { address, layout, appearance, profile, signature } = body

        if (!address || !isValidAddress(address)) {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
        }

        if (!signature) {
            return NextResponse.json({ error: 'Signature required' }, { status: 400 })
        }

        const normalizedAddress = address.toLowerCase()

        // 1. Verify Signature
        const cookieStore = await cookies()
        const nonce = cookieStore.get('aph_nonce')?.value

        if (!nonce) {
            return NextResponse.json(
                { error: 'Nonce not found. Please call /api/auth/nonce first.' },
                { status: 400 }
            )
        }

        const message = `Save all profile changes for ${address}. Nonce: ${nonce}`

        try {
            const signer = await recoverMessageAddress({
                message,
                signature: signature as `0x${string}`,
            })

            const isValid = await verifyMessage({
                address: signer as `0x${string}`,
                message,
                signature: signature as `0x${string}`,
            })

            if (!isValid || signer.toLowerCase() !== normalizedAddress) {
                // More strict check: signer must be the owner of the profile.
                // For simplicity and matching existing logic, we'll check if it's the address itself
                // or the owner of the profile if it exists.

                const existingProfile = await prisma.profile.findUnique({
                    where: { address: normalizedAddress },
                })

                const effectiveOwner = existingProfile?.ownerAddress
                    ? existingProfile.ownerAddress.toLowerCase()
                    : normalizedAddress

                if (signer.toLowerCase() !== effectiveOwner) {
                    return NextResponse.json({ error: 'Invalid signature or permission denied' }, { status: 401 })
                }
            }
        } catch (error) {
            console.error('Signature verification error:', error)
            return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 })
        }

        // 2. Prepare Data
        const updates: any = {}

        // Layout
        if (layout) {
            updates.layoutConfig = JSON.stringify(normalizeLayoutConfig(layout))
        }

        // Appearance
        if (appearance) {
            updates.appearanceConfig = JSON.stringify(normalizeAppearanceConfig(appearance))
        }

        // Profile Info
        if (profile) {
            if (profile.displayName !== undefined) updates.displayName = profile.displayName?.trim() || null
            if (profile.bio !== undefined) updates.bio = profile.bio?.trim() || null
            if (profile.primaryRole !== undefined) updates.primaryRole = profile.primaryRole?.trim() || null
            if (profile.secondaryRoles !== undefined) updates.secondaryRoles = profile.secondaryRoles
            if (profile.statusMessage !== undefined) updates.statusMessage = profile.statusMessage?.trim() || null
        }

        // 3. Update Database
        const updatedProfile = await prisma.profile.upsert({
            where: { address: normalizedAddress },
            create: {
                address: normalizedAddress,
                status: 'UNCLAIMED',
                visibility: 'PUBLIC',
                ...updates,
            },
            update: updates,
        })

        // 4. Cleanup
        cookieStore.delete('aph_nonce')

        return NextResponse.json({
            success: true,
            profile: updatedProfile,
        })
    } catch (error) {
        console.error('Error saving all profile changes:', error)
        return NextResponse.json(
            { error: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        )
    }
}
