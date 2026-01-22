import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyMessage, recoverMessageAddress } from 'viem'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { address, visibility, signature } = await request.json()

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Geçersiz cüzdan adresi' },
        { status: 400 }
      )
    }

    if (!visibility || !['PUBLIC', 'PRIVATE'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Geçersiz visibility değeri. PUBLIC veya PRIVATE olmalı.' },
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
        { error: 'Nonce bulunamadı. Lütfen önce /api/auth/nonce endpoint\'ini çağırın.' },
        { status: 400 }
      )
    }

    // Build message
    const message = `Update visibility for ${address} to ${visibility}. Nonce: ${nonce}`

    // Verify signature and recover signer
    let signer: string
    try {
      // Recover signer from signature
      signer = await recoverMessageAddress({
        message,
        signature: signature as `0x${string}`,
      })

      // Additional verification - verify that signer signed the message
      const isValid = await verifyMessage({
        address: signer as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      })

      if (!isValid) {
        return NextResponse.json(
          { error: 'Geçersiz imza' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Signature verification error:', error)
      return NextResponse.json(
        { error: 'İmza doğrulanamadı' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()
    const normalizedSigner = signer.toLowerCase()

    // Fetch Profile by address
    const profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil bulunamadı' },
        { status: 404 }
      )
    }

    // Check if profile is CLAIMED
    const isClaimed = profile.status === 'CLAIMED' || profile.ownerAddress || profile.owner
    if (!isClaimed) {
      return NextResponse.json(
        { error: 'Profil henüz talep edilmemiş' },
        { status: 400 }
      )
    }

    // Check ownership
    const ownerAddress = (profile.ownerAddress || profile.owner)?.toLowerCase()
    if (ownerAddress !== normalizedSigner) {
      return NextResponse.json(
        { error: 'Bu profili güncelleme yetkiniz yok' },
        { status: 403 }
      )
    }

    // Update profile visibility
    const updatedProfile = await prisma.profile.update({
      where: { address: normalizedAddress },
      data: {
        visibility,
        isPublic: visibility === 'PUBLIC',
      },
    })

    // Clear nonce cookie after successful update
    cookieStore.delete('aph_nonce')

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedProfile.id,
        address: updatedProfile.address,
        slug: updatedProfile.slug,
        ownerAddress: updatedProfile.ownerAddress,
        status: updatedProfile.status,
        visibility: updatedProfile.visibility,
        claimedAt: updatedProfile.claimedAt,
      },
    })
  } catch (error) {
    console.error('Error updating visibility:', error)
    return NextResponse.json(
      { error: 'Visibility güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
