import { NextRequest, NextResponse } from 'next/server'
import { getWalletData } from '@/lib/avalanche'
import { getProfileByAddress, getProfileBySlug } from '@/lib/db'
import { isValidAddress } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import {
  getDefaultProfileLayout,
  normalizeLayoutConfig,
  type ProfileLayoutConfig,
} from '@/lib/profile-layout'
import {
  getDefaultAppearanceConfig,
  normalizeAppearanceConfig,
  type ProfileAppearanceConfig,
} from '@/lib/profile-appearance'

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

  // Fetch full profile with layoutConfig and appearanceConfig from database
  // getProfileByAddress doesn't return these fields, so we need to fetch them separately
  const fullProfile = await prisma.profile.findUnique({
    where: { address: resolvedAddress.toLowerCase() },
    select: {
      id: true,
      layoutConfig: true,
      appearanceConfig: true,
    },
  })

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
    let walletData
    try {
      walletData = await getWalletData(resolvedAddress)
    } catch (walletError) {
      console.error('[Wallet API] Error fetching wallet data:', walletError)
      // Return a more descriptive error
      const walletErrorMessage = walletError instanceof Error 
        ? walletError.message 
        : 'Failed to fetch wallet data from blockchain'
      return NextResponse.json(
        { 
          error: 'Cüzdan verileri alınırken bir hata oluştu', 
          details: walletErrorMessage,
          type: 'WALLET_FETCH_ERROR'
        },
        { status: 500 }
      )
    }

    // Get profile links (only enabled, sorted by order)
    let profileLinks: Array<{
      id: string
      title: string
      url: string
      enabled: boolean
      order: number
      createdAt: string
      updatedAt: string
    }> = []
    
    // Get layout config
    let layoutConfig: ProfileLayoutConfig = getDefaultProfileLayout()
    
    if (fullProfile || profile) {
      const profileId = fullProfile?.id || profile?.id
      
      if (profileId) {
        const links = await prisma.profileLink.findMany({
          where: {
            profileId: profileId,
            enabled: true,
          },
          orderBy: [
            { order: 'asc' },
            { createdAt: 'asc' }, // Fallback to createdAt if order is same
          ],
        })
        
        profileLinks = links.map((link) => ({
          id: link.id,
          title: link.title,
          url: link.url,
          enabled: link.enabled,
          order: link.order,
          createdAt: link.createdAt.toISOString(),
          updatedAt: link.updatedAt.toISOString(),
        }))
      }

      // Parse layout config from fullProfile (which has layoutConfig field)
      const layoutConfigRaw = fullProfile?.layoutConfig || null
      if (layoutConfigRaw) {
        try {
          const parsed = JSON.parse(layoutConfigRaw) as ProfileLayoutConfig
          if (parsed && Array.isArray(parsed.blocks)) {
            layoutConfig = normalizeLayoutConfig(parsed)
            console.log('[Wallet API] Layout config loaded:', layoutConfig)
          } else {
            console.warn('[Wallet API] Invalid layout config structure:', parsed)
          }
        } catch (error) {
          console.error('[Wallet API] Failed to parse layout config:', error)
          // Use default if parsing fails
        }
      } else {
        console.warn('[Wallet API] No layoutConfig in profile, using default')
      }
    } else {
      console.warn('[Wallet API] No profile found, using default layout config')
    }

    // Get appearance config from fullProfile (which has appearanceConfig field)
    let appearanceConfig: ProfileAppearanceConfig = getDefaultAppearanceConfig()
    const appearanceConfigRaw = fullProfile?.appearanceConfig || null
    if (appearanceConfigRaw) {
      try {
        const parsed = JSON.parse(appearanceConfigRaw) as ProfileAppearanceConfig
        appearanceConfig = normalizeAppearanceConfig(parsed)
        console.log('[Wallet API] Appearance config loaded:', appearanceConfig)
      } catch (error) {
        console.error('[Wallet API] Failed to parse appearance config:', error)
        // Use default if parsing fails
      }
    } else {
      console.warn('[Wallet API] No appearanceConfig in profile, using default')
    }

    const responseData = {
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
      links: profileLinks,
      layout: layoutConfig,
      appearance: appearanceConfig,
    }
    
    console.log('[Wallet API] Returning response with layout:', layoutConfig)
    console.log('[Wallet API] Returning response with appearance:', appearanceConfig)
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching wallet data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Cüzdan verileri alınırken bir hata oluştu', details: errorMessage },
      { status: 500 }
    )
  }
}
