import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { avalanche } from 'viem/chains'
import { prisma } from '@/lib/prisma'
import { PREMIUM_PAYMENT_ADDRESS } from '@/lib/contracts/PremiumPayment'

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
        // If gap is huge, we sync in chunks.
        const MAX_RANGE = BigInt(2000)
        let toBlock = currentBlock
        if (toBlock - fromBlock > MAX_RANGE) {
            toBlock = fromBlock + MAX_RANGE
        }

        if (fromBlock > toBlock) {
            return NextResponse.json({ message: 'Already synced', block: currentBlock.toString() })
        }

        console.log(`[Sync Premium] Syncing from ${fromBlock} to ${toBlock}`)

        // --- 2. Fetch Logs ---
        const logs = await client.getLogs({
            address: PREMIUM_PAYMENT_ADDRESS as `0x${string}`,
            event: EVENT,
            fromBlock,
            toBlock
        })

        console.log(`[Sync Premium] Found ${logs.length} events`)

        // --- 3. Process Logs (Idempotent) ---
        let processed = 0

        for (const log of logs) {
            const { args, transactionHash, logIndex } = log
            if (!args.user || !args.expiresAt) continue

            const userAddress = args.user.toLowerCase()
            const newExpiresAt = new Date(Number(args.expiresAt) * 1000)

            // Database Update: Extend expiration (Max logic)
            // Database Update: Upsert Profile
            // If profile exists, update expiry (max logic).
            // If not, create new UNCLAIMED profile with expiry.

            const existingProfile = await prisma.profile.findUnique({
                where: { address: userAddress }
            })

            if (existingProfile) {
                // Determine new expiry: max(current, new)
                let finalExpiresAt = newExpiresAt
                if (existingProfile.premiumExpiresAt && existingProfile.premiumExpiresAt > newExpiresAt) {
                    finalExpiresAt = existingProfile.premiumExpiresAt
                }

                await prisma.profile.update({
                    where: { address: userAddress },
                    data: {
                        premiumExpiresAt: finalExpiresAt,
                        // Ensure status doesn't change implicitly
                    }
                })
                processed++
            } else {
                // Create new UNCLAIMED profile
                console.log(`[Sync Premium] Creating new profile for ${userAddress}`)
                await prisma.profile.create({
                    data: {
                        address: userAddress,
                        status: 'UNCLAIMED',
                        premiumExpiresAt: newExpiresAt,
                        // Basic defaults
                        isPublic: false,
                        displayName: userAddress.slice(0, 6), // Placeholder
                    }
                })
                processed++
            }
        }

        // --- 4. Update State ---
        await prisma.indexerState.update({
            where: { key: INDEXER_KEY },
            data: { lastSyncedBlock: toBlock }
        })

        return NextResponse.json({
            success: true,
            fromBlock: fromBlock.toString(),
            toBlock: toBlock.toString(),
            processedLogs: logs.length,
            updatedProfiles: processed
        })

    } catch (error: any) {
        console.error('[Sync Premium] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
