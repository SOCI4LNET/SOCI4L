import { NextResponse } from "next/server";
import { indexSlugEvents, getLastSyncedBlock, updateLastSyncedBlock } from "@/lib/indexer/slug-indexer";
import { createPublicClient, http } from "viem";
import { avalanche } from "viem/chains";

const client = createPublicClient({
    chain: avalanche,
    transport: http("https://api.avax.network/ext/bc/C/rpc")
});

/**
 * Cron endpoint to sync blockchain events to database
 * 
 * Call this endpoint periodically (e.g., every 5 minutes) to keep DB in sync
 * with on-chain slug registry events.
 * 
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-slugs",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret (optional but recommended)
        const authHeader = request.headers.get("authorization");
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get current block number
        const currentBlock = await client.getBlockNumber();

        // Get last synced block
        const lastSyncedBlock = await getLastSyncedBlock();

        // If this is the first sync, start from 100 blocks ago (not too far back)
        const fromBlock = lastSyncedBlock === 0n
            ? currentBlock - 100n
            : lastSyncedBlock + 1n;

        // Don't sync if we're already up to date
        if (fromBlock > currentBlock) {
            return NextResponse.json({
                success: true,
                message: "Already up to date",
                currentBlock: currentBlock.toString(),
                lastSyncedBlock: lastSyncedBlock.toString()
            });
        }

        // Sync events in batches (RPC limit: 2048 blocks per request)
        const BATCH_SIZE = 2000n;
        let totalResult = { claimed: 0, released: 0 };

        let currentFrom = fromBlock;
        while (currentFrom <= currentBlock) {
            const currentTo = currentFrom + BATCH_SIZE > currentBlock
                ? currentBlock
                : currentFrom + BATCH_SIZE;

            console.log(`[Cron] Syncing blocks ${currentFrom} to ${currentTo}`);

            const batchResult = await indexSlugEvents(currentFrom, currentTo);
            totalResult.claimed += batchResult.claimed;
            totalResult.released += batchResult.released;

            currentFrom = currentTo + 1n;
        }

        // Update last synced block
        await updateLastSyncedBlock(currentBlock);

        return NextResponse.json({
            success: true,
            fromBlock: fromBlock.toString(),
            toBlock: currentBlock.toString(),
            eventsProcessed: totalResult
        });

    } catch (error: any) {
        console.error("[Cron] Slug sync error:", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// Allow manual trigger via POST
export async function POST(request: Request) {
    return GET(request);
}
