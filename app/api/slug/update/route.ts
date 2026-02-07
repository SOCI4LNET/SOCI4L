import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSlug, hashSlug, validateSlugFormat } from "@/lib/utils/slug";
import { revalidatePath } from "next/cache";
import { getSessionAddress } from "@/lib/auth";
import { createPublicClient, http, decodeFunctionData, parseAbi, type Address } from "viem";
import { avalanche } from "viem/chains";

const client = createPublicClient({
    chain: avalanche,
    transport: http("https://api.avax.network/ext/bc/C/rpc")
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, slug, txHash, address: bodyAddress } = body;

        let address = await getSessionAddress();

        // If session address is missing but we have a txHash and address in body, verify the transaction
        if (!address && txHash && bodyAddress) {
            try {
                const tx = await client.getTransaction({ hash: txHash as `0x${string}` });

                // 1. Verify transaction sender matches the claimed address
                if (tx.from.toLowerCase() !== bodyAddress.toLowerCase()) {
                    console.error(`[Slug Update] Transaction sender mismatch: ${tx.from} vs ${bodyAddress}`);
                    throw new Error("Transaction sender mismatch");
                }

                // 2. Verify contract address (tx.to) matches Registry
                const REGISTRY_ADDRESS = "0xC894a2677C7E619E9692E3bF4AFF58bE53173aA1".toLowerCase();
                if (!tx.to || tx.to.toLowerCase() !== REGISTRY_ADDRESS) {
                    console.error(`[Slug Update] Transaction target mismatch: ${tx.to} vs ${REGISTRY_ADDRESS}`);
                    throw new Error("Transaction target mismatch - not sent to Slug Registry");
                }

                // 3. Decode input data to verify function called and arguments
                const abi = parseAbi([
                    "function claim(string _slug) external",
                    "function release() external"
                ]);

                const decoded = decodeFunctionData({
                    abi,
                    data: tx.input
                });

                // 4. Verify action matches decoded function and arguments
                if (action === "claim") {
                    if (decoded.functionName !== "claim") {
                        throw new Error(`Action mismatch: expected 'claim' but tx called '${decoded.functionName}'`);
                    }
                    const txSlug = (decoded.args as readonly [string])[0];
                    if (normalizeSlug(txSlug) !== normalizeSlug(slug)) {
                        throw new Error(`Slug mismatch: tx claimed '${txSlug}' but request is for '${slug}'`);
                    }
                } else if (action === "release") {
                    if (decoded.functionName !== "release") {
                        throw new Error(`Action mismatch: expected 'release' but tx called '${decoded.functionName}'`);
                    }
                }

                // If we passed all checks, we trust the address from the body
                address = bodyAddress;
                console.log(`[Slug Update] Strictly verified via transaction: ${txHash} for ${address}`);

            } catch (txError) {
                console.error("[Slug Update] Transaction verification failed:", txError);
                // Return unauthorized if verification fails
                return new NextResponse("Unauthorized - Transaction verification failed", { status: 401 });
            }
        }

        if (!address) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // action: 'claim' | 'release'

        if (!txHash) {
            return new NextResponse("Missing txHash", { status: 400 });
        }

        if (action === "claim") {
            if (!slug || !validateSlugFormat(slug)) {
                return new NextResponse("Invalid slug format", { status: 400 });
            }

            const normalized = normalizeSlug(slug);
            const computedHash = hashSlug(normalized);

            // 1. Cleanup: If this slug is assigned to ANY OTHER profile in the DB, clear it
            // This prevents unique constraint violations if the slug was previously synced to wrong addr
            await (prisma as any).profile.updateMany({
                where: {
                    slug: normalized,
                    address: { not: address.toLowerCase() }
                },
                data: {
                    slug: null,
                    slugHash: null
                }
            });

            // 2. Optimistic Update: Set slug for user
            await (prisma as any).profile.upsert({
                where: { address: address.toLowerCase() },
                create: {
                    address: address.toLowerCase(),
                    slug: normalized,
                    slugHash: computedHash,
                    slugClaimedAt: new Date(),
                },
                update: {
                    slug: normalized,
                    slugHash: computedHash,
                    slugClaimedAt: new Date(),
                }
            });

            // 3. Clear any cooldown for this slug
            await (prisma as any).slugCooldown.deleteMany({
                where: { slugHash: computedHash }
            });

            // 4. Revalidate paths to clear cache
            try {
                revalidatePath(`/dashboard/${address}`, "page");
                revalidatePath(`/p/${normalized}`, "page");
                revalidatePath("/", "layout");
            } catch (revalidateError) {
                console.warn("[Slug Update] Revalidation failed (non-critical):", revalidateError);
            }

            return NextResponse.json({ success: true, slug: normalized });
        }

        if (action === "release") {
            const profile = await prisma.profile.findUnique({
                where: { address: address.toLowerCase() }
            });

            if (!(profile as any)?.slugHash) {
                console.warn("[Slug Release] No active slug found in DB, but proceeding with cleanup based on request");
            }

            // Even if DB doesn't have it, if the tx says release, we clear the user's slug
            const now = new Date();
            const cooldownEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            // If we know the slug hash (from DB), upsert cooldown. 
            // If not, we can't easily add cooldown without knowing the slug hash, 
            // but we can definitely clear the profile.

            if ((profile as any)?.slugHash && (profile as any)?.slug) {
                await (prisma as any).slugCooldown.upsert({
                    where: { slugHash: (profile as any).slugHash },
                    create: {
                        slug: (profile as any).slug,
                        slugHash: (profile as any).slugHash,
                        previousOwner: address.toLowerCase(),
                        releasedAt: now,
                        cooldownEndsAt: cooldownEndsAt
                    },
                    update: {
                        releasedAt: now,
                        cooldownEndsAt: cooldownEndsAt,
                        previousOwner: address.toLowerCase()
                    }
                });
            }

            await (prisma as any).profile.update({
                where: { address: address.toLowerCase() },
                data: {
                    slug: null,
                    slugHash: null,
                    slugClaimedAt: null
                }
            });

            return NextResponse.json({ success: true });
        }

        return new NextResponse("Invalid action", { status: 400 });

    } catch (error) {
        console.error("Slug Update Error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
