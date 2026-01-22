import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { address, slug, isPublic, showcase } = await request.json()

    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Geçersiz cüzdan adresi' }, { status: 400 })
    }

    const normalizedAddress = address.toLowerCase()

    // Check if profile exists and is owned by this address
    const profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    if (!profile || profile.owner?.toLowerCase() !== normalizedAddress) {
      return NextResponse.json(
        { error: 'Bu profili güncelleme yetkiniz yok' },
        { status: 403 }
      )
    }

    // Check slug uniqueness if provided
    if (slug) {
      const slugLower = slug.toLowerCase().trim()
      const existing = await prisma.profile.findFirst({
        where: {
          slug: slugLower,
          NOT: { address: normalizedAddress },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Bu slug zaten kullanılıyor' },
          { status: 400 }
        )
      }
    }

    // Update profile
    const updated = await prisma.profile.update({
      where: { address: normalizedAddress },
      data: {
        slug: slug ? slug.toLowerCase().trim() : null,
        isPublic: isPublic ?? false,
      },
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
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Profil güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
