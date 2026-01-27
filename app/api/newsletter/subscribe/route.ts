import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Normalize email: trim whitespace and convert to lowercase
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Validate email format using a simple but deterministically regex
 */
function isValidEmail(email: string): boolean {
  // Simple regex: at least one char before @, at least one char after @, then dot, then at least one char
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Email validation: required and must be string
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { 
          error: 'Email address is required',
          code: 'EMAIL_REQUIRED'
        },
        { status: 400 }
      )
    }

    // Normalize email: trim and lowercase
    const normalizedEmail = normalizeEmail(email)

    // Check if normalized email is empty
    if (!normalizedEmail) {
      return NextResponse.json(
        { 
          error: 'Email address is required',
          code: 'EMAIL_REQUIRED'
        },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { 
          error: 'Invalid email format',
          code: 'INVALID_EMAIL_FORMAT'
        },
        { status: 400 }
      )
    }

    // Check if email already exists (duplicate check)
    const existing = await prisma.emailSubscription.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      return NextResponse.json(
        { 
          error: 'Already subscribed',
          code: 'ALREADY_SUBSCRIBED'
        },
        { status: 400 }
      )
    }

    // Create new subscription
    try {
      const subscription = await prisma.emailSubscription.create({
        data: {
          email: normalizedEmail,
        },
      })

      return NextResponse.json({
        ok: true,
        email: normalizedEmail,
      })
    } catch (createError: any) {
      // Handle unique constraint violation (race condition protection)
      // This can happen if two requests try to create the same email simultaneously
      if (createError.code === 'P2002' || createError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return NextResponse.json(
          { 
            error: 'Already subscribed',
            code: 'ALREADY_SUBSCRIBED'
          },
          { status: 400 }
        )
      }
      
      // Re-throw other errors
      throw createError
    }
  } catch (error: any) {
    console.error('Error subscribing email:', error)
    
    // If it's already a response error (from above), re-throw it
    if (error.status) {
      throw error
    }
    
    return NextResponse.json(
      { 
        error: 'An error occurred while saving email',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}
