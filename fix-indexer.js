
const { PrismaClient } = require('@prisma/client');
const { createPublicClient, http } = require('viem');
const { avalanche } = require('viem/chains');

const prisma = new PrismaClient();
const client = createPublicClient({
    chain: avalanche,
    transport: http(),
});

async function main() {
    console.log("--- Debugging Premium Sync ---");

    const block = await client.getBlockNumber();
    console.log(`Current Chain Block: ${block}`);

    const state = await prisma.indexerState.findUnique({
        where: { key: 'premium_payment_v1' }
    });
    console.log("Indexer State in DB:", state);

    if (state) {
        const gap = block - BigInt(state.lastSyncedBlock);
        console.log(`Gap: ${gap} blocks`);

        if (gap > 10000n) {
            console.log("!!! GAP IS TOO LARGE !!!");
            console.log(" The indexer is stuck in the past. It will take too long to catch up.");
            console.log(" RESETTING IndexerState to current_block - 5000 ...");

            // Reset to a very recent block (e.g., 5000 blocks ago) to catch the tx immediately
            // without waiting for 100k blocks to sync.
            const safeStart = block - 5000n;

            await prisma.indexerState.update({
                where: { key: 'premium_payment_v1' },
                data: { lastSyncedBlock: safeStart }
            });
            console.log(`Reset lastSyncedBlock to ${safeStart} (Fast Track)`);
        }
    } else {
        console.log("No IndexerState found. It will be created on first run.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
