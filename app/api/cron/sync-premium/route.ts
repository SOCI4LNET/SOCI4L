import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { activeChain, activeRpc, IS_TESTNET } from '@/lib/chain-config'
import { prisma } from '@/lib/prisma'
import { PREMIUM_PAYMENT_ADDRESS } from '@/lib/contracts/PremiumPayment'

export const dynamic = 'force-dynamic'

// 1. Setup Viem Client
const client = createPublicClient({
    chain: activeChain,
    transport: http(activeRpc),
})

// 2. Event Definition
const EVENT = parseAbiItem('event PremiumPurchased(address indexed user, uint256 paidAt, uint256 expiresAt, uint256 amount)')

// 3. Helper: Resolve Start Block
const DEFAULT_START_BLOCK = IS_TESTNET ? BigInt(37800000) : BigInt(77000000)

function isAuthorizedCronRequest(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) return false
    return authHeader === `Bearer ${cronSecret}`
}

export async function POST(request: NextRequest) {
    if (!isAuthorizedCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const INDEXER_KEY = 'premium_payment_v1'

        let state = await (prisma as any).indexerState.findUnique({
            where: { key: INDEXER_KEY }
        })

        if (!state) {
            state = await (prisma as any).indexerState.create({
                data: {
                    key: INDEXER_KEY,
                    lastSyncedBlock: DEFAULT_START_BLOCK
                }
            })
        }

        const currentBlock = await client.getBlockNumber()

        const force = request.nextUrl.searchParams.get('force') === 'true'
        let fromBlock = BigInt(state.lastSyncedBlock) + BigInt(1)

        if (force) {
            const RECENT_WINDOW = BigInt(30000)
            const recentStart = currentBlock - RECENT_WINDOW
            fromBlock = recentStart < DEFAULT_START_BLOCK ? DEFAULT_START_BLOCK : recentStart
            console.log(`[Sync Premium] Force sync: scanning RECENT window from ${fromBlock}`)
        }

        const MAX_RANGE = BigInt(2000)
        const MAX_ITERATIONS = force ? 15 : 100

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
                const { args, transactionHash, logIndex } = log
                const logIndexInt = Number(logIndex) // Ensure it's a number

                try {
                    await (prisma as any).$transaction(async (tx: any) => {
                        // 2.2 Deduplication Check (Atomic)
                        const existingEvent = await tx.processedEvent.findUnique({
                            where: {
                                txHash_logIndex_eventName: {
                                    txHash: transactionHash,
                                    logIndex: logIndexInt,
                                    eventName: 'PremiumPurchased'
                                }
                            }
                        })

                        if (existingEvent) {
                            console.log(`[Sync Premium] Skipping processed event: ${transactionHash}-${logIndexInt}`)
                            return // Skip rest of transaction
                        }

                        // 2.3 Mark Event as Processed (Locks this event)
                        await tx.processedEvent.create({
                            data: {
                                txHash: transactionHash,
                                logIndex: logIndexInt,
                                eventName: 'PremiumPurchased'
                            }
                        })

                        if (!args.user || !args.expiresAt) return

                        const userAddress = args.user.toLowerCase()
                        const newExpiresAt = new Date(Number(args.expiresAt) * 1000)

                        // Database Update: Upsert Profile
                        const existingProfile = await tx.profile.findUnique({
                            where: { address: userAddress }
                        })

                        const isNewlyPremium = !existingProfile?.premiumExpiresAt ||
                            (existingProfile.premiumExpiresAt < new Date());

                        if (existingProfile) {
                            let finalExpiresAt = newExpiresAt
                            if (existingProfile.premiumExpiresAt && existingProfile.premiumExpiresAt > newExpiresAt) {
                                finalExpiresAt = existingProfile.premiumExpiresAt
                            }

                            await tx.profile.update({
                                where: { address: userAddress },
                                data: {
                                    premiumExpiresAt: finalExpiresAt,
                                    premiumLastTxHash: transactionHash // Always update tx hash
                                }
                            })
                            totalProcessed++
                        } else {
                            console.log(`[Sync Premium] Creating new profile for ${userAddress}`)
                            await tx.profile.create({
                                data: {
                                    address: userAddress,
                                    status: 'UNCLAIMED',
                                    premiumExpiresAt: newExpiresAt,
                                    premiumLastTxHash: transactionHash, // Set initial tx hash
                                    isPublic: false,
                                    displayName: userAddress.slice(0, 6)
                                }
                            })
                            totalProcessed++
                        }

                        // Save to BillingInteraction for persistent history
                        const paidAt = args.paidAt ? Number(args.paidAt) : Math.floor(Date.now() / 1000)
                        const amount = args.amount ? Number(args.amount) / 1e18 : 0.5

                        await tx.billingInteraction.upsert({
                            where: { txHash: transactionHash },
                            update: {},
                            create: {
                                userAddress,
                                type: 'PREMIUM',
                                description: 'Premium Plan (365 Days)',
                                amount: `${amount.toFixed(1)} AVAX`,
                                txHash: transactionHash,
                                timestamp: new Date(paidAt * 1000)
                            }
                        })

                        // Return info for notification AFTER transaction commits
                        if (isNewlyPremium) {
                            return { shouldNotify: true, userAddress, newExpiresAt, existingProfile, transactionHash, logIndexInt };
                        }
                    }).then(async (result: any) => {
                        if (result && result.shouldNotify) {
                            try {
                                const { sendTelegramNotification, getAvaxPrice } = require('@/lib/telegram');
                                const price = await getAvaxPrice();
                                const amount = 0.5;
                                const usdValue = (amount * price).toFixed(2);

                                const totalPremium = await (prisma as any).profile.count({
                                    where: {
                                        premiumExpiresAt: {
                                            gt: new Date()
                                        }
                                    }
                                });

                                const txHash = result.transactionHash;
                                const explorerUrl = `https://snowtrace.io/tx/${txHash}`;

                                const profileIdentity = result.existingProfile?.slug
                                    ? `<b>${result.existingProfile.slug}</b> (<code>${result.userAddress}</code>)`
                                    : `<code>${result.userAddress}</code>`;

                                const msg = [
                                    `🚀 <b>New Premium Purchase!</b>`,
                                    ``,
                                    `👤 <b>User:</b> ${profileIdentity}`,
                                    `💰 <b>Amount:</b> ${amount} AVAX (~$${usdValue})`,
                                    `📅 <b>Expires:</b> ${result.newExpiresAt.toLocaleDateString()}`,
                                    `🏆 <b>Total Premium:</b> ${totalPremium}`,
                                    ``,
                                    `⛓️ <a href="${explorerUrl}">View on Snowtrace</a>`,
                                    `🔗 <a href="https://soci4l.net/p/${result.existingProfile?.slug || result.userAddress}">View Profile</a>`
                                ].join('\n');

                                await sendTelegramNotification(msg);
                            } catch (err) {
                                console.error('[Sync Premium] Telegram notification failed:', err);
                            }
                        }
                    });
                } catch (error) {
                    if ((error as any).code === 'P2002') {
                        console.log(`[Sync Premium] Concurrency: Event ${transactionHash}-${logIndexInt} processed by another worker.`);
                    } else {
                        throw error;
                    }
                }
            }

            fromBlock = toBlock + BigInt(1)
            iteration++
        }

        const finalSyncedBlock = fromBlock > BigInt(state.lastSyncedBlock) ? fromBlock : BigInt(state.lastSyncedBlock)

        await (prisma as any).indexerState.update({
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

export async function GET(request: NextRequest) {
    return POST(request)
}
