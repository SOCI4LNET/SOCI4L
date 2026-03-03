import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error: 'Legacy endpoint disabled. Use /api/auth/nonce.',
      code: 'LEGACY_ENDPOINT_DISABLED',
    },
    { status: 410 }
  )
}
