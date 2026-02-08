
const { PrismaClient } = require('@prisma/client');
const { createPublicClient, http, parseAbiItem } = require('viem');
const { avalanche } = require('viem/chains');

const prisma = new PrismaClient();
const client = createPublicClient({
    chain: avalanche,
    transport: http(),
});

const ADDRESS = '0x9bA02537447E6DcdeF72D0e98a4C82E6B73E3cCC';
const EVENT = parseAbiItem('event PremiumPurchased(address indexed user, uint256 paidAt, uint256 expiresAt, uint256 amount)');

async function main() {
    console.log("--- Debugging Premium Sync (Event Scan) ---");

    const currentBlock = await client.getBlockNumber();
    console.log(`Current Block: ${currentBlock}`);

    // Scan last 2000 blocks to fit RPC limit
    const fromBlock = currentBlock - 2000n;
    console.log(`Scanning for events from ${fromBlock} to ${currentBlock}...`);

    const logs = await client.getLogs({
        address: ADDRESS,
        event: EVENT,
        fromBlock,
        toBlock: currentBlock
    });

    console.log(`Found ${logs.length} events.`);

    for (const log of logs) {
        console.log(`- Tx: ${log.transactionHash}`);
        console.log(`  User: ${log.args.user}`);
        console.log(`  Expires: ${new Date(Number(log.args.expiresAt) * 1000)}`);

        // Check if this user is in DB
        const profile = await prisma.profile.findUnique({
            where: { address: log.args.user.toLowerCase() },
            select: { address: true, premiumExpiresAt: true, slug: true }
        });
        console.log(`  DB Profile:`, profile);
    }

    const state = await prisma.indexerState.findUnique({
        where: { key: 'premium_payment_v1' }
    });
    console.log("Indexer State:", state);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
