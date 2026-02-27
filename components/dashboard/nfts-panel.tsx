'use client'

import { useState, useEffect, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAccount } from 'wagmi'

import { Search, RefreshCw, ImageOff, Layers, ExternalLink, ChevronDown } from 'lucide-react'
import Image from 'next/image'

import { PageContent } from '@/components/app-shell/page-content'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface NftsPanelProps {
    address?: string
}

interface NormalizedNft {
    id: string
    name: string | null
    imageUrl: string | null
    collectionName: string | null
    contract: string | null
    tokenId: string | null
}

interface NftResponse {
    nfts: NormalizedNft[]
    next: string | null
}

function NftCardSkeleton() {
    return (
        <div className="flex flex-col rounded-2xl overflow-hidden border border-border/10 bg-card/30">
            <Skeleton className="aspect-square w-full" />
            <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    )
}

function NftCard({ nft }: { nft: NormalizedNft }) {
    const [imgError, setImgError] = useState(false)
    const explorerUrl = nft.contract && nft.tokenId
        ? `https://snowtrace.io/token/${nft.contract}?a=${nft.tokenId}`
        : null

    return (
        <div className="group flex flex-col rounded-2xl overflow-hidden border border-border/10 bg-transparent hover:border-border/30 hover:bg-accent/5 transition-all duration-200">
            {/* NFT Image */}
            <div className="relative aspect-square w-full bg-accent/10 overflow-hidden">
                {nft.imageUrl && !imgError ? (
                    <Image
                        src={nft.imageUrl}
                        alt={nft.name || 'NFT'}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground/30">
                        <ImageOff className="h-10 w-10" />
                    </div>
                )}
                {/* Explorer link overlay */}
                {explorerUrl && (
                    <Link
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-1.5"
                    >
                        <ExternalLink className="h-3 w-3 text-white" />
                    </Link>
                )}
            </div>

            {/* NFT Info */}
            <div className="p-3 space-y-1.5">
                <p className="font-semibold text-sm truncate">
                    {nft.name || `Token #${nft.tokenId || '?'}`}
                </p>
                {nft.collectionName && (
                    <Badge
                        variant="secondary"
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/20 text-muted-foreground border-0 max-w-full truncate"
                    >
                        {nft.collectionName}
                    </Badge>
                )}
            </div>
        </div>
    )
}

export function NftsPanel({ address: propAddress }: NftsPanelProps) {
    const [mounted, setMounted] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const { address: connectedAddress } = useAccount()
    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
    const addressMatch = pathname.match(/\/dashboard\/(0x[a-fA-F0-9]{40})/)
    const urlAddress = addressMatch ? addressMatch[1].toLowerCase() : null
    const targetAddress = urlAddress || propAddress?.toLowerCase() || connectedAddress?.toLowerCase() || ''

    useEffect(() => {
        setMounted(true)
    }, [])

    const { data, isLoading, isError, refetch, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        queryKey: ['nfts', targetAddress],
        queryFn: async ({ pageParam }) => {
            const url = pageParam
                ? `/api/nfts?address=${targetAddress}&limit=24&chain=avalanche&next=${encodeURIComponent(pageParam)}`
                : `/api/nfts?address=${targetAddress}&limit=24&chain=avalanche`
            const res = await fetch(url)
            if (!res.ok) throw new Error('Failed to fetch NFTs')
            return res.json() as Promise<NftResponse>
        },
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage: NftResponse) => lastPage.next || null,
        enabled: !!targetAddress && mounted,
        staleTime: 5 * 60 * 1000,
    })

    const handleLoadMore = () => {
        fetchNextPage()
    }

    const combinedNfts = useMemo(() => {
        if (!data) return []
        return data.pages.flatMap((page: NftResponse) => page.nfts)
    }, [data])

    const filteredNfts = useMemo(() => {
        if (!searchQuery.trim()) return combinedNfts
        const q = searchQuery.toLowerCase()
        return combinedNfts.filter((nft: NormalizedNft) =>
            nft.name?.toLowerCase().includes(q) ||
            nft.collectionName?.toLowerCase().includes(q)
        )
    }, [combinedNfts, searchQuery])

    const uniqueCollections = useMemo(() => {
        const cols = new Set(combinedNfts.map((n: NormalizedNft) => n.collectionName).filter(Boolean))
        return cols.size
    }, [combinedNfts])

    if (!mounted || !targetAddress) {
        return <PageContent mode="full-width"><Skeleton className="h-64 w-full" /></PageContent>
    }

    return (
        <PageContent mode="full-width">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold">NFT Gallery</h2>
                    {!isLoading && combinedNfts.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {combinedNfts.length} NFT{combinedNfts.length !== 1 ? 's' : ''} across{' '}
                            {uniqueCollections} collection{uniqueCollections !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search NFTs..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background/50 h-9"
                        />
                    </div>
                    {/* Refresh */}
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                        <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Error */}
            {isError && (
                <Alert variant="destructive" className="mb-6">
                    <AlertDescription>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="font-semibold mb-1">Failed to Load NFTs</p>
                                <p className="text-sm">There was an error fetching NFT data.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => refetch()}>
                                <RefreshCw className="mr-2 h-3 w-3" />
                                Retry
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Loading Skeletons */}
            {isLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <NftCardSkeleton key={i} />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && combinedNfts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                        <Layers className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No NFTs Found</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        This wallet doesn't hold any NFTs on Avalanche yet.
                    </p>
                </div>
            )}

            {/* NFT Grid */}
            {!isLoading && filteredNfts.length > 0 && (
                <>
                    {searchQuery && filteredNfts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-12">
                            No NFTs match "{searchQuery}"
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                            {filteredNfts.map((nft: NormalizedNft) => (
                                <NftCard key={nft.id} nft={nft} />
                            ))}
                        </div>
                    )}

                    {/* Load More */}
                    {hasNextPage && !searchQuery && (
                        <div className="flex justify-center mt-8">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                disabled={isFetchingNextPage}
                                className="gap-2"
                            >
                                {isFetchingNextPage ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                                Load More
                            </Button>
                        </div>
                    )}
                </>
            )}
        </PageContent>
    )
}
