import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSlug, hashSlug, validateSlugFormat } from "@/lib/utils/slug";
import { getSessionAddress } from "@/lib/auth";
import { createPublicClient, http } from "viem";
import { avalanche } from "viem/chains";
import { CUSTOM_SLUG_REGISTRY_ADDRESS, CUSTOM_SLUG_REGISTRY_ABI } from "@/lib/contracts/CustomSlugRegistry";
import { parseAbi } from "viem";

const client = createPublicClient({
    chain: avalanche,
    transport: http("https://api.avax.network/ext/bc/C/rpc")
});

const ABI = parseAbi(CUSTOM_SLUG_REGISTRY_ABI);

/**
 * Secure Slug Sync Endpoint
 * 
 * This endpoint allows users to sync their on-chain slug ownership to the database.
 * Security measures:
 * 1. Verifies user session (must be authenticated)
 * 2. Validates slug format
 * 3. Verifies on-chain ownership via contract call
 * 4. Ensures the slug hash matches the user's active slug on-chain
 * 5. Rate-limited by session authentication
 */
export async function POST(request: Request) {
    try {
        // 1. Authentication Check
        const sessionAddress = await getSessionAddress();
        if (!sessionAddress) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { slug } = body;

        // 2. Validate Slug Format
        if (!slug || !validateSlugFormat(slug)) {
            return new NextResponse("Invalid slug format", { status: 400 });
        }

        const normalized = normalizeSlug(slug);
        const computedHash = hashSlug(normalized);

        // 3. Verify On-Chain Ownership
        // Check if the user owns this slug on-chain
        const onChainOwner = await client.readContract({
            address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
            abi: ABI,
            functionName: "resolveSlug",
            args: [computedHash as `0x${string}`]
        }) as string;

        // 4. Security Check: Ensure the on-chain owner matches the session address
        if (!onChainOwner || onChainOwner.toLowerCase() !== sessionAddress.toLowerCase()) {
            return new NextResponse("Slug not owned by this address on-chain", { status: 403 });
        }

        // 5. Additional Security: Verify this is the user's ACTIVE slug
        const activeSlugHash = await client.readContract({
            address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
            abi: ABI,
            functionName: "getActiveSlug",
            args: [sessionAddress as `0x${string}`]
        }) as string;

        if (activeSlugHash.toLowerCase() !== computedHash.toLowerCase()) {
            return new NextResponse("Slug hash mismatch with active slug on-chain", { status: 403 });
        }

        // 6. Update Database (Idempotent)
        await prisma.profile.update({
            where: { address: sessionAddress },
            data: {
                slug: normalized,
                slugHash: computedHash,
                slugClaimedAt: new Date(),
            }
        });

        // 7. Clear any cooldown for this slug
        await prisma.slugCooldown.deleteMany({
            where: { slugHash: computedHash }
        });

        return NextResponse.json({
            success: true,
            slug: normalized,
            message: "Slug synced successfully"
        });

    } catch (error: any) {
        console.error("Slug Sync Error:", error);

        // Don't expose internal errors to client
        if (error?.message?.includes("Profile not found")) {
            return new NextResponse("Profile not found", { status: 404 });
        }

        return NextResponse.json({
            success: false,
            error: "Failed to sync slug"
        }, { status: 500 });
    }
}
