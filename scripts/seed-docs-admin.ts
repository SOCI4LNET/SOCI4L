import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const adminAddress = '0x8ab0cf264df99d83525e9e11c7e4db01558ae1b1' // Using the example address or user's connected wallet if known

    console.log(`Seeding Docs Admin for address: ${adminAddress}`)

    const admin = await prisma.docsAdmin.upsert({
        where: { address: adminAddress },
        update: {},
        create: {
            address: adminAddress,
            name: 'Master Admin',
            role: 'SUPER_ADMIN'
        }
    })

    console.log('Docs Admin created:', admin)
    console.log('COOKIE_VALUE=' + JSON.stringify({
        id: admin.id,
        address: admin.address,
        role: admin.role
    }))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
