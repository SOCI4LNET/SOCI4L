export function getAvatarUrl(address: string) {
    if (!address) return ''
    return `https://effigy.im/a/${address.toLowerCase()}.svg`
}
