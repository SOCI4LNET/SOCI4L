
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const address = '0x8aB00455C7A6A6176D9d23F46dc5aF8a5D4F1dC7'.toLowerCase()

    console.log(`Checking profile for ${address}...`)

    const profile = await prisma.profile.findUnique({
        where: { address }
    })

    if (!profile) {
        console.error('Profile not found!')
        return
    }

    console.log('Current status:', profile.status)
    console.log('Current owner:', profile.owner)

    if (profile.status === 'CLAIMED' && profile.ownerAddress === address) {
        console.log('Profile is already correctly claimed.')
        return
    }

    console.log('Updating profile to CLAIMED...')

    await prisma.profile.update({
        where: { address },
        data: {
            status: 'CLAIMED',
            ownerAddress: address,
            owner: address,
            isPublic: true,
            visibility: 'PUBLIC'
        }
    })

    console.log('Profile updated successfully!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
