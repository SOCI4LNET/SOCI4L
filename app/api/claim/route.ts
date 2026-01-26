import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'
import { verifyMessage } from 'viem'

export async function POST(request: NextRequest) {
  try {
    const { address, nonce, signature } = await request.json()

    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    if (!nonce || !signature) {
      return NextResponse.json({ error: 'Nonce and signature are required' }, { status: 400 })
    }

    const normalizedAddress = address.toLowerCase()

    // Check if profile already claimed
    const existing = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    if (existing && existing.owner) {
      return NextResponse.json(
        { error: 'This profile has already been claimed' },
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
          { error: 'Invalid signature' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Signature verification error:', error)
      return NextResponse.json(
        { error: 'Signature verification failed' },
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
      { error: 'An error occurred while claiming profile' },
      { status: 500 }
    )
  }
}
