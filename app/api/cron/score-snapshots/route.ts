/**
 * Cron Job: Daily Score Snapshots
 * 
 * This endpoint should be called daily by Vercel Cron Jobs
 * to create score snapshots for all claimed profiles.
 * 
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/score-snapshots",
 *     "schedule": "0 0 * * *" // Daily at midnight UTC
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAllScoreSnapshots } from '@/lib/score-snapshot'

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return authHeader === `Bearer ${cronSecret}`
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await createAllScoreSnapshots()
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[cron/score-snapshots] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
