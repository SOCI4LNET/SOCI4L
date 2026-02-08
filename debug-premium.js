
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

    // 1. Current Block
    const block = await client.getBlockNumber();
    console.log(`Current Block on Chain: ${block}`);

    // 2. Indexer State
    const state = await prisma.indexerState.findUnique({
        where: { key: 'premium_payment_v1' }
    });
    console.log("Indexer State:", state);

    // 3. User Profile Check
    // We don't have the user's FULL address from the screenshot, but we can list all profiles with premium
    // or just list recent profiles.
    console.log("\n--- Recent Profiles ---");
    const profiles = await prisma.profile.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: { address: true, slug: true, premiumExpiresAt: true }
    });
    console.table(profiles);

    // 4. Check for events in recent blocks
    // User said they paid "1 day ago" ... wait, the screenshot says "Premium Unlocked! (Indexing...)" 1 day ago?
    // User request: "0.5 avax ödedim ... sayfayı yeniledim ve hala para ödememi istiyor"
    // The screenshot shows notifications from "1 day ago" and "3 days ago".
    // Wait, the user just said "0.5 avax ödedim" implies recently.
    // Maybe the notifications are old? Or the user tried multiple times.

}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
