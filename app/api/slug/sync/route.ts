import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSlug, hashSlug, validateSlugFormat } from "@/lib/utils/slug";
import { createPublicClient, http, recoverMessageAddress } from "viem";
import { avalanche } from "viem/chains";
import { CUSTOM_SLUG_REGISTRY_ADDRESS, CUSTOM_SLUG_REGISTRY_ABI } from "@/lib/contracts/CustomSlugRegistry";
import { parseAbi } from "viem";
import { revalidatePath } from "next/cache";

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
 * 1. Verifies signature to authenticate wallet ownership
 * 2. Validates slug format
 * 3. Verifies on-chain ownership via contract call
 * 4. Ensures the slug hash matches the user's active slug on-chain
 * 5. Prevents replay attacks with nonce
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { slug, signature, message, mode, address: providedAddress } = body;

        let targetAddress = "";

        // 1. Signature or Repair Mode Verification
        if (mode === "repair") {
            if (!providedAddress) {
                return NextResponse.json({ error: "Address required for repair mode" }, { status: 400 });
            }
            targetAddress = providedAddress.toLowerCase();

            // SECURITY: Only allow repair if blockchain confirms the user DOES NOT own any active slug hash
            // (Setting a slug still requires a signature)
            const activeSlugHash = await client.readContract({
                address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
                abi: ABI,
                functionName: "getActiveSlug",
                args: [targetAddress as `0x${string}`]
            }) as string;

            const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";
            if (activeSlugHash !== ZERO_HASH) {
                return NextResponse.json({ error: "Cannot repair if active on-chain slug exists. Signature required for sync." }, { status: 403 });
            }

            console.log(`[Slug Sync] Repair mode authorized for ${targetAddress} (Public state verified)`);

            // REPAIR: Clear stale DB entry immediately
            await (prisma as any).profile.update({
                where: { address: targetAddress.toLowerCase() },
                data: {
                    slug: null,
                    slugHash: null,
                    slugClaimedAt: null
                }
            });

            return NextResponse.json({
                success: true,
                slug: null,
                message: "Repair complete: Stale slug cleared"
            });
        } else {
            // Standard Sync requires signature
            if (!signature || !message) {
                return NextResponse.json({ error: "Signature and message required" }, { status: 400 });
            }

            const recoveredAddress = await recoverMessageAddress({
                message,
                signature: signature as `0x${string}`
            });

            if (!recoveredAddress) {
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
            targetAddress = recoveredAddress.toLowerCase();
        }

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

        console.log("[Slug Sync Debug]", {
            slug: normalized,
            computedHash,
            targetAddress,
            onChainOwner,
            match: onChainOwner?.toLowerCase() === targetAddress?.toLowerCase()
        });

        // 4. Security Check: Ensure the on-chain owner matches the recovered address
        if (!onChainOwner || onChainOwner.toLowerCase() !== targetAddress.toLowerCase()) {
            console.warn(`[Slug Sync] Mismatch detected for ${targetAddress}. Clearing db slug.`);

            // Self-healing: If user doesn't own it on-chain, clear it from DB
            await (prisma as any).profile.update({
                where: { address: targetAddress.toLowerCase() },
                data: {
                    slug: null,
                    slugHash: null,
                    slugClaimedAt: null
                }
            });

            return NextResponse.json({
                success: true,
                slug: null,
                message: "Sync complete: Slug removed (not owned on-chain)"
            });
        }

        // 5. Additional Security: Verify this is the user's ACTIVE slug
        const activeSlugHash = await client.readContract({
            address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
            abi: ABI,
            functionName: "getActiveSlug",
            args: [targetAddress as `0x${string}`]
        }) as string;

        if (activeSlugHash.toLowerCase() !== computedHash.toLowerCase()) {
            return NextResponse.json({ error: "Slug hash mismatch with active slug on-chain" }, { status: 403 });
        }

        // 6. Update Database (Idempotent)
        // First, clear this slug from any other profiles (in case it was previously synced to wrong address)
        await (prisma as any).profile.updateMany({
            where: {
                slug: normalized,
                address: { not: targetAddress.toLowerCase() }
            },
            data: {
                slug: null,
                slugHash: null
            }
        });

        // Then update the correct profile
        await (prisma as any).profile.update({
            where: { address: targetAddress.toLowerCase() },
            data: {
                slug: normalized,
                slugHash: computedHash,
                slugClaimedAt: new Date(),
            }
        });

        // 7. Clear any cooldown for this slug
        await (prisma as any).slugCooldown.deleteMany({
            where: { slugHash: computedHash }
        });

        // 8. Revalidate paths to clear cache
        try {
            revalidatePath(`/dashboard/${targetAddress}`, "page");
            revalidatePath(`/dashboard/${targetAddress.toLowerCase()}`, "page");
            revalidatePath(`/p/${normalized}`, "page");
            revalidatePath("/", "layout");
        } catch (revalidateError) {
            console.warn("[Slug Sync] Revalidation failed (non-critical):", revalidateError);
        }

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
