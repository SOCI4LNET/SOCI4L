import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')

  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Geçersiz cüzdan adresi' }, { status: 400 })
  }

  try {
    const normalizedAddress = address.toLowerCase()
    
    const profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
      include: { showcase: true },
    })

    // Return defaults if profile not found
    if (!profile) {
      return NextResponse.json({
        profile: {
          address: normalizedAddress,
          displayName: null,
          bio: null,
          socialLinks: [],
          updatedAt: Date.now(),
        },
      })
    }

    // Parse socialLinks if it's a string
    let parsedSocialLinks: Array<{ id?: string; platform: string; url: string; label?: string }> = []
    if (profile.socialLinks) {
      try {
        const parsed = JSON.parse(profile.socialLinks)
        // Ensure each link has an id
        parsedSocialLinks = Array.isArray(parsed) 
          ? parsed.map((link: any) => ({
              ...link,
              id: link.id || crypto.randomUUID(),
              platform: link.platform || link.type || 'website',
            }))
          : []
      } catch {
        parsedSocialLinks = []
      }
    }

    return NextResponse.json({
      profile: {
        address: profile.address,
        displayName: profile.displayName || null,
        bio: profile.bio || null,
        socialLinks: parsedSocialLinks,
        updatedAt: profile.updatedAt.getTime(),
      },
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Profil alınırken bir hata oluştu' },
      { status: 500 }
    )
  }
}
