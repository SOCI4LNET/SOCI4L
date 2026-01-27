import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { storeNonce } from '@/lib/nonce-store'

export async function GET(request: NextRequest) {
  try {
    // Generate a random nonce (32 bytes = 64 hex characters)
    const nonce = crypto.randomBytes(32).toString('hex')
    
    // Ensure nonce is exactly 64 characters
    if (nonce.length !== 64) {
      console.error('Generated nonce length is not 64:', nonce.length)
      return NextResponse.json(
        { error: 'Failed to generate valid nonce' },
        { status: 500 }
      )
    }
    
    // Store nonce in in-memory store (with TTL and replay protection)
    storeNonce(nonce)
    
    // Also store nonce in httpOnly cookie for backward compatibility
    const cookieStore = await cookies()
    cookieStore.set('aph_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5 minutes
      path: '/',
    })

    return NextResponse.json({ nonce })
  } catch (error) {
    console.error('Error generating nonce:', error)
    return NextResponse.json(
      { error: 'An error occurred while generating nonce' },
      { status: 500 }
    )
  }
}
