import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    // Generate a random nonce
    const nonce = crypto.randomBytes(32).toString('hex')
    
    // Store nonce in httpOnly cookie
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
