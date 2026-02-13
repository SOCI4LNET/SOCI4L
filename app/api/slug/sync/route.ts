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
 * 1. Verifies signature to authenticate wallet ownership (Standard Mode)
 * 2. REPAIR/AUTO-SYNC MODE: Uses on-chain state as Proof-of-Ownership (No signature required)
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { slug, signature, message, mode, address: providedAddress } = body;

        let targetAddress = "";
        let isSyncingSpecificSlug = false;

        // 1. Authorization: Signature OR On-Chain Proof (Repair/Auto-Sync mode)
        if (mode === "repair") {
            if (!providedAddress) {
                return NextResponse.json({ error: "Address required for repair mode" }, { status: 400 });
            }
            targetAddress = providedAddress.toLowerCase();

            // Fetch active on-chain slug hash for this address
            const activeSlugHash = await client.readContract({
                address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
                abi: ABI,
                functionName: "getActiveSlug",
                args: [targetAddress as `0x${string}`]
            }) as string;

            const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

            // If a slug is provided, we are attempting to SYNC/RECOVER it immasignature-free
            if (slug) {
                if (!validateSlugFormat(slug)) {
                    return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
                }
                const normalized = normalizeSlug(slug);
                const computedHash = hashSlug(normalized);

                // SECURITY: Only allow if the provided slug matches their on-chain active hash
                if (activeSlugHash.toLowerCase() !== computedHash.toLowerCase()) {
                    return NextResponse.json({
                        error: "On-chain hash mismatch. Cannot recover slug without signature."
                    }, { status: 403 });
                }

                isSyncingSpecificSlug = true;
                console.log(`[Slug Sync] Seamless Recovery authorized for ${normalized} -> ${targetAddress}`);
            } else {
                // No slug provided: This is a CLEANUP operation (User has no active slug on-chain)
                if (activeSlugHash !== ZERO_HASH) {
                    return NextResponse.json({
                        error: "Cannot clear DB while active on-chain slug exists. Signature required for sync."
                    }, { status: 403 });
                }
                console.log(`[Slug Sync] Cleanup authorized for ${targetAddress} (Public state verified)`);
            }
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

        // 2. Perform DB Updates

        // Strategy: 
        // A. If we are in CLEANUP mode (no slug), clear everything.
        // B. If we are in SYNC mode (standard or recovery), ensure uniqueness and upsert.

        if (!isSyncingSpecificSlug && !slug) {
            // CLEANUP / REPAIR: Clear stale DB entry
            await (prisma as any).profile.update({
                where: { address: targetAddress.toLowerCase() },
                data: {
                    slug: null,
                    slugHash: null,
                    slugClaimedAt: null
                }
            });

            // Revalidate
            try { revalidatePath(`/dashboard/${targetAddress}`, "page"); } catch (e) { }

            return NextResponse.json({
                success: true,
                slug: null,
                message: "Repair complete: Stale slug cleared"
            });
        }

        // SYNC / RECOVERY MODE
        const normalized = normalizeSlug(slug);
        const computedHash = hashSlug(normalized);

        // Security reinforcement for Standard Mode (Signature provided)
        if (mode !== "repair") {
            // Verify on-chain resolveSlug matches targetAddress
            const onChainOwner = await client.readContract({
                address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
                abi: ABI,
                functionName: "resolveSlug",
                args: [computedHash as `0x${string}`]
            }) as string;

            if (!onChainOwner || onChainOwner.toLowerCase() !== targetAddress.toLowerCase()) {
                // Self-healing: clear if mismatch
                await (prisma as any).profile.update({
                    where: { address: targetAddress.toLowerCase() },
                    data: { slug: null, slugHash: null, slugClaimedAt: null }
                });
                return NextResponse.json({ success: true, slug: null, message: "Sync complete: Slug removed (not owned)" });
            }

            // Verify it's their ACTIVE slug
            const activeHash = await client.readContract({
                address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
                abi: ABI,
                functionName: "getActiveSlug",
                args: [targetAddress as `0x${string}`]
            }) as string;

            if (activeHash.toLowerCase() !== computedHash.toLowerCase()) {
                return NextResponse.json({ error: "Slug mismatch with active on-chain record" }, { status: 403 });
            }
        }

        // UPDATE DATABASE (Shared for both recovery and standard modes)

        // 1. Clear from anyone else
        await (prisma as any).profile.updateMany({
            where: {
                slug: normalized,
                address: { not: targetAddress.toLowerCase() }
            },
            data: { slug: null, slugHash: null }
        });

        // 2. Upsert for target user
        const existingProfile = await (prisma as any).profile.findUnique({
            where: { address: targetAddress.toLowerCase() }
        });

        await (prisma as any).profile.update({
            where: { address: targetAddress.toLowerCase() },
            data: {
                slug: normalized,
                slugHash: computedHash,
                slugClaimedAt: new Date(),
                // Fix: Ensure profile is marked as CLAIMED
                status: 'CLAIMED',
                ownerAddress: targetAddress.toLowerCase(),
                owner: targetAddress.toLowerCase(), // backward compatibility
                claimedAt: existingProfile?.claimedAt || new Date(),
                visibility: existingProfile?.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC', // Default to public if not set
            }
        });

        // 3. Clear cooldown
        await (prisma as any).slugCooldown.deleteMany({
            where: { slugHash: computedHash }
        });

        // 4. Revalidate
        try {
            revalidatePath(`/dashboard/${targetAddress}`, "page");
            revalidatePath(`/p/${normalized}`, "page");
            revalidatePath("/", "layout");
        } catch (revalidateError) {
            console.warn("[Slug Sync] Revalidation failed (non-critical):", revalidateError);
        }

        return NextResponse.json({
            success: true,
            slug: normalized,
            message: mode === "repair" ? "Seamless Sync successful" : "Slug synced successfully"
        });

    } catch (error: any) {
        console.error("Slug Sync Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to sync slug"
        }, { status: 500 });
    }
}
