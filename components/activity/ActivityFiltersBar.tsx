'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Search, RefreshCw, Download } from 'lucide-react'

interface ActivityFiltersBarProps {
  dateRange: '24h' | '7d' | '30d' | 'all'
  onDateRangeChange: (value: '24h' | '7d' | '30d' | 'all') => void
  type: 'all' | 'transfer' | 'contract' | 'swap'
  onTypeChange: (value: 'all' | 'transfer' | 'contract' | 'swap') => void
  direction: 'all' | 'incoming' | 'outgoing'
  onDirectionChange: (value: 'all' | 'incoming' | 'outgoing') => void
  searchQuery: string
  onSearchChange: (value: string) => void
  lastUpdatedText: string
  isLoading: boolean
  onRefresh: () => void
  onExportCSV: () => void
  hasData: boolean
}

export function ActivityFiltersBar({
  dateRange,
  onDateRangeChange,
  type,
  onTypeChange,
  direction,
  onDirectionChange,
  searchQuery,
  onSearchChange,
  lastUpdatedText,
  isLoading,
  onRefresh,
  onExportCSV,
  hasData,
}: ActivityFiltersBarProps) {
  return (
    <div className="border rounded-lg bg-card p-5">
      {/* Single row layout - wraps on small screens */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Left: Time range segmented control - clearly grouped */}
        <div className="flex-shrink-0">
          <ToggleGroup
            type="single"
            value={dateRange}
            onValueChange={(value) => {
              if (value) onDateRangeChange(value as typeof dateRange)
            }}
            className="border rounded-md p-0.5 bg-muted/50"
          >
            <ToggleGroupItem value="24h" aria-label="24 Saat" className="text-xs px-3 h-9">
              24h
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" aria-label="7 Gün" className="text-xs px-3 h-9">
              7d
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" aria-label="30 Gün" className="text-xs px-3 h-9">
              30d
            </ToggleGroupItem>
            <ToggleGroupItem value="all" aria-label="Tümü" className="text-xs px-3 h-9">
              All
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Middle: Type and Direction dropdowns - evenly spaced and aligned */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Select value={type} onValueChange={(v) => onTypeChange(v as typeof type)}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="swap">Swap</SelectItem>
            </SelectContent>
          </Select>

          <Select value={direction} onValueChange={(v) => onDirectionChange(v as typeof direction)}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="incoming">Incoming</SelectItem>
              <SelectItem value="outgoing">Outgoing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search Input - prominent and flexible */}
        <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by hash, address, token..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Right: Updated text + Refresh + CSV - aligned actions */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="text-xs text-muted-foreground hidden lg:inline whitespace-nowrap">
            {lastUpdatedText}
          </span>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={onRefresh}
                  disabled={isLoading}
                  aria-label="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onExportCSV}
                  disabled={!hasData}
                  aria-label="Export CSV"
                  className="h-9 w-9"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export CSV</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
