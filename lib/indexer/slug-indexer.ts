import { createPublicClient, http, parseAbiItem, decodeEventLog } from "viem";
import { avalanche } from "viem/chains";
import { prisma } from "@/lib/prisma";
import { CUSTOM_SLUG_REGISTRY_ADDRESS, CUSTOM_SLUG_REGISTRY_ABI } from "@/lib/contracts/CustomSlugRegistry";

const client = createPublicClient({
    chain: avalanche,
    transport: http("https://api.avax.network/ext/bc/C/rpc")
});

/**
 * Blockchain Indexer for CustomSlugRegistry
 * 
 * Syncs on-chain slug events to the database:
 * - SlugClaimed: Creates/updates profile with new slug
 * - SlugReleased: Clears slug and creates cooldown
 * - ActiveSlugSet: Updates active slug for user
 */

export async function indexSlugEvents(fromBlock: bigint, toBlock: bigint) {
    console.log(`[Indexer] Scanning blocks ${fromBlock} to ${toBlock}`);

    // Fetch SlugClaimed events
    const claimedLogs = await client.getLogs({
        address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
        event: parseAbiItem("event SlugClaimed(bytes32 indexed slugHash, address indexed owner, uint256 timestamp)"),
        fromBlock,
        toBlock
    });

    // Fetch SlugReleased events
    const releasedLogs = await client.getLogs({
        address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
        event: parseAbiItem("event SlugReleased(bytes32 indexed slugHash, address indexed previousOwner, uint256 releasedAt, uint256 cooldownEndsAt)"),
        fromBlock,
        toBlock
    });

    console.log(`[Indexer] Found ${claimedLogs.length} SlugClaimed, ${releasedLogs.length} SlugReleased events`);

    // Process SlugClaimed events
    for (const log of claimedLogs) {
        try {
            const { slugHash, owner, timestamp } = log.args as {
                slugHash: string;
                owner: string;
                timestamp: bigint;
            };

            // Get transaction to decode slug text from input
            const tx = await client.getTransaction({
                hash: log.transactionHash!
            });

            // Decode transaction input to get slug text
            // claim(string _slug) - function selector: 0x379607f5
            if (tx.input.startsWith('0x379607f5')) {
                try {
                    // Decode ABI-encoded string parameter
                    const decoded = decodeEventLog({
                        abi: [{
                            type: 'function',
                            name: 'claim',
                            inputs: [{ name: '_slug', type: 'string' }]
                        }],
                        data: tx.input.slice(10), // Remove function selector
                        topics: []
                    });

                    const slugText = (decoded as any)._slug || '';

                    if (slugText) {
                        console.log(`[Indexer] SlugClaimed: "${slugText}" (${slugHash}) by ${owner}`);

                        // Update profile with slug
                        await prisma.profile.upsert({
                            where: { address: owner.toLowerCase() },
                            create: {
                                address: owner.toLowerCase(),
                                slug: slugText.toLowerCase(),
                                slugHash: slugHash.toLowerCase(),
                                slugClaimedAt: new Date(Number(timestamp) * 1000)
                            },
                            update: {
                                slug: slugText.toLowerCase(),
                                slugHash: slugHash.toLowerCase(),
                                slugClaimedAt: new Date(Number(timestamp) * 1000)
                            }
                        });
                    }
                } catch (decodeError) {
                    console.error("[Indexer] Failed to decode slug text:", decodeError);
                    // Fallback: just log the hash
                    console.log(`[Indexer] SlugClaimed: ${slugHash} by ${owner} (text decode failed)`);
                }
            }
        } catch (error) {
            console.error("[Indexer] Error processing SlugClaimed event:", error);
        }
    }

    // Process SlugReleased events
    for (const log of releasedLogs) {
        try {
            const { slugHash, previousOwner, releasedAt, cooldownEndsAt } = log.args as {
                slugHash: string;
                previousOwner: string;
                releasedAt: bigint;
                cooldownEndsAt: bigint;
            };

            console.log(`[Indexer] SlugReleased: ${slugHash} by ${previousOwner}`);

            // Clear slug from profile
            await prisma.profile.updateMany({
                where: {
                    address: previousOwner.toLowerCase(),
                    slugHash: slugHash.toLowerCase()
                },
                data: {
                    slug: null,
                    slugHash: null
                }
            });

            // Create cooldown entry
            await prisma.slugCooldown.create({
                data: {
                    slug: "", // We don't have slug text from event
                    slugHash: slugHash.toLowerCase(),
                    previousOwner: previousOwner.toLowerCase(),
                    releasedAt: new Date(Number(releasedAt) * 1000),
                    cooldownEndsAt: new Date(Number(cooldownEndsAt) * 1000)
                }
            });

            console.log(`[Indexer] Created cooldown for ${slugHash}`);
        } catch (error) {
            console.error("[Indexer] Error processing SlugReleased event:", error);
        }
    }

    return {
        claimed: claimedLogs.length,
        released: releasedLogs.length
    };
}

/**
 * Get the last synced block from database
 */
export async function getLastSyncedBlock(): Promise<bigint> {
    const state = await prisma.indexerState.findUnique({
        where: { key: "slug_registry" }
    });

    return state?.lastSyncedBlock ?? 0n;
}

/**
 * Update the last synced block in database
 */
export async function updateLastSyncedBlock(blockNumber: bigint) {
    await prisma.indexerState.upsert({
        where: { key: "slug_registry" },
        create: {
            key: "slug_registry",
            lastSyncedBlock: blockNumber
        },
        update: {
            lastSyncedBlock: blockNumber
        }
    });
}
