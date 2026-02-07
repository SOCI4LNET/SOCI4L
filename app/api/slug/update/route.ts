import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSlug, hashSlug, validateSlugFormat } from "@/lib/utils/slug";
import { getSessionAddress } from "@/lib/auth"; // Assuming auth setup exists

export async function POST(request: Request) {
    try {
        const address = await getSessionAddress();
        if (!address) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { action, slug, txHash } = body;
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

            // Optimistic Update: Set slug for user
            // We trust the user for UI immediate feedback.
            // The indexer will reconcile eventually if tx fails (revert/block reorg).
            // But for "Claim", we want to show it NOW.

            await prisma.profile.update({
                where: { address: address },
                data: {
                    slug: normalized,
                    slugHash: computedHash,
                    slugClaimedAt: new Date(),
                }
            });

            // Clear any cooldown for this slug
            await prisma.slugCooldown.deleteMany({
                where: { slugHash: computedHash }
            });

            return NextResponse.json({ success: true, slug: normalized });
        }

        if (action === "release") {
            // For release, we need to know WHICH slug was released.
            // Usually the current active slug of the user.
            const profile = await prisma.profile.findUnique({
                where: { address: address }
            });

            if (!profile?.slugHash) {
                return new NextResponse("No active slug to release", { status: 400 });
            }

            const slugHash = profile.slugHash;
            const slug = profile.slug;

            // Optimistic Update: Clear from profile, Add to Cooldown
            // We calculate cooldown based on current server time (approximate block time)
            const now = new Date();
            const cooldownEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            await prisma.$transaction([
                prisma.slugCooldown.upsert({
                    where: { slugHash: slugHash },
                    create: {
                        slug: slug!,
                        slugHash: slugHash,
                        previousOwner: address,
                        releasedAt: now,
                        cooldownEndsAt: cooldownEndsAt
                    },
                    update: {
                        releasedAt: now,
                        cooldownEndsAt: cooldownEndsAt,
                        previousOwner: address
                    }
                }),
                prisma.profile.update({
                    where: { address: address },
                    data: {
                        slug: null,
                        slugHash: null,
                        slugClaimedAt: null
                    }
                })
            ]);

            return NextResponse.json({ success: true });
        }

        return new NextResponse("Invalid action", { status: 400 });

    } catch (error) {
        console.error("Slug Update Error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
