import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCachedLogo, setCachedLogo, getCacheKey } from "@/lib/logo-cache"

interface OverviewAssetsProps {
    assets: {
        tokens: any[]
        nfts: any[]
        isLoading: boolean
    }
}

export function OverviewAssets({ assets }: OverviewAssetsProps) {
    if (assets.isLoading) return null

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Tokens</CardTitle>
                    <CardDescription className="text-xs">Top holdings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {assets.tokens.length > 0 ? (
                        assets.tokens.map((token: any, i: number) => {
                            const getLogoUrl = (): string | null => {
                                if (token.logoUrl) {
                                    return token.logoUrl
                                }
                                const cacheKey = getCacheKey(token.address, token.symbol)
                                return getCachedLogo(cacheKey) || null
                            }

                            const logoUrl = getLogoUrl()
                            const firstLetter = token.symbol?.charAt(0).toUpperCase() || '?'

                            return (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                                            {logoUrl ? (
                                                <Image
                                                    src={logoUrl}
                                                    alt={token.symbol}
                                                    fill
                                                    sizes="32px"
                                                    className="object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.style.display = 'none'
                                                        const parent = target.parentElement
                                                        if (parent) {
                                                            parent.innerText = firstLetter
                                                            parent.className = "h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold"
                                                        }
                                                        const cacheKey = getCacheKey(token.address, token.symbol)
                                                        setCachedLogo(cacheKey, null)
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-[10px] font-bold">{firstLetter}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{token.name}</p>
                                            <p className="text-xs text-muted-foreground">{token.symbol}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-mono">{parseFloat(token.balanceFormatted).toFixed(2)}</p>
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-sm text-muted-foreground">No tokens found.</p>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-card border border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">NFTs</CardTitle>
                    <CardDescription className="text-xs">Recent collectibles</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                        {assets.nfts.length > 0 ? (
                            assets.nfts.slice(0, 6).map((nft: any, i: number) => (
                                <div key={i} className="aspect-square bg-muted rounded-md overflow-hidden relative group border border-border/40 hover:border-primary/50 transition-colors shadow-sm">
                                    {nft.imageUrl ? (
                                        <Image src={nft.imageUrl} alt={nft.name} fill sizes="(max-width: 768px) 33vw, 20vw" className="object-cover transform transition-transform group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground p-1 text-center font-medium bg-secondary/50">
                                            {nft.name}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground col-span-3">No NFTs found.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
