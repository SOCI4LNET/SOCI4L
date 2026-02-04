
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const address = '0x1234567890123456789012345678901234567890'.toLowerCase()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  console.log('Checking analytics for:', address)
  console.log('Since:', sevenDaysAgo.toISOString())

  const count = await prisma.analyticsEvent.count({
    where: {
      profileId: address,
      type: 'profile_view',
      createdAt: {
        gte: sevenDaysAgo
      }
    }
  })

  console.log('Count:', count)

  const events = await prisma.analyticsEvent.findMany({
    where: {
      profileId: address,
      type: 'profile_view',
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  })

  console.log('Recent events:', events)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
