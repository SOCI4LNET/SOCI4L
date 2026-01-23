'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, ArrowUpDown, ChevronDown, Coins, Image as ImageIcon } from 'lucide-react'

interface AssetsControlsBarProps {
  activeTab: 'tokens' | 'nfts'
  onTabChange: (value: 'tokens' | 'nfts') => void
  searchQuery: string
  onSearchChange: (value: string) => void
  tokenSort: 'value-desc' | 'value-asc' | 'balance-desc' | 'balance-asc' | 'alphabetical'
  onTokenSortChange: (value: 'value-desc' | 'value-asc' | 'balance-desc' | 'balance-asc' | 'alphabetical') => void
  nftSort: 'recent' | 'collection-az'
  onNFTSortChange: (value: 'recent' | 'collection-az') => void
  tokenCount?: number
  nftCount?: number
}

export function AssetsControlsBar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  tokenSort,
  onTokenSortChange,
  nftSort,
  onNFTSortChange,
  tokenCount,
  nftCount,
}: AssetsControlsBarProps) {
  const getSortLabel = () => {
    if (activeTab === 'tokens') {
      switch (tokenSort) {
        case 'value-desc': return 'Value (High to Low)'
        case 'value-asc': return 'Value (Low to High)'
        case 'balance-desc': return 'Balance (High to Low)'
        case 'balance-asc': return 'Balance (Low to High)'
        case 'alphabetical': return 'Alphabetical'
      }
    } else {
      switch (nftSort) {
        case 'recent': return 'Recent'
        case 'collection-az': return 'Collection (A-Z)'
      }
    }
  }

  return (
    <div className="w-full flex flex-wrap items-center gap-3">
      {/* Left: Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'tokens' | 'nfts')}>
        <TabsList>
          <TabsTrigger value="tokens" className="gap-2 h-9">
            <Coins className="h-4 w-4" />
            Tokens
            {tokenCount !== undefined && tokenCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {tokenCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="nfts" className="gap-2 h-9">
            <ImageIcon className="h-4 w-4" />
            NFTs
            {nftCount !== undefined && nftCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {nftCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Middle: Search */}
      <div className="relative flex-1 min-w-[280px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by symbol, name, or address..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Right: Sort */}
      <div className="ml-auto">
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <ArrowUpDown className="h-4 w-4" />
            Sort
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {activeTab === 'tokens' ? (
            <>
              <DropdownMenuItem onClick={() => onTokenSortChange('value-desc')}>
                Value (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTokenSortChange('value-asc')}>
                Value (Low to High)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTokenSortChange('balance-desc')}>
                Balance (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTokenSortChange('balance-asc')}>
                Balance (Low to High)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTokenSortChange('alphabetical')}>
                Alphabetical
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => onNFTSortChange('recent')}>
                Recent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNFTSortChange('collection-az')}>
                Collection (A-Z)
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </div>
  )
}
