
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem'
import { avalanche } from 'viem/chains'
import { prisma } from '../lib/prisma'
import { PREMIUM_PAYMENT_ADDRESS } from '../lib/contracts/PremiumPayment'

async function main() {
    const INDEXER_KEY = 'premium_payment_v1'
    const BATCH_SIZE = 2000n // Reduced to respect RPC limit

    const client = createPublicClient({
        chain: avalanche,
        transport: http(),
    })

    // 1. Get current state
    let state = await prisma.indexerState.findUnique({
        where: { key: INDEXER_KEY }
    })

    if (!state) {
        console.log('No indexer state found. Starting from scratch...')
        // Initialize if missing (should not happen in prod)
        state = await prisma.indexerState.create({
            data: {
                key: INDEXER_KEY,
                lastSyncedBlock: 77000000n // Rough start block
            }
        })
    }

    let fromBlock = BigInt(state.lastSyncedBlock) + 1n
    const currentBlock = await client.getBlockNumber()

    console.log(`Starting sync from ${fromBlock} to ${currentBlock}`)
    console.log(`Gap: ${currentBlock - fromBlock} blocks`)

    while (fromBlock <= currentBlock) {
        const toBlock = fromBlock + BATCH_SIZE > currentBlock ? currentBlock : fromBlock + BATCH_SIZE

        console.log(`Scanning ${fromBlock} -> ${toBlock}...`)

        const logs = await client.getLogs({
            address: PREMIUM_PAYMENT_ADDRESS as `0x${string}`,
            event: parseAbiItem('event PremiumPurchased(address indexed user, uint256 paidAt, uint256 expiresAt, uint256 amount)'),
            fromBlock,
            toBlock
        })

        if (logs.length > 0) {
            console.log(`Found ${logs.length} events! Processing...`)
            for (const log of logs) {
                const { user, paidAt, expiresAt, amount } = log.args

                if (!user) continue

                console.log(`Syncing user: ${user}`)

                // Upsert profile
                await prisma.profile.upsert({
                    where: { address: user.toLowerCase() },
                    update: {
                        premiumExpiresAt: new Date(Number(expiresAt) * 1000),
                        updatedAt: new Date()
                    },
                    create: {
                        address: user.toLowerCase(),
                        premiumExpiresAt: new Date(Number(expiresAt) * 1000),
                        status: 'UNCLAIMED', // Placeholder if not strictly claimed
                        visibility: 'PUBLIC'
                    }
                })
            }
        }

        // Update state
        await prisma.indexerState.update({
            where: { key: INDEXER_KEY },
            data: { lastSyncedBlock: toBlock }
        })

        fromBlock = toBlock + 1n
    }

    console.log('Sync complete!')
}

main().catch(console.error)
