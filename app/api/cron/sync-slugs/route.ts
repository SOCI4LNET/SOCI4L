import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { avalanche } from 'viem/chains'
import { prisma } from '@/lib/prisma'
import { SLUG_REGISTRY_ADDRESS } from '@/lib/contracts/CustomSlugRegistry'

export const dynamic = 'force-dynamic'

// 1. Setup Viem Client
const client = createPublicClient({
    chain: avalanche,
    transport: http(),
})

// 2. Event Definition
const EVENT = parseAbiItem('event SlugClaimed(bytes32 indexed slugHash, address indexed owner, uint256 timestamp)')

// 3. Helper: Resolve Start Block
const DEFAULT_START_BLOCK = BigInt(77000000)

export async function GET(request: NextRequest) {
    try {
        const INDEXER_KEY = 'slug_registry_v1'

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
            console.log(`[Sync Slugs] Force sync: scanning RECENT window from ${fromBlock}`)
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

            console.log(`[Sync Slugs] Scanning ${fromBlock} to ${toBlock} (Iteration ${iteration + 1}/${MAX_ITERATIONS})`)

            const logs = await client.getLogs({
                address: SLUG_REGISTRY_ADDRESS as `0x${string}`,
                event: EVENT,
                fromBlock,
                toBlock
            })

            totalLogs += logs.length

            for (const log of logs) {
                const { args, transactionHash, logIndex } = log
                const logIndexInt = Number(logIndex)

                try {
                    await (prisma as any).$transaction(async (tx: any) => {
                        // 2.2 Deduplication Check
                        const existingEvent = await tx.processedEvent.findUnique({
                            where: {
                                txHash_logIndex_eventName: {
                                    txHash: transactionHash,
                                    logIndex: logIndexInt,
                                    eventName: 'SlugClaimed'
                                }
                            }
                        })

                        if (existingEvent) return

                        // 2.3 Mark Event as Processed
                        await tx.processedEvent.create({
                            data: {
                                txHash: transactionHash,
                                logIndex: logIndexInt,
                                eventName: 'SlugClaimed'
                            }
                        })

                        if (!args.owner || !args.timestamp) return

                        const userAddress = args.owner.toLowerCase()
                        const timestamp = Number(args.timestamp)

                        // Save to BillingInteraction for persistent history
                        await tx.billingInteraction.upsert({
                            where: { txHash: transactionHash },
                            update: {},
                            create: {
                                userAddress,
                                type: 'SLUG_CLAIM',
                                description: 'Identity Handle Claim',
                                amount: 'Gas Only',
                                txHash: transactionHash,
                                timestamp: new Date(timestamp * 1000)
                            }
                        })

                        totalProcessed++
                    })
                } catch (error) {
                    if ((error as any).code === 'P2002') continue
                    throw error
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
            updatedInteractions: totalProcessed,
            iterations: iteration
        })

    } catch (error: any) {
        console.error('[Sync Slugs] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
