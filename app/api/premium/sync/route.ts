import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem, verifyMessage, recoverMessageAddress } from 'viem'
import { activeChain, activeRpc } from '@/lib/chain-config'
import { prisma } from '@/lib/prisma'
import { PREMIUM_PAYMENT_ADDRESS } from '@/lib/contracts/PremiumPayment'
import { isValidAddress } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const client = createPublicClient({
    chain: activeChain,
    transport: http(activeRpc),
})

const EVENT = parseAbiItem('event PremiumPurchased(address indexed user, uint256 paidAt, uint256 expiresAt, uint256 amount)')

export async function POST(request: NextRequest) {
    try {
        const { address, signature, message, txHash } = await request.json()

        if (!address || !isValidAddress(address)) {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
        }
        if (!txHash) {
            return NextResponse.json({ error: 'Transaction hash is required' }, { status: 400 })
        }

        // Optional: Signature verification for extra security (like slugs)
        if (signature && message) {
            try {
                const isValid = await verifyMessage({
                    address: address as `0x${string}`,
                    message,
                    signature: signature as `0x${string}`,
                })
                if (!isValid) throw new Error("Invalid signature")
            } catch (e) {
                return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
            }
        }

        // Get transaction receipt using Viem
        const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` })

        if (!receipt || receipt.status !== 'success') {
            return NextResponse.json({ error: 'Transaction has not succeeded yet' }, { status: 400 })
        }

        // Find the PremiumPurchased event
        let foundEvent = null;
        for (const log of receipt.logs) {
            if (log.address.toLowerCase() === PREMIUM_PAYMENT_ADDRESS.toLowerCase()) {
                // Topic[0] for PremiumPurchased is 0xd1eb0f9d9860b377f02b37c6806a6af3bf7b6b15857e3fbad21c25ebd6cb2cf1
                // We'll trust the topics array instead of decoding everything manually for simplicity
                foundEvent = log;
                break;
            }
        }

        if (!foundEvent) {
            return NextResponse.json({ error: 'No premium event found in this transaction' }, { status: 400 })
        }

        // Sync logic is slightly duplicated from cron, but tailored for immediate single-user update
        // We will just fetch the logs from this exact block and tx to use Viem's decoder
        const logs = await client.getLogs({
            address: PREMIUM_PAYMENT_ADDRESS as `0x${string}`,
            event: EVENT,
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber
        })

        const premiumLog = logs.find(l => l.transactionHash === txHash);

        if (!premiumLog) {
            return NextResponse.json({ error: 'Failed to decode premium event' }, { status: 400 })
        }

        const { args, logIndex } = premiumLog;
        const logIndexInt = Number(logIndex)

        if (args.user?.toLowerCase() !== address.toLowerCase()) {
            return NextResponse.json({ error: 'Transaction does not belong to this user' }, { status: 403 })
        }

        const newExpiresAt = new Date(Number(args.expiresAt) * 1000)

        const result = await (prisma as any).$transaction(async (tx: any) => {
            // Check if already processed
            const existingEvent = await tx.processedEvent.findUnique({
                where: {
                    txHash_logIndex_eventName: {
                        txHash: txHash,
                        logIndex: logIndexInt,
                        eventName: 'PremiumPurchased'
                    }
                }
            })

            if (existingEvent) {
                return { skipped: true }
            }

            // Mark as processed
            await tx.processedEvent.create({
                data: {
                    txHash: txHash,
                    logIndex: logIndexInt,
                    eventName: 'PremiumPurchased'
                }
            })

            // Upsert Profile
            const existingProfile = await tx.profile.findUnique({
                where: { address: address.toLowerCase() }
            })

            let isNewlyPremium = false;
            if (!existingProfile?.premiumExpiresAt || existingProfile.premiumExpiresAt < new Date()) {
                isNewlyPremium = true;
            }

            if (existingProfile) {
                let finalExpiresAt = newExpiresAt
                if (existingProfile.premiumExpiresAt && existingProfile.premiumExpiresAt > newExpiresAt) {
                    finalExpiresAt = existingProfile.premiumExpiresAt
                }

                await tx.profile.update({
                    where: { address: address.toLowerCase() },
                    data: {
                        premiumExpiresAt: finalExpiresAt,
                        premiumLastTxHash: txHash
                    }
                })
            } else {
                await tx.profile.create({
                    data: {
                        address: address.toLowerCase(),
                        status: 'UNCLAIMED',
                        premiumExpiresAt: newExpiresAt,
                        premiumLastTxHash: txHash,
                        isPublic: false,
                        displayName: address.slice(0, 6)
                    }
                })
            }

            // Save billing interaction
            const paidAt = args.paidAt ? Number(args.paidAt) : Math.floor(Date.now() / 1000)
            const amount = args.amount ? Number(args.amount) / 1e18 : 0.5

            await tx.billingInteraction.upsert({
                where: { txHash: txHash },
                update: {},
                create: {
                    userAddress: address.toLowerCase(),
                    type: 'PREMIUM',
                    description: 'Premium Plan (365 Days)',
                    amount: `${amount.toFixed(1)} AVAX`,
                    txHash: txHash,
                    timestamp: new Date(paidAt * 1000)
                }
            })

            return { success: true, isNewlyPremium, existingProfile }
        });

        // Try to trigger telegram notify logic if newly premium
        if (result && result.isNewlyPremium) {
            try {
                const { sendTelegramNotification, getAvaxPrice } = require('@/lib/telegram');
                const price = await getAvaxPrice();
                const amount = 0.5;
                const usdValue = (amount * price).toFixed(2);
                const totalPremium = await (prisma as any).profile.count({
                    where: { premiumExpiresAt: { gt: new Date() } }
                });

                const profileIdentity = result.existingProfile?.slug
                    ? `<b>${result.existingProfile.slug}</b>`
                    : `<code>${address}</code>`;

                const msg = [
                    `🚀 <b>New Premium Purchase! (Instant Sync)</b>`,
                    ``,
                    `👤 <b>User:</b> ${profileIdentity}`,
                    `💰 <b>Amount:</b> ${amount} AVAX (~$${usdValue})`,
                    `📅 <b>Expires:</b> ${newExpiresAt.toLocaleDateString()}`,
                    `🏆 <b>Total Premium:</b> ${totalPremium}`,
                    ``,
                    `⛓️ <a href="https://snowtrace.io/tx/${txHash}">View on Snowtrace</a>`
                ].join('\n');

                // Non-blocking
                sendTelegramNotification(msg).catch(console.error);
            } catch (e) { console.error('Telegram notification error', e) }
        }

        return NextResponse.json({ success: true, processed: result && !result.skipped })

    } catch (error: any) {
        console.error('[Manual Sync Error]', error)
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
    }
}
