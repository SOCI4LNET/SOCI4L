
import { prisma } from '../lib/prisma'

async function main() {
    const INDEXER_KEY = 'premium_payment_v1'
    const TARGET_USER = '0x26d3d5bB4Da58309F3bd71714AD2317a2F31eC4D'.toLowerCase() // Correct address from TX log

    console.log('Checking DB State...')

    const state = await prisma.indexerState.findUnique({
        where: { key: INDEXER_KEY }
    })
    console.log('Indexer State:', state)

    const profile = await prisma.profile.findUnique({
        where: { address: TARGET_USER }
    })
    console.log('Profile:', profile)

    // Also check if there's a profile with the typo address just in case
    const typoProfile = await prisma.profile.findUnique({
        where: { address: '0x26d3d5d5bb4da58309f2bd71714ad2317a2f31ec4d'.toLowerCase() }
    })
    console.log('Typo Profile (if any):', typoProfile)

    console.log('--- INDEXER STATE ---')
    console.log(JSON.stringify(state, null, 2))
}

main().catch(console.error)
