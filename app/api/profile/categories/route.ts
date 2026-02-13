import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import { cookies } from 'next/headers'
import { verifyMessage, recoverMessageAddress } from 'viem'
import { getNonce, markNonceAsUsed, isValidNonce } from '@/lib/nonce-store'

// Test mode: allow "signed-{nonce}" format for MCP tests
const TEST_MODE = process.env.NODE_ENV === 'test' || process.env.MCP_TEST_MODE === '1'

// Helper to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// GET: Fetch categories for a profile by address
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
      return NextResponse.json({ categories: [] })
    }

    // Get all categories
    const categories = await prisma.linkCategory.findMany({
      where: {
        profileId: profile.id,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        _count: {
          select: { links: true },
        },
      },
    })

    return NextResponse.json({
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        order: cat.order ?? 0,
        isVisible: cat.isVisible ?? true,
        isDefault: cat.isDefault ?? false,
        linkCount: cat._count.links,
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching link categories:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `An error occurred while fetching categories: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// POST: Create or update categories (bulk operation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, categories, signature } = body

    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    if (!signature) {
      return NextResponse.json({ error: 'Signature is required' }, { status: 400 })
    }

    const normalizedAddress = address.toLowerCase()

    // Get nonce from cookie or store
    const cookieStore = await cookies()
    let nonce: string | null = null

    // Test mode: check if signature is "signed-{nonce}" format
    if (TEST_MODE && signature.startsWith('signed-')) {
      const extractedNonce = signature.replace('signed-', '')
      const nonceRecord = getNonce(extractedNonce)
      if (nonceRecord && !nonceRecord.used) {
        nonce = extractedNonce
      }
    }

    // Check cookie for nonce
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

    // Verify signature and recover signer
    let signer: string
    try {
      // Test mode logic
      if (TEST_MODE && (signature === `signed-${nonce}` || signature === nonce)) {
        signer = normalizedAddress
      } else if (TEST_MODE && signature.startsWith('signed-')) {
        const parts = signature.replace('signed-', '').split('-')
        if (parts.length >= 2) {
          const sigAddress = parts[0].toLowerCase()
          const sigNonce = parts.slice(1).join('-')
          if (sigNonce === nonce && sigAddress === normalizedAddress) {
            signer = normalizedAddress
          } else {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
          }
        } else {
          return NextResponse.json({ error: 'Invalid signature format' }, { status: 400 })
        }
      } else {
        // Production logic
        const message = `Update categories for ${normalizedAddress}. Nonce: ${nonce}`
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
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Ownership Check
    if (signer.toLowerCase() !== normalizedAddress) {
      return NextResponse.json({ error: 'Unauthorized: Signer does not match address' }, { status: 403 })
    }

    if (!Array.isArray(categories)) {
      return NextResponse.json({ error: 'Categories must be an array' }, { status: 400 })
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

    // Validate categories
    for (const cat of categories) {
      if (!cat.name || typeof cat.name !== 'string' || cat.name.trim().length === 0) {
        return NextResponse.json({ error: 'Name is required for each category' }, { status: 400 })
      }
    }

    // Get existing default category (if any)
    const existingDefault = await prisma.linkCategory.findFirst({
      where: {
        profileId: profile.id,
        isDefault: true,
      },
    })

    // Ensure at least one default category exists
    let hasDefault = categories.some((cat: any) => cat.isDefault === true)
    if (!hasDefault && !existingDefault) {
      // Create default "General" category if none exists
      const defaultCategory = await prisma.linkCategory.create({
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
      hasDefault = true
    }

    // Delete all existing categories (except default if it's not being updated)
    const categoriesToDelete = await prisma.linkCategory.findMany({
      where: { profileId: profile.id },
    })

    const categoryIdsToKeep = new Set(
      categories
        .filter((cat: any) => cat.id && !cat.isDefault)
        .map((cat: any) => cat.id)
    )

    // Keep default category if it exists and is not in the update list
    if (existingDefault && !categoryIdsToKeep.has(existingDefault.id)) {
      categoryIdsToKeep.add(existingDefault.id)
    }

    await prisma.linkCategory.deleteMany({
      where: {
        profileId: profile.id,
        id: {
          notIn: Array.from(categoryIdsToKeep),
        },
        isDefault: false, // Never delete default categories
      },
    })

    // Create or update categories
    const createdCategories = await Promise.all(
      categories.map(async (cat: any, index: number) => {
        const slug = cat.slug || createSlug(cat.name)

        // Check if category with this slug already exists
        const existing = await prisma.linkCategory.findUnique({
          where: {
            profileId_slug: {
              profileId: profile.id,
              slug,
            },
          },
        })

        if (existing && existing.id !== cat.id) {
          // Slug conflict - append number
          let newSlug = slug
          let counter = 1
          while (
            await prisma.linkCategory.findUnique({
              where: {
                profileId_slug: {
                  profileId: profile.id,
                  slug: newSlug,
                },
              },
            })
          ) {
            newSlug = `${slug}-${counter}`
            counter++
          }
          return prisma.linkCategory.upsert({
            where: { id: cat.id || existing.id },
            create: {
              profileId: profile.id,
              name: cat.name.trim(),
              slug: newSlug,
              description: cat.description?.trim() || null,
              order: cat.order !== undefined ? cat.order : index,
              isVisible: cat.isVisible !== undefined ? cat.isVisible : true,
              isDefault: cat.isDefault === true,
            },
            update: {
              name: cat.name.trim(),
              slug: newSlug,
              description: cat.description?.trim() || null,
              order: cat.order !== undefined ? cat.order : index,
              isVisible: cat.isVisible !== undefined ? cat.isVisible : true,
              isDefault: cat.isDefault === true,
            },
          })
        }

        if (cat.id) {
          // Update existing
          return prisma.linkCategory.update({
            where: { id: cat.id },
            data: {
              name: cat.name.trim(),
              slug,
              description: cat.description?.trim() || null,
              order: cat.order !== undefined ? cat.order : index,
              isVisible: cat.isVisible !== undefined ? cat.isVisible : true,
              isDefault: cat.isDefault === true,
            },
          })
        } else {
          // Create new (idempotent - check if exists first)
          // Double-check slug uniqueness to handle race conditions
          const existingWithSlug = await prisma.linkCategory.findUnique({
            where: {
              profileId_slug: {
                profileId: profile.id,
                slug,
              },
            },
          })

          if (existingWithSlug) {
            // Already exists, return existing
            return existingWithSlug
          }

          try {
            return await prisma.linkCategory.create({
              data: {
                profileId: profile.id,
                name: cat.name.trim(),
                slug,
                description: cat.description?.trim() || null,
                order: cat.order !== undefined ? cat.order : index,
                isVisible: cat.isVisible !== undefined ? cat.isVisible : true,
                isDefault: cat.isDefault === true,
              },
            })
          } catch (error: any) {
            // Handle unique constraint violation (race condition)
            if (error.code === 'P2002') {
              // Another request created it concurrently, fetch and return it
              const concurrentCreated = await prisma.linkCategory.findUnique({
                where: {
                  profileId_slug: {
                    profileId: profile.id,
                    slug,
                  },
                },
              })
              if (concurrentCreated) {
                return concurrentCreated
              }
            }
            throw error
          }
        }
      })
    )

    // Ensure default category exists
    const finalDefault = await prisma.linkCategory.findFirst({
      where: {
        profileId: profile.id,
        isDefault: true,
      },
    })

    if (!finalDefault) {
      // Check if default category exists (idempotent)
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
          await prisma.linkCategory.create({
            data: {
              profileId: profile.id,
              name: 'General',
              slug: 'general',
              description: null,
              order: -1, // Before all others
              isVisible: true,
              isDefault: true,
            },
          })
        } catch (error: any) {
          // Handle unique constraint violation (race condition)
          if (error.code !== 'P2002') {
            throw error
          }
          // Another request created it, that's fine
        }
      }
    }

    // Fetch all categories with link counts
    const allCategories = await prisma.linkCategory.findMany({
      where: {
        profileId: profile.id,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        _count: {
          select: { links: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      categories: allCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        order: cat.order ?? 0,
        isVisible: cat.isVisible ?? true,
        isDefault: cat.isDefault ?? false,
        linkCount: cat._count.links,
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error saving link categories:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `An error occurred while saving categories: ${errorMessage}` },
      { status: 500 }
    )
  }
}
