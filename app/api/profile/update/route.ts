import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { address, slug, isPublic, showcase } = await request.json()

    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    const normalizedAddress = address.toLowerCase()

    // Check if profile exists and is owned by this address
    const profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    if (!profile || profile.owner?.toLowerCase() !== normalizedAddress) {
      return NextResponse.json(
        { error: 'You do not have permission to update this profile' },
        { status: 403 }
      )
    }

    // Update profile with transaction to ensure slug uniqueness
    const slugLower = slug ? slug.toLowerCase().trim() : null
    
    const updated = await prisma.$transaction(async (tx) => {
      // Check slug uniqueness if provided (within transaction)
      if (slugLower) {
        const existing = await tx.profile.findFirst({
          where: {
            slug: slugLower,
            NOT: { address: normalizedAddress },
          },
        })

        if (existing) {
          throw new Error('This slug is already in use')
        }
      }

      // Update profile with unique constraint error handling
      try {
        return await tx.profile.update({
          where: { address: normalizedAddress },
          data: {
            slug: slugLower,
            isPublic: isPublic ?? false,
          },
        })
      } catch (error: any) {
        // Handle unique constraint violation
        if (error.code === 'P2002' || error.message?.includes('UNIQUE constraint') || error.message?.includes('unique')) {
          throw new Error('This slug is already in use')
        }
        throw error
      }
    })

    // Update showcase items
    if (Array.isArray(showcase)) {
      // Delete existing showcase items
      await prisma.showcaseItem.deleteMany({
        where: { profileId: updated.id },
      })

      // Create new showcase items
      if (showcase.length > 0) {
        await prisma.showcaseItem.createMany({
          data: showcase.map((item: { contractAddress: string; tokenId: string }) => ({
            profileId: updated.id,
            contractAddress: item.contractAddress.toLowerCase(),
            tokenId: item.tokenId,
          })),
        })
      }
    }

    const profileWithShowcase = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
      include: { showcase: true },
    })

    return NextResponse.json({ success: true, profile: profileWithShowcase })
  } catch (error: any) {
    console.error('Error updating profile:', error)
    
    // Handle specific error cases
    if (error.message === 'This slug is already in use') {
      return NextResponse.json(
        { error: 'This slug is already in use' },
        { status: 400 }
      )
    }
    
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002' || error.message?.includes('UNIQUE constraint') || error.message?.includes('unique')) {
      return NextResponse.json(
        { error: 'This slug is already in use' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'An error occurred while updating profile' },
      { status: 500 }
    )
  }
}
