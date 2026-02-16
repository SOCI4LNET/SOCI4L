export function getAvatarUrl(address: string) {
    // Use DiceBear Identicon as a reliable fallback for now.
    // effigy.im has been reported to fail (500 errors).
    // DiceBear Identicon generates a deterministic geometric pattern based on the address.
    return `https://api.dicebear.com/9.x/identicon/svg?seed=${address}`
}
