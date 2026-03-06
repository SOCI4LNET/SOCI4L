import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const address = '0xbd75d47102bd6cb9f85d4c99cfd2c3f5ee4aa5cd'.toLowerCase()
  const profile = await prisma.profile.findUnique({
    where: { address }
  })
  console.log("Profile:", profile)

  const interactions = await prisma.billingInteraction.findMany({
    where: { userAddress: address }
  })
  console.log("Billing Interactions:", interactions)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
