import { NextRequest, NextResponse } from 'next/server'
import { getWalletData } from '@/lib/avalanche'
import { getProfileByAddress, getProfileBySlug } from '@/lib/db'
import { isValidAddress } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')
  const slug = searchParams.get('slug')

  let resolvedAddress: string | null = null
  let profile = null

  // If slug is provided, resolve it to address
  if (slug) {
    profile = await getProfileBySlug(slug)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    resolvedAddress = profile.address
  } else if (address) {
    if (!isValidAddress(address)) {
      return NextResponse.json({ error: 'Geçersiz cüzdan adresi' }, { status: 400 })
    }
    // Normalize address to lowercase for consistent DB lookups
    const normalizedAddress = address.toLowerCase()
    resolvedAddress = normalizedAddress
    profile = await getProfileByAddress(normalizedAddress)
  } else {
    return NextResponse.json({ error: 'Address or slug is required' }, { status: 400 })
  }

  if (!resolvedAddress) {
    return NextResponse.json({ error: 'Could not resolve address' }, { status: 400 })
  }

  try {
    // Determine profile status for display
    let profileStatus: 'UNCLAIMED' | 'CLAIMED+PUBLIC' | 'CLAIMED+PRIVATE' = 'UNCLAIMED'
    if (profile) {
      // Check if profile is claimed (either by status or ownerAddress)
      const isClaimed = profile.status === 'CLAIMED' || profile.ownerAddress || profile.owner
      if (isClaimed) {
        profileStatus = profile.visibility === 'PUBLIC' ? 'CLAIMED+PUBLIC' : 'CLAIMED+PRIVATE'
      } else {
        profileStatus = 'UNCLAIMED'
      }
    } else {
      // No profile exists, assume UNCLAIMED + PUBLIC
      profileStatus = 'UNCLAIMED'
    }

    // Get wallet data
    const walletData = await getWalletData(resolvedAddress)

    return NextResponse.json({
      walletData,
      profileStatus,
      profile: profile ? {
        id: profile.id,
        address: profile.address,
        slug: profile.slug,
        status: profile.status,
        visibility: profile.visibility,
        owner: profile.owner,
        ownerAddress: profile.ownerAddress,
        claimedAt: profile.claimedAt,
        displayName: profile.displayName,
        bio: profile.bio,
        socialLinks: profile.socialLinks ? (() => {
          try {
            return JSON.parse(profile.socialLinks)
          } catch {
            return null
          }
        })() : null,
      } : null,
    })
  } catch (error) {
    console.error('Error fetching wallet data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Cüzdan verileri alınırken bir hata oluştu', details: errorMessage },
      { status: 500 }
    )
  }
}
