import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem, parseAbi, formatEther } from 'viem'
import { activeChain, activeRpc, IS_TESTNET } from '@/lib/chain-config'
import { prisma } from '@/lib/prisma'
import { DONATE_PAYMENT_ADDRESS } from '@/lib/contracts/DonatePayment'

export const dynamic = 'force-dynamic'

// 1. Setup Viem Client
const client = createPublicClient({
    chain: activeChain,
    transport: http(activeRpc),
})

// 2. Event Definition (matching DonatePayment.ts ABI)
const EVENT = parseAbiItem('event DonationSent(address indexed sender, address indexed recipient, uint256 totalAmount, uint256 recipientAmount, uint256 platformFee, string message, uint256 timestamp)')

// 3. Helper: Resolve Start Block
// A safe start block for recent Avalanche deployments
const DEFAULT_START_BLOCK = IS_TESTNET ? BigInt(37800000) : BigInt(56000000)

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
        const networkSuffix = IS_TESTNET ? '_fuji' : ''
        const INDEXER_KEY = `donate_payment_v1${networkSuffix}`

        // 1. Fetch current indexer state
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
            console.log(`[Sync Donations] Force sync: scanning RECENT window from ${fromBlock}`)
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

            console.log(`[Sync Donations] Scanning ${fromBlock} to ${toBlock} (Iteration ${iteration + 1}/${MAX_ITERATIONS})`)

            const logs = await client.getLogs({
                address: DONATE_PAYMENT_ADDRESS as `0x${string}`,
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
                                    eventName: 'DonationSent'
                                }
                            }
                        })

                        if (existingEvent) return

                        // 2.3 Mark Event as Processed
                        await tx.processedEvent.create({
                            data: {
                                txHash: transactionHash,
                                logIndex: logIndexInt,
                                eventName: 'DonationSent'
                            }
                        })

                        if (!args.sender || !args.recipient || !args.timestamp || !args.recipientAmount) return

                        const senderAddress = args.sender.toLowerCase()
                        const recipientAddress = args.recipient.toLowerCase()
                        const timestamp = Number(args.timestamp)
                        const amount = args.totalAmount ? formatEther(args.totalAmount) : "0"
                        const message = args.message || ''

                        // 2.4 Create Notification
                        await tx.notification.create({
                            data: {
                                profileId: recipientAddress,
                                type: 'DONATION_RECEIVED',
                                actorAddress: senderAddress,
                                metadata: JSON.stringify({
                                    amount,
                                    message,
                                    txHash: transactionHash
                                }),
                                createdAt: new Date(timestamp * 1000)
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
            updatedNotifications: totalProcessed,
            iterations: iteration
        })

    } catch (error: any) {
        console.error('[Sync Donations] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    return POST(request)
}
