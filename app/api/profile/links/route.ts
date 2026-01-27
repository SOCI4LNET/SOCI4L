import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `An error occurred while fetching links: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// POST: Create or update links (bulk operation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, links } = body

    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    if (!Array.isArray(links)) {
      return NextResponse.json({ error: 'Links must be an array' }, { status: 400 })
    }

    const normalizedAddress = address.toLowerCase()

    // Find or create profile
    let profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    if (!profile) {
      // Create profile if it doesn't exist
      profile = await prisma.profile.create({
        data: {
          address: normalizedAddress,
          status: 'UNCLAIMED',
          visibility: 'PUBLIC',
        },
      })
    }

    // Ensure default category exists
    let defaultCategory = await prisma.linkCategory.findFirst({
      where: {
        profileId: profile.id,
        isDefault: true,
      },
    })

    if (!defaultCategory) {
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
    }

    // Validate links
    for (const link of links) {
      if (!link.url || typeof link.url !== 'string') {
        return NextResponse.json({ error: 'URL is required for each link' }, { status: 400 })
      }
      if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
        return NextResponse.json({ error: 'URL must start with http:// or https://' }, { status: 400 })
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `An error occurred while saving links: ${errorMessage}` },
      { status: 500 }
    )
  }
}
