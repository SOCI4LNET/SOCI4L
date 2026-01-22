import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyMessage } from 'viem'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { address, signature } = await request.json()

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Geçersiz cüzdan adresi' },
        { status: 400 }
      )
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'İmza gereklidir' },
        { status: 400 }
      )
    }

    // Read nonce from cookie
    const cookieStore = await cookies()
    const nonce = cookieStore.get('aph_nonce')?.value

    if (!nonce) {
      return NextResponse.json(
        { error: 'Nonce bulunamadı. Lütfen tekrar deneyin.' },
        { status: 400 }
      )
    }

    // Build message
    const message = `Claim Avalanche Profile Hub for ${address}. Nonce: ${nonce}`

    // Verify signature
    try {
      const isValid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      })

      if (!isValid) {
        return NextResponse.json(
          { error: 'Geçersiz imza' },
          { status: 400 }
        )
      }

      // Check if signer equals address
      // verifyMessage already checks this, but we can add extra validation if needed
    } catch (error) {
      console.error('Signature verification error:', error)
      return NextResponse.json(
        { error: 'İmza doğrulanamadı' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()
    
    // Extract signer from signature verification
    // verifyMessage already verified that the signature matches the address
    // So the signer is the address itself
    const signerAddress = normalizedAddress

    // Check if profile already exists
    const existing = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    // Idempotency check: If profile exists and is CLAIMED by the same signer
    if (existing && existing.status === 'CLAIMED' && existing.ownerAddress) {
      const existingOwnerLower = existing.ownerAddress.toLowerCase()
      if (existingOwnerLower === signerAddress) {
        // Already claimed by this signer - return success with alreadyClaimed flag
        return NextResponse.json({
          success: true,
          alreadyClaimed: true,
          profile: {
            id: existing.id,
            address: existing.address,
            slug: existing.slug,
            ownerAddress: existing.ownerAddress,
            status: existing.status,
            visibility: existing.visibility,
            claimedAt: existing.claimedAt,
          },
        })
      } else {
        // Claimed by someone else
        return NextResponse.json(
          { error: 'Bu profil başka bir cüzdan tarafından talep edilmiş' },
          { status: 403 }
        )
      }
    }

    // Upsert Profile - normalize both address and ownerAddress to lowercase
    const profile = await prisma.profile.upsert({
      where: { address: normalizedAddress },
      update: {
        ownerAddress: signerAddress.toLowerCase(), // Ensure lowercase
        owner: signerAddress.toLowerCase(), // backward compatibility
        status: 'CLAIMED',
        visibility: 'PUBLIC',
        isPublic: true,
        claimedAt: new Date(),
      },
      create: {
        address: normalizedAddress,
        ownerAddress: signerAddress.toLowerCase(), // Ensure lowercase
        owner: signerAddress.toLowerCase(), // backward compatibility
        status: 'CLAIMED',
        visibility: 'PUBLIC',
        isPublic: true,
        claimedAt: new Date(),
      },
    })

    // Clear nonce cookie after successful claim
    cookieStore.delete('aph_nonce')

    return NextResponse.json({
      success: true,
      alreadyClaimed: false,
      profile: {
        id: profile.id,
        address: profile.address,
        slug: profile.slug,
        ownerAddress: profile.ownerAddress,
        status: profile.status,
        visibility: profile.visibility,
        claimedAt: profile.claimedAt,
      },
    })
  } catch (error) {
    console.error('Error claiming profile:', error)
    return NextResponse.json(
      { error: 'Profil talep edilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
