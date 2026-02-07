import { keccak256, encodePacked } from "viem";

export function normalizeSlug(slug: string): string {
    return slug.trim().toLowerCase();
}

export function hashSlug(slug: string): string {
    const normalized = normalizeSlug(slug);
    // Solidity: keccak256(abi.encodePacked(_slug))
    // Viem: encodePacked(['string'], [slug]) called inside keccak256? 
    // actually viem has encodePacked.
    return keccak256(encodePacked(["string"], [normalized]));
}

export function validateSlugFormat(slug: string): boolean {
    const normalized = normalizeSlug(slug);
    const regex = /^[a-z0-9]([a-z0-9-]{1,18})[a-z0-9]$/;
    // Length 3-20. No start/end hyphen. Allowed: a-z, 0-9, -
    return regex.test(normalized) && !normalized.includes("--");
}
