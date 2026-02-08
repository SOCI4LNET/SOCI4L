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

        // Force Sync: Prioritize RECENT blocks (last 24-48h) to ensure immediate UX
        // during purchases, even if the main indexer is lagging behind.
        const force = request.nextUrl.searchParams.get('force') === 'true'
        let fromBlock = state.lastSyncedBlock + BigInt(1)

        if (force) {
            // Scan last 30,000 blocks (~16 hours) to catch any recent payments immediately.
            // This ensures "Just bought but not appearing" fixes in 2-3 seconds.
            const RECENT_WINDOW = BigInt(30000)
            const recentStart = currentBlock - RECENT_WINDOW
            fromBlock = recentStart < DEFAULT_START_BLOCK ? DEFAULT_START_BLOCK : recentStart
            console.log(`[Sync Premium] Force sync: scanning RECENT window from ${fromBlock}`)
        }

        // Safety: Limit range to avoid RPC timeout
        const MAX_RANGE = BigInt(2000)
        // If it's a cron run (not force), stay small to avoid timeout.
        // If it's a force run from dashboard, we can afford a bit more or less iteration.
        const MAX_ITERATIONS = force ? 15 : 100

        // Note: 100 iterations * 2000 blocks = 200,000 blocks catch-up per daily cron run.
        // Avalanche creates ~43k blocks/day, so 200k is 4x speed catch-up.

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

                // --- Telegram Notification Logic ---
                // We only notify if this is a "new" premium status being detected
                // (e.g., current expiresAt is null or in the past)
                const isNewlyPremium = !existingProfile?.premiumExpiresAt ||
                    (existingProfile.premiumExpiresAt < new Date());

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

                if (isNewlyPremium) {
                    try {
                        const { sendTelegramNotification, getAvaxPrice } = require('@/lib/telegram');
                        const price = await getAvaxPrice();
                        const amount = 0.5; // Shared constant
                        const usdValue = (amount * price).toFixed(2);

                        const msg = [
                            `🚀 <b>New Premium Purchase Detected!</b>`,
                            ``,
                            `👤 <b>Wallet:</b> <code>${userAddress}</code>`,
                            `💰 <b>Amount:</b> ${amount} AVAX (~$${usdValue})`,
                            `📅 <b>Expires:</b> ${newExpiresAt.toLocaleDateString()}`,
                            ``,
                            `🔗 <a href="https://soci4l.net/p/${userAddress}">View Profile</a>`
                        ].join('\n');

                        await sendTelegramNotification(msg);
                    } catch (err) {
                        console.error('[Sync Premium] Telegram notification failed:', err);
                    }
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

        // --- 5. Update State ---
        // CRITICAL: Internal force syncs (which scan only recent blocks) 
        // should NOT move the global indexer state BACKWARDS.
        const finalSyncedBlock = fromBlock > state.lastSyncedBlock ? fromBlock : state.lastSyncedBlock

        await prisma.indexerState.update({
            where: { key: INDEXER_KEY },
            data: {
                lastSyncedBlock: finalSyncedBlock
            }
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
