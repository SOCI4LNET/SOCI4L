import { NextRequest, NextResponse } from 'next/server'
import { isValidAddress } from '@/lib/utils'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    // Generate a random nonce
    const nonce = crypto.randomBytes(32).toString('hex')

    // Store nonce in memory (in production, use Redis or similar)
    // For now, we'll return it and verify in the claim endpoint
    return NextResponse.json({ nonce })
  } catch (error) {
    console.error('Error generating nonce:', error)
    return NextResponse.json(
      { error: 'An error occurred while generating nonce' },
      { status: 500 }
    )
  }
}
