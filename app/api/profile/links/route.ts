import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyMessage, recoverMessageAddress } from 'viem'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import { getNonce, markNonceAsUsed, isValidNonce } from '@/lib/nonce-store'


// GET: Fetch links for a profile by address
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')

  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
  }

  try {
    const normalizedAddress = address.toLowerCase()

    // Find profile by address
    const profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    if (!profile) {
      // Return empty array if profile doesn't exist (not an error)
      return NextResponse.json({ links: [] })
    }

    // Get all links (not just enabled) for dashboard management
    const links = await prisma.profileLink.findMany({
      where: {
        profileId: profile.id,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json({
      links: links.map((link) => ({
        id: link.id,
        title: link.title || '',
        url: link.url,
        enabled: link.enabled ?? true,
        order: link.order ?? 0,
        categoryId: link.categoryId || null,
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching profile links:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching links' },
      { status: 500 }
    )
  }
}

// POST: Create or update links (bulk operation) - NOW SECURED
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, links, signature, nonce: bodyNonce } = body

    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    if (!signature) {
      return NextResponse.json({ error: 'Signature is required' }, { status: 400 })
    }

    const normalizedAddress = address.toLowerCase()

    // Get nonce from body or cookie
    const cookieStore = await cookies()
    let nonce: string | null = bodyNonce || null

    if (!nonce) {
      const cookieNonce = cookieStore.get('aph_nonce')?.value
      if (cookieNonce) {
        const nonceRecord = getNonce(cookieNonce)
        if (nonceRecord && !nonceRecord.used) {
          nonce = cookieNonce
        }
      }
    }

    if (!nonce) {
      return NextResponse.json(
        { error: 'Nonce not found. Please call /api/auth/nonce endpoint first.' },
        { status: 400 }
      )
    }

    // Replay protection: check if nonce is already used
    if (!isValidNonce(nonce)) {
      return NextResponse.json(
        { error: 'Nonce has already been used' },
        { status: 400 }
      )
    }

    // Verify signature and recover signer (ECDSA)
    let signer: string
    try {
      const message = `Update links for ${normalizedAddress}. Nonce: ${nonce}`
      signer = await recoverMessageAddress({
        message,
        signature: signature as `0x${string}`,
      })

      const isValid = await verifyMessage({
        address: signer as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      })

      if (!isValid) throw new Error('Invalid signature')
    } catch (error) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Ownership Check
    if (signer.toLowerCase() !== normalizedAddress) {
      return NextResponse.json({ error: 'Unauthorized: Signer does not match address' }, { status: 403 })
    }

    if (!Array.isArray(links)) {
      return NextResponse.json({ error: 'Links must be an array' }, { status: 400 })
    }

    // normalizedAddress is already declared above

    // Find or create profile
    let profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    if (!profile) {
      // Create profile if it doesn't exist (idempotent - handle race conditions)
      try {
        profile = await prisma.profile.create({
          data: {
            address: normalizedAddress,
            status: 'UNCLAIMED',
            visibility: 'PUBLIC',
          },
        })
      } catch (error: any) {
        // Handle unique constraint violation (race condition)
        if (error.code === 'P2002') {
          // Another request created it concurrently, fetch it
          profile = await prisma.profile.findUnique({
            where: { address: normalizedAddress },
          })
          if (!profile) {
            throw error // Still doesn't exist, rethrow
          }
        } else {
          throw error
        }
      }
    }

    // Ensure default category exists
    let defaultCategory = await prisma.linkCategory.findFirst({
      where: {
        profileId: profile.id,
        isDefault: true,
      },
    })

    if (!defaultCategory) {
      // Check again to handle race conditions
      const checkDefault = await prisma.linkCategory.findUnique({
        where: {
          profileId_slug: {
            profileId: profile.id,
            slug: 'general',
          },
        },
      })

      if (!checkDefault) {
        try {
          defaultCategory = await prisma.linkCategory.create({
            data: {
              profileId: profile.id,
              name: 'General',
              slug: 'general',
              description: null,
              order: 0,
              isVisible: true,
              isDefault: true,
            },
          })
        } catch (error: any) {
          // Handle unique constraint violation (race condition)
          if (error.code === 'P2002') {
            // Another request created it, fetch it
            defaultCategory = await prisma.linkCategory.findUnique({
              where: {
                profileId_slug: {
                  profileId: profile.id,
                  slug: 'general',
                },
              },
            })
          } else {
            throw error
          }
        }
      } else {
        defaultCategory = checkDefault
      }
    }

    if (!defaultCategory) {
      throw new Error('Failed to retrieve or create default category')
    }

    // Validate links
    for (const link of links) {
      if (!link.url || typeof link.url !== 'string') {
        return NextResponse.json({ error: 'URL is required for each link' }, { status: 400 })
      }
      try {
        const parsed = new URL(link.url)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return NextResponse.json({ error: 'URL must use http or https protocol' }, { status: 400 })
        }
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
      }
    }

    // Get existing link IDs to track which ones to delete
    const existingLinks = await prisma.profileLink.findMany({
      where: { profileId: profile.id },
      select: { id: true },
    })
    const existingLinkIds = new Set(existingLinks.map(l => l.id))

    // Track which IDs are in the new links array (to determine deletions)
    const incomingLinkIds = new Set(
      links.filter((l: any) => l.id).map((l: any) => l.id)
    )

    // Delete links that are no longer in the incoming array
    const linksToDelete = [...existingLinkIds].filter(id => !incomingLinkIds.has(id))
    if (linksToDelete.length > 0) {
      await prisma.profileLink.deleteMany({
        where: {
          profileId: profile.id,
          id: { in: linksToDelete },
        },
      })
    }

    // Upsert links - update existing (preserve ID) or create new
    const savedLinks = await Promise.all(
      links.map(async (link: any, index: number) => {
        // If categoryId is provided, verify it exists and belongs to this profile
        let categoryId = link.categoryId || null
        if (categoryId) {
          const category = await prisma.linkCategory.findFirst({
            where: {
              id: categoryId,
              profileId: profile.id,
            },
          })
          if (!category) {
            // Invalid category, use default
            categoryId = defaultCategory.id
          }
        } else {
          // No category specified, use default
          categoryId = defaultCategory.id
        }

        // If link has an existing ID that belongs to this profile, update it
        // Otherwise, create a new one
        if (link.id && existingLinkIds.has(link.id)) {
          // Update existing link (preserves ID and analytics)
          return prisma.profileLink.update({
            where: { id: link.id },
            data: {
              categoryId,
              title: link.title || '',
              url: link.url,
              enabled: link.enabled !== undefined ? link.enabled : true,
              order: link.order !== undefined ? link.order : index,
            },
          })
        } else {
          // Create new link
          return prisma.profileLink.create({
            data: {
              profileId: profile.id,
              categoryId,
              title: link.title || '',
              url: link.url,
              enabled: link.enabled !== undefined ? link.enabled : true,
              order: link.order !== undefined ? link.order : index,
            },
          })
        }
      })
    )

    // Replace createdLinks reference for response
    const createdLinks = savedLinks

    return NextResponse.json({
      success: true,
      links: createdLinks.map((link) => ({
        id: link.id,
        title: link.title || '',
        url: link.url,
        enabled: link.enabled ?? true,
        order: link.order ?? 0,
        categoryId: link.categoryId || null,
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error saving profile links:', error)
    return NextResponse.json(
      { error: 'An error occurred while saving links' },
      { status: 500 }
    )
  }
}
