
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const address = process.argv[2]
    const remove = process.argv[3] === '--remove'

    if (!address) {
        console.log('Usage: node scripts/make-agent.js <wallet_address> [--remove]')
        process.exit(1)
    }

    const normalizedAddress = address.toLowerCase()

    try {
        const profile = await prisma.profile.upsert({
            where: { address: normalizedAddress },
            update: {
                isAgent: !remove,
                agentCapabilities: remove ? [] : ['Portfolio Analysis', 'System Guide', 'On-chain Monitoring']
            },
            create: {
                address: normalizedAddress,
                isAgent: !remove,
                status: 'CLAIMED',
                visibility: 'PUBLIC',
                role: 'USER',
                agentCapabilities: remove ? [] : ['Portfolio Analysis', 'System Guide', 'On-chain Monitoring']
            }
        })

        console.log(`Success! Profile ${normalizedAddress} is now ${remove ? 'not an agent' : 'an agent'}.`)
        console.log('Capabilities:', profile.agentCapabilities)
    } catch (e) {
        console.error('Error updating profile:', e.message)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
