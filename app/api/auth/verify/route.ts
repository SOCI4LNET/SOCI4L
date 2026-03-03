import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyMessage } from 'viem'
import { isValidAddress } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { getNonce, markNonceAsUsed } from '@/lib/nonce-store'
import { setSessionAddress } from '@/lib/auth'

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

    // Get nonce from cookie and validate against nonce store
    const cookieStore = await cookies()
    const nonce = cookieStore.get('aph_nonce')?.value

    if (!nonce) {
      return NextResponse.json(
        { error: 'Nonce not found. Please call /api/auth/nonce endpoint first.' },
        { status: 400 }
      )
    }

    const nonceRecord = getNonce(nonce)
    if (!nonceRecord || nonceRecord.used) {
      return NextResponse.json(
        { error: 'Nonce not found, expired, or already used.' },
        { status: 400 }
      )
    }

    if (nonceRecord.address && nonceRecord.address !== normalizedAddress) {
      return NextResponse.json(
        { error: 'Nonce does not match wallet address' },
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
        const message = `Follow auth for SOCI4L. Address: ${normalizedAddress}. Nonce: ${nonce}`

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

    // Create session cookie with verified wallet address
    // Ensure address is exactly 42 characters (0x + 40 hex chars)
    const cleanAddress = normalizedAddress.slice(0, 42)

    if (cleanAddress.length !== 42 || !cleanAddress.startsWith('0x')) {
      console.error('[Auth] Invalid address format:', { normalizedAddress, cleanAddress })
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      )
    }

    const nonceMarked = markNonceAsUsed(nonce)
    if (!nonceMarked) {
      return NextResponse.json(
        { error: 'Nonce already used' },
        { status: 400 }
      )
    }

    const sessionSet = await setSessionAddress(cleanAddress)
    if (!sessionSet) {
      return NextResponse.json(
        { error: 'Session configuration error' },
        { status: 500 }
      )
    }

    // Clear nonce after successful verification
    cookieStore.delete('aph_nonce')

    // Find profile to log activity
    const profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
    })

    if (profile) {
      // Log login activity
      await prisma.userActivityLog.create({
        data: {
          profileId: profile.id,
          action: 'login',
          metadata: JSON.stringify({ method: 'signature' }),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        },
      })
    }

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
