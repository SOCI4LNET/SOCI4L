
const { PrismaClient } = require('@prisma/client');
const { createPublicClient, http, parseAbiItem } = require('viem');
const { avalanche } = require('viem/chains');

const prisma = new PrismaClient();
const client = createPublicClient({
    chain: avalanche,
    transport: http(),
});

const PREMIUM_PAYMENT_ADDRESS = '0x9bA02537447E6DcdeF72D0e98a4C82E6B73E3cCC';
const EVENT = parseAbiItem('event PremiumPurchased(address indexed user, uint256 paidAt, uint256 expiresAt, uint256 amount)');
const INDEXER_KEY = 'premium_payment_v1';

async function main() {
    console.log("--- Manual Premium Sync ---");

    // 1. Get State
    let state = await prisma.indexerState.findUnique({ where: { key: INDEXER_KEY } });
    if (!state) {
        console.log("No state found, creating...");
        state = await prisma.indexerState.create({
            data: { key: INDEXER_KEY, lastSyncedBlock: 77580000n } // Default safe start
        });
    }

    const currentBlock = await client.getBlockNumber();
    let fromBlock = BigInt(state.lastSyncedBlock) + 1n;

    // Chunking logic
    const MAX_CHUNK = 2000n;
    let processed = 0;

    console.log(`Starting sync from ${fromBlock} to ${currentBlock}`);

    while (fromBlock <= currentBlock) {
        let toBlock = fromBlock + MAX_CHUNK;
        if (toBlock > currentBlock) {
            toBlock = currentBlock;
        }

        console.log(`Syncing chunk: ${fromBlock} to ${toBlock}...`);

        try {
            const logs = await client.getLogs({
                address: PREMIUM_PAYMENT_ADDRESS,
                event: EVENT,
                fromBlock,
                toBlock
            });

            console.log(`Found ${logs.length} events in this chunk.`);

            for (const log of logs) {
                const { args } = log;
                if (!args.user || !args.expiresAt) continue;

                const userAddress = args.user.toLowerCase();
                const newExpiresAt = new Date(Number(args.expiresAt) * 1000);

                console.log(`Processing user: ${userAddress}, Expires: ${newExpiresAt}`);

                const profile = await prisma.profile.findUnique({ where: { address: userAddress } });

                if (profile) {
                    let finalExpiresAt = newExpiresAt;
                    if (profile.premiumExpiresAt && profile.premiumExpiresAt > newExpiresAt) {
                        finalExpiresAt = profile.premiumExpiresAt;
                    }

                    await prisma.profile.update({
                        where: { address: userAddress },
                        data: { premiumExpiresAt: finalExpiresAt }
                    });
                    console.log(`Updated profile for ${userAddress}`);
                    processed++;
                } else {
                    console.warn(`Profile not found for ${userAddress}`);
                }
            }

            // Update state after each chunk for safety
            await prisma.indexerState.update({
                where: { key: INDEXER_KEY },
                data: { lastSyncedBlock: toBlock }
            });

            fromBlock = toBlock + 1n;

        } catch (e) {
            console.error("Error syncing chunk:", e);
            break;
        }
    }

    console.log(`Sync complete. Processed ${processed} profiles.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
