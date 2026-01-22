import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import { verifyMessage } from 'viem'

export async function POST(request: NextRequest) {
  try {
    const { address, nonce, signature } = await request.json()

    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Geçersiz cüzdan adresi' }, { status: 400 })
    }

    if (!nonce || !signature) {
      return NextResponse.json({ error: 'Nonce ve imza gereklidir' }, { status: 400 })
    }

    const normalizedAddress = address.toLowerCase()

    // Check if profile already claimed
    const existing = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    if (existing && existing.owner) {
      return NextResponse.json(
        { error: 'Bu profil zaten talep edilmiş' },
        { status: 400 }
      )
    }

    // Verify signature
    const message = `Claim profile for ${address}\n\nNonce: ${nonce}`
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
    } catch (error) {
      console.error('Signature verification error:', error)
      return NextResponse.json(
        { error: 'İmza doğrulanamadı' },
        { status: 400 }
      )
    }

    // Create or update profile
    const profile = await prisma.profile.upsert({
      where: { address: normalizedAddress },
      update: {
        owner: normalizedAddress,
        isPublic: false,
        claimedAt: new Date(),
      },
      create: {
        address: normalizedAddress,
        owner: normalizedAddress,
        isPublic: false,
        claimedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('Error claiming profile:', error)
    return NextResponse.json(
      { error: 'Profil talep edilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
