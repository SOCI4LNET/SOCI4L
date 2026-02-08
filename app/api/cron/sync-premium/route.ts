import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { avalanche } from 'viem/chains'
import { prisma } from '@/lib/prisma'
import { PREMIUM_PAYMENT_ADDRESS } from '@/lib/contracts/PremiumPayment'

export const dynamic = 'force-dynamic'

// 1. Setup Viem Client
const client = createPublicClient({
    chain: avalanche,
    transport: http(),
})

// 2. Event Definition
const EVENT = parseAbiItem('event PremiumPurchased(address indexed user, uint256 paidAt, uint256 expiresAt, uint256 amount)')

// 3. Helper: Resolve Start Block
// If lastSyncedBlock is 0, start from contract deployment block (or recent safe block)
const DEFAULT_START_BLOCK = BigInt(77000000) // Recent block (~Feb 2026) to avoid deep query

interface SyncResult {
    processed: number
    errors: number
    latestBlock: string
}

export async function GET(request: NextRequest) {
    try {
        // --- 1. Get Indexer State ---
        // We use a unique key for this indexer
        const INDEXER_KEY = 'premium_payment_v1'

        let state = await prisma.indexerState.findUnique({
            where: { key: INDEXER_KEY }
        })

        // On first run, create state
        if (!state) {
            state = await prisma.indexerState.create({
                data: {
                    key: INDEXER_KEY,
                    lastSyncedBlock: DEFAULT_START_BLOCK
                }
            })
        }

        const currentBlock = await client.getBlockNumber()

        // Force Sync: Ignore DB state
        const force = request.nextUrl.searchParams.get('force') === 'true'
        let fromBlock = state.lastSyncedBlock + BigInt(1)

        if (force) {
            fromBlock = DEFAULT_START_BLOCK
            console.log('[Sync Premium] Force sync enabled, scanning from default start block')
        }

        // Safety: Limit range to avoid RPC timeout (Public RPC limit is often 2048)
        const MAX_RANGE = BigInt(2000)
        const MAX_ITERATIONS = 50 // Max chunks per run to avoid Vercel timeout (50 * 2000 = 100k blocks)

        let iteration = 0
        let totalLogs = 0
        let totalProcessed = 0

        while (fromBlock < currentBlock && iteration < MAX_ITERATIONS) {
            let toBlock = currentBlock
            if (toBlock - fromBlock > MAX_RANGE) {
                toBlock = fromBlock + MAX_RANGE
            }

            console.log(`[Sync Premium] Scanning ${fromBlock} to ${toBlock} (Iteration ${iteration + 1}/${MAX_ITERATIONS})`)

            const logs = await client.getLogs({
                address: PREMIUM_PAYMENT_ADDRESS as `0x${string}`,
                event: EVENT,
                fromBlock,
                toBlock
            })

            totalLogs += logs.length

            for (const log of logs) {
                const { args } = log
                if (!args.user || !args.expiresAt) continue

                const userAddress = args.user.toLowerCase()
                const newExpiresAt = new Date(Number(args.expiresAt) * 1000)

                // Database Update: Upsert Profile
                const existingProfile = await prisma.profile.findUnique({
                    where: { address: userAddress }
                })

                if (existingProfile) {
                    let finalExpiresAt = newExpiresAt
                    if (existingProfile.premiumExpiresAt && existingProfile.premiumExpiresAt > newExpiresAt) {
                        finalExpiresAt = existingProfile.premiumExpiresAt
                    }

                    await prisma.profile.update({
                        where: { address: userAddress },
                        data: { premiumExpiresAt: finalExpiresAt }
                    })
                    totalProcessed++
                } else {
                    console.log(`[Sync Premium] Creating new profile for ${userAddress}`)
                    await prisma.profile.create({
                        data: {
                            address: userAddress,
                            status: 'UNCLAIMED',
                            premiumExpiresAt: newExpiresAt,
                            isPublic: false,
                            displayName: userAddress.slice(0, 6)
                        }
                    })
                    totalProcessed++
                }
            }

            // Update Indexer State after each chunk to save progress?
            // Safer to do it at the end to avoid write spam, but if we timeout we lose progress.
            // Let's rely on final update for now.

            // Advance pointers
            const lastProcessedBlock = toBlock
            fromBlock = toBlock + BigInt(1)
            iteration++
        }

        // --- 4. Update State ---
        // We update to the LAST block we successfully scanned (fromBlock - 1)
        await prisma.indexerState.update({
            where: { key: INDEXER_KEY },
            data: { lastSyncedBlock: fromBlock - BigInt(1) }
        })

        return NextResponse.json({
            success: true,
            latestSyncedBlock: (fromBlock - BigInt(1)).toString(),
            currentBlock: currentBlock.toString(),
            processedLogs: totalLogs,
            updatedProfiles: totalProcessed,
            iterations: iteration
        })

    } catch (error: any) {
        console.error('[Sync Premium] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
