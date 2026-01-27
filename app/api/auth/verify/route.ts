import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyMessage } from 'viem'
import { isValidAddress } from '@/lib/utils'
import { getNonce, markNonceAsUsed, isValidNonce } from '@/lib/nonce-store'

// Test mode: allow "signed-{nonce}" format for MCP tests
const TEST_MODE = process.env.NODE_ENV === 'test' || process.env.MCP_TEST_MODE === '1'

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

    const normalizedAddress = address.toLowerCase()

    // Try to get nonce from store first, then fallback to cookie (backward compatibility)
    let nonce: string | null = null
    
    // Check cookie for nonce
    const cookieStore = await cookies()
    const cookieNonce = cookieStore.get('aph_nonce')?.value
    if (cookieNonce) {
      const nonceRecord = getNonce(cookieNonce)
      if (nonceRecord && !nonceRecord.used) {
        nonce = cookieNonce
      }
    }

    if (!nonce) {
      return NextResponse.json(
        { error: 'Nonce not found. Please call /api/auth/nonce endpoint first.' },
        { status: 400 }
      )
    }

    // Replay protection: check if nonce is already used
    if (!isValidNonce(nonce)) {
      return NextResponse.json(
        { error: 'Nonce has already been used' },
        { status: 400 }
      )
    }

    let signatureValid = false

    // Test mode: if signature === "signed-{nonce}", accept it
    if (TEST_MODE && signature === `signed-${nonce}`) {
      signatureValid = true
    } else {
      // Production mode: real ECDSA signature verification
      try {
        // Build message
        const message = `Follow auth for Avalanche Profile Hub. Address: ${normalizedAddress}. Nonce: ${nonce}`

        // Verify signature
        const isValid = await verifyMessage({
          address: normalizedAddress as `0x${string}`,
          message,
          signature: signature as `0x${string}`,
        })

        if (isValid) {
          signatureValid = true
        } else {
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
    }

    if (!signatureValid) {
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 400 }
      )
    }

    // Mark nonce as used (replay protection)
    markNonceAsUsed(nonce)

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
