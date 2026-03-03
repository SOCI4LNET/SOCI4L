import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyMessage, recoverMessageAddress } from 'viem'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import { getNonce, markNonceAsUsed } from '@/lib/nonce-store'

type SocialLinkPlatform = 'x' | 'twitter' | 'instagram' | 'youtube' | 'github' | 'linkedin' | 'website'

interface SocialLink {
  id?: string
  platform?: SocialLinkPlatform
  type?: string // backward compatibility
  url: string
  label?: string
  enabled?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { address, displayName, bio, socialLinks, primaryRole, secondaryRoles, statusMessage, signature } = await request.json()

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Signature required' },
        { status: 400 }
      )
    }

    // Validate displayName
    if (displayName !== null && displayName !== undefined && displayName !== '') {
      const displayNameStr = String(displayName).trim()
      if (displayNameStr.length > 32) {
        return NextResponse.json(
          { error: 'Display name must be 32 characters or less' },
          { status: 400 }
        )
      }
    }

    // Validate bio
    if (bio !== null && bio !== undefined && bio !== '') {
      const bioStr = String(bio).trim()
      if (bioStr.length > 160) {
        return NextResponse.json(
          { error: 'Bio must be 160 characters or less' },
          { status: 400 }
        )
      }
    }

    // Validate statusMessage
    if (statusMessage !== null && statusMessage !== undefined && statusMessage !== '') {
      const statusStr = String(statusMessage).trim()
      if (statusStr.length > 60) {
        return NextResponse.json(
          { error: 'Status message must be 60 characters or less' },
          { status: 400 }
        )
      }
    }

    // Validate roles
    if (secondaryRoles !== null && secondaryRoles !== undefined) {
      if (!Array.isArray(secondaryRoles)) {
        return NextResponse.json(
          { error: 'Secondary roles must be an array' },
          { status: 400 }
        )
      }
      if (secondaryRoles.length > 2) {
        return NextResponse.json(
          { error: 'Maximum 2 secondary roles allowed' },
          { status: 400 }
        )
      }
    }

    // Validate socialLinks
    if (socialLinks !== null && socialLinks !== undefined) {
      if (!Array.isArray(socialLinks)) {
        return NextResponse.json(
          { error: 'Social links must be an array' },
          { status: 400 }
        )
      }

      if (socialLinks.length > 8) {
        return NextResponse.json(
          { error: 'Maximum 8 social links allowed' },
          { status: 400 }
        )
      }

      const validPlatforms: SocialLinkPlatform[] = ['x', 'twitter', 'instagram', 'youtube', 'github', 'linkedin', 'website']

      for (const link of socialLinks) {
        const platform = link.platform || link.type
        if (!platform || !validPlatforms.includes(platform as SocialLinkPlatform)) {
          return NextResponse.json(
            { error: `Invalid social link platform. Must be one of: ${validPlatforms.join(', ')}` },
            { status: 400 }
          )
        }

        if (!link.url || typeof link.url !== 'string') {
          return NextResponse.json(
            { error: 'Each social link must have a URL' },
            { status: 400 }
          )
        }

        // Validate URL format - must be http/https
        if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
          return NextResponse.json(
            { error: 'URLs must start with http:// or https://' },
            { status: 400 }
          )
        }
      }
    }

    // Read nonce from cookie
    const cookieStore = await cookies()
    const nonce = cookieStore.get('aph_nonce')?.value

    if (!nonce) {
      return NextResponse.json(
        { error: 'Nonce not found. Please call /api/auth/nonce first.' },
        { status: 400 }
      )
    }

    const nonceRecord = getNonce(nonce)
    if (!nonceRecord || nonceRecord.used) {
      return NextResponse.json(
        { error: 'Nonce expired or already used. Please request a new nonce.' },
        { status: 400 }
      )
    }

    // Build message
    const message = `Update social profile for ${address}. Nonce: ${nonce}`

    // Verify signature and recover signer
    let signer: string
    try {
      signer = await recoverMessageAddress({
        message,
        signature: signature as `0x${string}`,
      })

      const isValid = await verifyMessage({
        address: signer as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      })

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Signature verification error:', error)
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()
    const normalizedSigner = signer.toLowerCase()

    if (nonceRecord.address && nonceRecord.address !== normalizedSigner) {
      return NextResponse.json(
        { error: 'Nonce does not match wallet address.' },
        { status: 400 }
      )
    }

    // Fetch profile by normalized address; fallback to case-insensitive lookup
    // for legacy records that may have mixed-case addresses.
    let profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    if (!profile) {
      profile = await prisma.profile.findFirst({
        where: {
          address: {
            equals: normalizedAddress,
            mode: 'insensitive',
          },
        },
      })
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please claim your profile first.' },
        { status: 404 }
      )
    }

    // Check if profile is CLAIMED
    const isClaimed = profile.status === 'CLAIMED' || profile.ownerAddress || profile.owner
    if (!isClaimed) {
      return NextResponse.json(
        { error: 'Profile not claimed yet. Please claim your profile first.' },
        { status: 400 }
      )
    }

    // Check ownership
    const ownerAddress = (profile.ownerAddress || profile.owner)?.toLowerCase()
    if (ownerAddress !== normalizedSigner) {
      return NextResponse.json(
        { error: 'You do not have permission to update this profile' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: {
      displayName?: string | null
      bio?: string | null
      socialLinks?: string | null
      primaryRole?: string | null
      secondaryRoles?: string[]
      statusMessage?: string | null
    } = {}

    if (displayName !== undefined) {
      updateData.displayName = displayName && displayName.trim() !== '' ? displayName.trim() : null
    }

    if (bio !== undefined) {
      updateData.bio = bio && bio.trim() !== '' ? bio.trim() : null
    }

    if (primaryRole !== undefined) {
      updateData.primaryRole = primaryRole && primaryRole.trim() !== '' ? primaryRole.trim() : null
    }

    if (statusMessage !== undefined) {
      updateData.statusMessage = statusMessage && statusMessage.trim() !== '' ? statusMessage.trim() : null
    }

    if (secondaryRoles !== undefined && secondaryRoles !== null) {
      updateData.secondaryRoles = secondaryRoles
    }

    if (socialLinks !== undefined) {
      // Normalize social links: ensure id and platform field
      const normalizedLinks = socialLinks.map((link: any) => ({
        id: link.id || crypto.randomUUID(),
        platform: link.platform || link.type || 'website',
        url: link.url,
        label: link.label || undefined,
        enabled: link.enabled !== false,
      }))
      updateData.socialLinks = normalizedLinks.length > 0 ? JSON.stringify(normalizedLinks) : null
    }

    // Update profile
    if (!markNonceAsUsed(nonce)) {
      return NextResponse.json(
        { error: 'Nonce already used' },
        { status: 400 }
      )
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: profile.id },
      data: updateData,
    })

    // Clear nonce cookie after successful update
    cookieStore.delete('aph_nonce')

    // Parse socialLinks for response
    let parsedSocialLinks: SocialLink[] | null = null
    if (updatedProfile.socialLinks) {
      try {
        const parsed = JSON.parse(updatedProfile.socialLinks)
        parsedSocialLinks = Array.isArray(parsed)
          ? parsed.map((link: any) => ({
            id: link.id || crypto.randomUUID(),
            platform: link.platform || link.type || 'website',
            url: link.url,
            label: link.label,
            enabled: link.enabled !== false,
          }))
          : null
      } catch {
        parsedSocialLinks = null
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedProfile.id,
        address: updatedProfile.address,
        slug: updatedProfile.slug,
        status: updatedProfile.status,
        visibility: updatedProfile.visibility,
        ownerAddress: updatedProfile.ownerAddress,
        claimedAt: updatedProfile.claimedAt,
        displayName: updatedProfile.displayName,
        bio: updatedProfile.bio,
        primaryRole: updatedProfile.primaryRole,
        secondaryRoles: updatedProfile.secondaryRoles,
        statusMessage: updatedProfile.statusMessage,
        socialLinks: parsedSocialLinks,
      },
    })
  } catch (error) {
    console.error('Error updating social profile:', error)
    return NextResponse.json(
      { error: `Failed to update social profile: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
