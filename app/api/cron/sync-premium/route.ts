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
const DEFAULT_START_BLOCK = BigInt(77000000)

export async function GET(request: NextRequest) {
    try {
        const INDEXER_KEY = 'premium_payment_v1'

        let state = await prisma.indexerState.findUnique({
            where: { key: INDEXER_KEY }
        })

        if (!state) {
            state = await prisma.indexerState.create({
                data: {
                    key: INDEXER_KEY,
                    lastSyncedBlock: DEFAULT_START_BLOCK
                }
            })
        }

        const currentBlock = await client.getBlockNumber()

        const force = request.nextUrl.searchParams.get('force') === 'true'
        let fromBlock = state.lastSyncedBlock + BigInt(1)

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

                // 2.2 Deduplication Check
                const existingEvent = await prisma.processedEvent.findUnique({
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
                    continue
                }

                if (!args.user || !args.expiresAt) continue

                const userAddress = args.user.toLowerCase()
                const newExpiresAt = new Date(Number(args.expiresAt) * 1000)

                // Database Update: Upsert Profile
                const existingProfile = await prisma.profile.findUnique({
                    where: { address: userAddress }
                })

                const isNewlyPremium = !existingProfile?.premiumExpiresAt ||
                    (existingProfile.premiumExpiresAt < new Date());

                if (existingProfile) {
                    let finalExpiresAt = newExpiresAt
                    if (existingProfile.premiumExpiresAt && existingProfile.premiumExpiresAt > newExpiresAt) {
                        finalExpiresAt = existingProfile.premiumExpiresAt
                    }

                    await prisma.profile.update({
                        where: { address: userAddress },
                        data: {
                            premiumExpiresAt: finalExpiresAt,
                            premiumLastTxHash: transactionHash // Always update tx hash
                        }
                    })
                    totalProcessed++
                } else {
                    console.log(`[Sync Premium] Creating new profile for ${userAddress}`)
                    await prisma.profile.create({
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

                // 2.3 Mark Event as Processed
                await prisma.processedEvent.create({
                    data: {
                        txHash: transactionHash,
                        logIndex: logIndexInt,
                        eventName: 'PremiumPurchased'
                    }
                })

                if (isNewlyPremium) {
                    try {
                        const { sendTelegramNotification, getAvaxPrice } = require('@/lib/telegram');
                        const price = await getAvaxPrice();
                        const amount = 0.5;
                        const usdValue = (amount * price).toFixed(2);

                        const totalPremium = await prisma.profile.count({
                            where: {
                                premiumExpiresAt: {
                                    gt: new Date()
                                }
                            }
                        });

                        const txHash = log.transactionHash;
                        const explorerUrl = `https://snowtrace.io/tx/${txHash}`;

                        const profileIdentity = existingProfile?.slug
                            ? `<b>${existingProfile.slug}</b> (<code>${userAddress}</code>)`
                            : `<code>${userAddress}</code>`;

                        const msg = [
                            `🚀 <b>New Premium Purchase!</b>`,
                            ``,
                            `👤 <b>User:</b> ${profileIdentity}`,
                            `💰 <b>Amount:</b> ${amount} AVAX (~$${usdValue})`,
                            `📅 <b>Expires:</b> ${newExpiresAt.toLocaleDateString()}`,
                            `🏆 <b>Total Premium:</b> ${totalPremium}`,
                            ``,
                            `⛓️ <a href="${explorerUrl}">View on Snowtrace</a>`,
                            `🔗 <a href="https://soci4l.net/p/${existingProfile?.slug || userAddress}">View Profile</a>`
                        ].join('\n');

                        await sendTelegramNotification(msg);
                    } catch (err) {
                        console.error('[Sync Premium] Telegram notification failed:', err);
                    }
                }
            }

            fromBlock = toBlock + BigInt(1)
            iteration++
        }

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
