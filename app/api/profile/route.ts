import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidAddress } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')

  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Geçersiz cüzdan adresi' }, { status: 400 })
  }

  try {
    const normalizedAddress = address.toLowerCase()
    
    const profile = await prisma.profile.findUnique({
      where: { address: normalizedAddress },
      include: { showcase: true },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Profil alınırken bir hata oluştu' },
      { status: 500 }
    )
  }
}
