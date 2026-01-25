import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email adresi gereklidir' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) {
      return NextResponse.json(
        { error: 'Email adresi gereklidir' },
        { status: 400 }
      )
    }

    if (!validateEmail(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Geçerli bir email adresi giriniz' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await prisma.emailSubscription.findUnique({
      where: { email: trimmedEmail },
    })

    if (existing) {
      return NextResponse.json(
        { success: true, message: 'Bu email adresi zaten kayıtlı' },
        { status: 200 }
      )
    }

    // Create new subscription
    const subscription = await prisma.emailSubscription.create({
      data: {
        email: trimmedEmail,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Email başarıyla kaydedildi',
      subscription,
    })
  } catch (error) {
    console.error('Error subscribing email:', error)
    return NextResponse.json(
      { error: 'Email kaydı sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}
