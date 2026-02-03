import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const args = process.argv.slice(2)
    const rawAddress = args[0] || '0xbf...'
    const adminAddress = rawAddress.toLowerCase()

    if (!adminAddress || !adminAddress.startsWith('0x')) {
        console.error('Usage: npx tsx scripts/seed-docs-admin.ts <wallet_address>')
        process.exit(1)
    }

    console.log(`Seeding Docs Admin for address: ${adminAddress}`)

    const admin = await prisma.docsAdmin.upsert({
        where: { address: adminAddress },
        update: {},
        create: {
            address: adminAddress,
            name: 'Admin User',
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
