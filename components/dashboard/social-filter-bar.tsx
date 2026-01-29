'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'

export type FilterType = 'all' | 'mutuals' | 'new7d' | 'active30d' | 'withIdentity'
export type SortType = 'recent' | 'relevant' | 'active'

interface SocialFilterBarProps {
    filter: FilterType
    onFilterChange: (filter: FilterType) => void
    sort: SortType
    onSortChange: (sort: SortType) => void
    searchQuery: string
    onSearchChange: (query: string) => void
}

export function SocialFilterBar({
    filter,
    onFilterChange,
    sort,
    onSortChange,
    searchQuery,
    onSearchChange,
}: SocialFilterBarProps) {
    const filters: { value: FilterType; label: string }[] = [
        { value: 'all', label: 'All' },
        { value: 'mutuals', label: 'Mutuals' },
        { value: 'new7d', label: 'New (7d)' },
        { value: 'active30d', label: 'Active (30d)' },
        { value: 'withIdentity', label: 'With Identity' },
    ]

    return (
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            {/* Filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
                {filters.map((f) => (
                    <Button
                        key={f.value}
                        size="sm"
                        variant={filter === f.value ? 'default' : 'outline'}
                        onClick={() => onFilterChange(f.value)}
                        className="h-8 text-xs"
                    >
                        {f.label}
                    </Button>
                ))}
            </div>

            {/* Search and Sort */}
            <div className="flex items-center gap-2">
                {/* Search input */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-48 h-8 pl-8 pr-8"
                    />
                    {searchQuery && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onSearchChange('')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                            aria-label="Clear search"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>

                {/* Sort dropdown */}
                <Select value={sort} onValueChange={(v) => onSortChange(v as SortType)}>
                    <SelectTrigger className="w-[160px] h-9 text-xs">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="recent">Recently followed</SelectItem>
                        <SelectItem value="relevant">Most relevant</SelectItem>
                        <SelectItem value="active">Most active</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
