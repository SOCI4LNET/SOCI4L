import { createPublicClient, http, parseAbiItem } from "viem";
import { avalanche } from "viem/chains";
import { prisma } from "@/lib/prisma";
import { CUSTOM_SLUG_REGISTRY_ADDRESS } from "@/lib/contracts/CustomSlugRegistry";

// Using a public RPC for reading events if not configured
const client = createPublicClient({
    chain: avalanche,
    transport: http("https://api.avax.network/ext/bc/C/rpc")
});

const INDEXER_KEY = "slug_registry";
// Start block for the contract deployment (approximate or 0 to scan from start)
// 0x050a25Dced3A50F8af47728fE8D25c0ABbC8bFcb deployed roughly now.
const DEPLOYMENT_BLOCK = 57430000n; // Approximate recent block to save time, or 0n safe.
const BATCH_SIZE = 2000n;

export async function syncSlugEvents() {
    // 1. Get last synced block
    let lastSyncedBlock = DEPLOYMENT_BLOCK;
    const indexerState = await prisma.indexerState.findUnique({ where: { key: INDEXER_KEY } });

    if (indexerState) {
        lastSyncedBlock = BigInt(indexerState.lastSyncedBlock);
    } else {
        // Initialize state if not exists
        await prisma.indexerState.create({
            data: { key: INDEXER_KEY, lastSyncedBlock: DEPLOYMENT_BLOCK }
        });
    }

    const currentBlock = await client.getBlockNumber();
    const toBlock = lastSyncedBlock + BATCH_SIZE > currentBlock ? currentBlock : lastSyncedBlock + BATCH_SIZE;

    if (lastSyncedBlock >= currentBlock) {
        console.log("Indexer: Already up to date.");
        return;
    }

    console.log(`Indexer: Syncing from ${lastSyncedBlock} to ${toBlock}...`);

    // 2. Fetch events
    const logs = await client.getLogs({
        address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
        fromBlock: lastSyncedBlock + 1n,
        toBlock: toBlock,
        events: [
            parseAbiItem('event SlugClaimed(bytes32 indexed slugHash, address indexed owner, uint256 timestamp)'),
            parseAbiItem('event SlugReleased(bytes32 indexed slugHash, address indexed previousOwner, uint256 releasedAt, uint256 cooldownEndsAt)')
        ]
    });

    // 3. Process events
    for (const log of logs) {
        const { eventName, args } = log;
        // Viem args are typed. timestamp is bigint.

        if (eventName === "SlugClaimed") {
            const { slugHash, owner, timestamp } = args;
            const timestampDate = new Date(Number(timestamp) * 1000);

            // Optimistic update should have handled this, but we reinforce it.
            // If we don't know the slug string (no optimistic update), we can only update metadata.
            await prisma.profile.updateMany({
                where: { address: owner?.toLowerCase() },
                data: {
                    slugHash: slugHash,
                    slugClaimedAt: timestampDate,
                }
            });

            // Cleanup cooldown if exists (re-claimed)
            await prisma.slugCooldown.deleteMany({
                where: { slugHash: slugHash }
            });

        } else if (eventName === 'SlugReleased') {
            const { slugHash, previousOwner, releasedAt, cooldownEndsAt } = args;

            // 1. Find the profile that owns this slug hash
            const profile = await prisma.profile.findFirst({
                where: { slugHash: slugHash }
            });

            if (profile && profile.slug) {
                // 2. Create Cooldown Record
                await prisma.slugCooldown.upsert({
                    where: { slugHash: slugHash },
                    update: {
                        releasedAt: new Date(Number(releasedAt) * 1000),
                        cooldownEndsAt: new Date(Number(cooldownEndsAt) * 1000),
                        previousOwner: previousOwner?.toLowerCase() || ""
                    },
                    create: {
                        slug: profile.slug, // Valid because we found the profile
                        slugHash: slugHash!,
                        previousOwner: previousOwner?.toLowerCase() || "",
                        releasedAt: new Date(Number(releasedAt) * 1000),
                        cooldownEndsAt: new Date(Number(cooldownEndsAt) * 1000)
                    }
                });

                // 3. Clear Profile slug data
                await prisma.profile.update({
                    where: { id: profile.id },
                    data: {
                        slug: null,
                        slugHash: null,
                        slugClaimedAt: null
                    }
                });
            }
        }
    }

    // 4. Update cursor
    await prisma.indexerState.update({
        where: { key: INDEXER_KEY },
        data: { lastSyncedBlock: toBlock }
    });

    console.log(`Indexer: Synced up to block ${toBlock}.`);
}
