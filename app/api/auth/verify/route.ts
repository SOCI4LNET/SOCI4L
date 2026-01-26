import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyMessage } from 'viem'
import { isValidAddress } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { address, signature } = await request.json()

    if (!address || !isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Signature is required' },
        { status: 400 }
      )
    }

    // Read nonce from cookie
    const cookieStore = await cookies()
    const nonce = cookieStore.get('aph_nonce')?.value

    if (!nonce) {
      return NextResponse.json(
        { error: 'Nonce not found. Please call /api/auth/nonce endpoint first.' },
        { status: 400 }
      )
    }

    // Build message
    const message = `Follow auth for Avalanche Profile Hub. Address: ${address}. Nonce: ${nonce}`

    // Verify signature
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

    const normalizedAddress = address.toLowerCase()

    // Create session cookie with verified wallet address
    cookieStore.set('aph_session', normalizedAddress, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Clear nonce after successful verification
    cookieStore.delete('aph_nonce')

    return NextResponse.json({ 
      success: true,
      address: normalizedAddress 
    })
  } catch (error) {
    console.error('Error verifying auth:', error)
    return NextResponse.json(
      { error: 'An error occurred during verification' },
      { status: 500 }
    )
  }
}
