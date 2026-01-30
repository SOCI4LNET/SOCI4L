
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const profiles = await prisma.profile.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
    })

    console.log('--- LATEST PROFILES DEBUG ---')
    for (const p of profiles) {
        console.log(`Address: ${p.address}`)
        console.log(`DisplayName: ${p.displayName}`)
        console.log(`PrimaryRole: ${p.primaryRole}`)
        console.log(`SecondaryRoles: ${JSON.stringify(p.secondaryRoles)}`)
        console.log(`StatusMessage: ${p.statusMessage}`)
        console.log('---------------------------')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
