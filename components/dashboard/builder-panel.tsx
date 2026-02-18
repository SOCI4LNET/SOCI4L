'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  MeasuringStrategy,
  type DragEndEvent,
  type DragStartEvent,
  type Active,
  type Over,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Sparkles, MoreVertical, Info, ChevronDown, ChevronUp, X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useSignMessage } from 'wagmi'
import { Loader2 } from 'lucide-react'
import { useTransaction } from '@/components/providers/transaction-provider'

import { PageShell } from '@/components/app-shell/page-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toggle } from '@/components/ui/toggle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  type ProfileBlockKey,
  type ProfileLayoutBlock,
  type ProfileLayoutConfig,
  type ProfilePreset,
  type BlockVariant,
  type LayoutRow,
  type SectionId,
  getDefaultProfileLayout,
  applyPreset,
  detectPreset,
  normalizeLayoutConfig,
  getRecommendation,
  gridToRowLayout,
  rowToGridLayout,
} from '@/lib/profile-layout'
import {
  type ProfileAppearanceConfig,
  type ProfileTheme,
  getDefaultAppearanceConfig,
  normalizeAppearanceConfig,
} from '@/lib/profile-appearance'

// type SectionId = ProfileBlockKey // Removed conflict

type SocialLinkPlatform = 'x' | 'instagram' | 'youtube' | 'github' | 'linkedin' | 'website'

interface SocialLink {
  id: string
  platform: SocialLinkPlatform
  url: string
  label?: string
}

type PresetDefinition = {
  id: ProfilePreset
  name: string
  description: string
}

type ProfileSectionId = SectionId

type ProfileSection = {
  id: ProfileSectionId
  title: string
  description: string
  enabled: boolean
  variant?: BlockVariant // Variant for activity/assets blocks
  row?: number // Grid row position
  col?: 0 | 1 // Grid column position
  span?: 'half' | 'full' // Span: half width (50%) or full width (100%)
}

const INITIAL_SECTIONS: ProfileSection[] = [
  {
    id: 'links',
    title: 'Links',
    description: 'Curated external links and social profiles you want to highlight.',
    enabled: true,
  },
  {
    id: 'activity',
    title: 'Activity',
    description: 'Recent on-chain transactions and interaction history.',
    enabled: true,
    variant: 'compact',
  },
  {
    id: 'assets',
    title: 'Assets',
    description: 'Wallet balance, tokens, NFTs and high-level portfolio breakdown.',
    enabled: true,
    variant: 'compact',
  },
]

const PRESETS: PresetDefinition[] = [
  {
    id: 'links_only',
    name: 'Links Only',
    description: 'Hide everything except your curated links.',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Show links and activity. Hide assets for a cleaner look.',
  },
  {
    id: 'full',
    name: 'Full Profile',
    description: 'All on-chain sections plus links.',
  },
  {
    id: 'privacy_first',
    name: 'Privacy-first',
    description: 'Show all sections but hide amounts in activity and assets.',
  },
]

// Helper: Convert LayoutRow to slots format
function rowToSlots(row: LayoutRow): string[] {
  if (row.type === 'single') {
    return [row.left || 'EMPTY']
  } else {
    return [row.left || 'EMPTY', row.right || 'EMPTY']
  }
}

// Helper: Convert slots format to LayoutRow
function slotsToRow(rowId: string, type: 'single' | 'double', slots: string[]): LayoutRow {
  if (type === 'single') {
    return {
      id: rowId,
      type: 'single',
      left: slots[0] === 'EMPTY' ? null : (slots[0] as SectionId),
    }
  } else {
    return {
      id: rowId,
      type: 'double',
      left: slots[0] === 'EMPTY' ? null : (slots[0] as SectionId),
      right: slots[1] === 'EMPTY' ? null : (slots[1] as SectionId),
    }
  }
}

// Helper: Get slot ID from row and slot index
function getSlotId(rowId: string, slotIndex: number): string {
  return `slot:${rowId}:${slotIndex}`
}

// Helper: Parse slot ID
function parseSlotId(slotId: string): { rowId: string; slotIndex: number } | null {
  const match = slotId.match(/^slot:(.+):(\d+)$/)
  if (!match) return null
  return { rowId: match[1], slotIndex: parseInt(match[2], 10) }
}

// Disabled sections drop zone component
function DisabledSectionsZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'disabled-sections',
  })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-md border-2 border-dashed transition-colors p-4 ${isOver ? 'border-destructive bg-destructive/5' : 'border-border/40 bg-muted/10'
        }`}
    >
      {children}
    </div>
  )
}


// Row Slot Drop Zone Component (slot-based)
function RowSlotDropZone({
  rowId,
  slotIndex,
  children,
  isDragging,
}: {
  rowId: string
  slotIndex: number
  children: React.ReactNode
  isDragging: boolean
}) {
  const slotId = getSlotId(rowId, slotIndex)
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
  })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] rounded-md border-2 border-dashed transition-all duration-200 p-3 ${isOver
        ? 'border-primary bg-primary/10 shadow-sm scale-[1.02]'
        : isDragging
          ? 'border-border/60 bg-muted/30'
          : 'border-border/40 bg-muted/20'
        }`}
    >
      {children}
    </div>
  )
}

// Row Builder Component
type RowBuilderProps = {
  row: LayoutRow
  sections: ProfileSection[]
  onToggleSection: (id: ProfileSectionId, enabled: boolean) => void
  onVariantChange: (id: ProfileSectionId, variant: BlockVariant) => void
  onToggleRowType: () => void
  onRemoveRow: () => void
  sensors: ReturnType<typeof useSensors>
  canRemove: boolean
}

function RowBuilder({
  row,
  sections,
  onToggleSection,
  onVariantChange,
  onToggleRowType,
  onRemoveRow,
  sensors,
  canRemove,
  isDraggingCard,
}: RowBuilderProps & { isDraggingCard: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    data: {
      type: 'row',
      rowId: row.id,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const slots = rowToSlots(row)
  const slotSections = slots.map((slotValue) =>
    slotValue === 'EMPTY' ? null : sections.find((s) => s.id === slotValue)
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-border/60 bg-background/40 p-4 space-y-3 transition ${isDragging ? 'ring-2 ring-primary/40 shadow-xl dark:shadow-2xl bg-background' : ''
        }`}
    >
      {/* Row Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            aria-label="Drag row"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium text-muted-foreground">
            {row.type === 'single' ? 'Full Width' : 'Two Columns'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleRowType}
            className="h-7 px-2 text-xs"
            title={row.type === 'single' ? 'Split into two columns' : 'Merge into full width'}
          >
            {row.type === 'single' ? 'Split' : 'Merge'}
          </Button>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemoveRow}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Row Content - Drop Zones */}
      {row.type === 'single' ? (
        <div className="space-y-2">
          <RowSlotDropZone rowId={row.id} slotIndex={0} isDragging={isDraggingCard}>
            {slotSections[0] ? (
              <SortableSectionRow
                section={slotSections[0]}
                onToggle={onToggleSection}
                onVariantChange={onVariantChange}
                rowId={row.id}
                slotIndex={0}
              />
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                Drop section here
              </div>
            )}
          </RowSlotDropZone>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <RowSlotDropZone rowId={row.id} slotIndex={0} isDragging={isDraggingCard}>
            {slotSections[0] ? (
              <SortableSectionRow
                section={slotSections[0]}
                onToggle={onToggleSection}
                onVariantChange={onVariantChange}
                rowId={row.id}
                slotIndex={0}
              />
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                Drop section here
              </div>
            )}
          </RowSlotDropZone>
          <RowSlotDropZone rowId={row.id} slotIndex={1} isDragging={isDraggingCard}>
            {slotSections[1] ? (
              <SortableSectionRow
                section={slotSections[1]}
                onToggle={onToggleSection}
                onVariantChange={onVariantChange}
                rowId={row.id}
                slotIndex={1}
              />
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                Drop section here
              </div>
            )}
          </RowSlotDropZone>
        </div>
      )}
    </div>
  )
}

type SortableSectionRowProps = {
  section: ProfileSection
  onToggle: (id: ProfileSectionId, enabled: boolean) => void
  onVariantChange?: (id: ProfileSectionId, variant: BlockVariant) => void
  rowId?: string
  slotIndex?: number
}

function SortableSectionRow({ section, onToggle, onVariantChange, rowId, slotIndex }: SortableSectionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: {
      type: 'card',
      sectionId: section.id,
      fromRowId: rowId,
      fromSlotIndex: slotIndex,
    },
  })

  // Make section card also droppable with the same slot ID
  // This allows dropping on the card itself, not just the empty slot
  const slotId = rowId && typeof slotIndex === 'number' ? getSlotId(rowId, slotIndex) : null
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: slotId || section.id, // Fallback to section.id if no slot info
    disabled: !slotId, // Only enable if we have slot info
  })

  // Combine refs
  const combinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node)
    setDroppableRef(node)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  }

  return (
    <div
      ref={combinedRef}
      style={style}
      className={`rounded-md border border-border/60 bg-background/60 px-3 py-3 shadow-sm transition overflow-hidden
      ${!section.enabled ? 'opacity-60' : ''} 
      ${isDragging ? 'ring-1 ring-primary/40' : ''}
      ${isOver && !isDragging ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing ${isDragging ? 'text-foreground bg-muted/60' : ''
            }`}
          aria-label={`${section.title} section drag handle`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium leading-none">{section.title}</p>
            {(() => {
              const recommendation = getRecommendation(section.id)
              if (!recommendation.badge) return null

              // HARD_HEAVY (assets): "Recommended: Full width"
              // SOFT_HEAVY (activity, links): "Optional: Full width"
              const isHardHeavy = section.id === 'assets'
              const badgeText = isHardHeavy ? 'Recommended: Full width' : 'Optional: Full width'
              const tooltipText = isHardHeavy
                ? 'Assets section is recommended to be full width for better display.'
                : 'This section can optionally be set to full width for better display.'

              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 font-normal h-4 border-muted-foreground/30 text-muted-foreground shrink-0">
                        {badgeText}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{tooltipText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })()}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{section.description}</p>
        </div>
        <div className="flex items-center shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                aria-label={`${section.title} settings`}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onToggle(section.id, !section.enabled)}>
                <span className="text-xs">{section.enabled ? 'Disable' : 'Enable'}</span>
                {section.enabled && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
              </DropdownMenuItem>
              {(section.id === 'activity' || section.id === 'assets') && onVariantChange && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs">Display variant</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onVariantChange(section.id, 'compact')}>
                    <span className="text-xs">Compact</span>
                    {section.variant === 'compact' && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onVariantChange(section.id, 'full')}>
                    <span className="text-xs">Full</span>
                    {section.variant === 'full' && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onVariantChange(section.id, 'hiddenAmounts')}>
                    <span className="text-xs">Hide Amounts</span>
                    {section.variant === 'hiddenAmounts' && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

const ROLES = ['Builder', 'Designer', 'Trader', 'Founder', 'Collector', 'Researcher', 'Operator']

const BIO_PATTERNS = [
  "Building [Project] @ [Ecosystm]",
  "Contributor to [DAO]",
  "Collecting [Collection] on Avalanche",
  "Trader • Researcher • [Role]"
]

type BuilderPanelProps = {
  address: string
}

export function BuilderPanel({ address }: BuilderPanelProps) {
  const searchParams = useSearchParams()
  const linksSectionRef = useRef<HTMLDivElement>(null)
  const { signMessageAsync } = useSignMessage()
  const { showTransactionLoader, hideTransactionLoader } = useTransaction()
  const [sections, setSections] = useState<ProfileSection[]>(INITIAL_SECTIONS)
  const [layoutConfig, setLayoutConfig] = useState<ProfileLayoutConfig>(() =>
    getDefaultProfileLayout()
  )
  // Row-based layout state
  const [layoutRows, setLayoutRows] = useState<LayoutRow[]>(() => {
    const defaultConfig = getDefaultProfileLayout()
    return defaultConfig.rows || gridToRowLayout(defaultConfig).rows
  })
  const [appearanceConfig, setAppearanceConfig] = useState<ProfileAppearanceConfig>(() =>
    getDefaultAppearanceConfig()
  )
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [highlightedLinkId, setHighlightedLinkId] = useState<string | null>(null)
  const [highlightedCategoryId, setHighlightedCategoryId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Profile Info state
  const [displayName, setDisplayName] = useState<string>('')
  const [bio, setBio] = useState<string>('')
  const [primaryRole, setPrimaryRole] = useState<string>('')
  const [secondaryRoles, setSecondaryRoles] = useState<string[]>([])
  const [statusMessage, setStatusMessage] = useState<string>('')

  // Role Selection Handler
  const handleRoleClick = (role: string) => {
    setHasUnsavedChanges(true)

    // 1. If currently Primary -> toggle off (deselect)
    if (primaryRole === role) {
      setPrimaryRole('')
      // Promote first secondary to primary
      if (secondaryRoles.length > 0) {
        const [newPrimary, ...remaining] = secondaryRoles
        setPrimaryRole(newPrimary)
        setSecondaryRoles(remaining)
      }
      return
    }

    // 2. If currently Secondary -> toggle off (deselect)
    if (secondaryRoles.includes(role)) {
      setSecondaryRoles(secondaryRoles.filter((r) => r !== role))
      return
    }

    // 3. New Selection
    if (!primaryRole) {
      setPrimaryRole(role)
      return
    }

    // 4. Add to Secondary
    if (secondaryRoles.length < 2) {
      setSecondaryRoles([...secondaryRoles, role])
    } else {
      // Max reached. Replace the last added secondary (mimic stack behavior)
      // Keep [0], replace [1]
      setSecondaryRoles([secondaryRoles[0], role])
    }
  }

  // Load layout from API on mount
  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }

    const loadLayout = async () => {
      try {
        setLoading(true)
        const cacheBust = Date.now()
        const headers = { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        const layoutResponse = await fetch(`/api/profile/layout?address=${encodeURIComponent(address)}&_t=${cacheBust}`, { cache: 'no-store', headers })
        const appearanceResponse = await fetch(`/api/profile/appearance?address=${encodeURIComponent(address)}&_t=${cacheBust}`, { cache: 'no-store', headers })
        const profileResponse = await fetch(`/api/wallet?address=${encodeURIComponent(address)}&_t=${cacheBust}`, { cache: 'no-store', headers })

        if (!layoutResponse.ok) {
          const errorData = await layoutResponse.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${layoutResponse.status}: Failed to load layout`)
        }

        const layoutData = await layoutResponse.json()

        // Check if response has an error field
        if (layoutData.error) {
          throw new Error(layoutData.error)
        }

        const config = layoutData.layout || getDefaultProfileLayout()
        setLayoutConfig(config)

        // Update row-based layout
        if (config.rows && config.rows.length > 0) {
          setLayoutRows(config.rows)
        } else {
          const rowLayout = gridToRowLayout(config)
          setLayoutRows(rowLayout.rows)
        }

        // Load profile info
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData.profile) {
            setDisplayName(profileData.profile.displayName || '')
            setBio(profileData.profile.bio || '')
            setPrimaryRole(profileData.profile.primaryRole || '')
            setSecondaryRoles(profileData.profile.secondaryRoles || [])
            setStatusMessage(profileData.profile.statusMessage || '')
          }
        }

        if (appearanceResponse.ok) {
          const appearanceData = await appearanceResponse.json()
          if (appearanceData.error) {
            console.warn('[BuilderPanel] Appearance error:', appearanceData.error)
            // Use default appearance on error
            setAppearanceConfig(getDefaultAppearanceConfig())
          } else {
            const appearance = appearanceData.appearance || getDefaultAppearanceConfig()
            setAppearanceConfig(appearance)
          }
        } else {
          // Use default appearance if request fails
          setAppearanceConfig(getDefaultAppearanceConfig())
        }

        const byId = INITIAL_SECTIONS.reduce<Record<ProfileSectionId, ProfileSection>>(
          (acc, section) => {
            acc[section.id] = section
            return acc
          },
          {} as Record<ProfileSectionId, ProfileSection>
        )

        const next: ProfileSection[] = []

        // Sort blocks by grid position (row, then col)
        const sortedBlocks = [...config.blocks]
          .filter((b) => b.key !== 'summary') // Filter out deprecated summary
          .sort((a, b) => {
            const rowA = a.row ?? 0
            const rowB = b.row ?? 0
            if (rowA !== rowB) return rowA - rowB
            const colA = a.col ?? 0
            const colB = b.col ?? 0
            return colA - colB
          })
        const usedIds = new Set<ProfileSectionId>()

        for (const block of sortedBlocks) {
          const id = block.key as ProfileSectionId
          const base = byId[id]
          if (!base) continue
          usedIds.add(id)
          next.push({
            ...base,
            enabled: block.enabled,
            variant: block.variant || 'compact',
            row: block.row ?? 0,
            col: block.col ?? 0,
            span: block.span || 'half',
          })
        }

        for (const section of INITIAL_SECTIONS) {
          if (!usedIds.has(section.id)) {
            next.push({
              ...section,
              row: 0,
              col: 0,
              span: 'half',
            })
          }
        }

        setSections(next)
        setHasUnsavedChanges(false)
      } catch (error) {
        console.error('[BuilderPanel] Failed to load layout config', error)
        toast.error('Failed to load layout. Please refresh the page.')
        // Set default configs on error to prevent UI blocking
        setLayoutConfig(getDefaultProfileLayout())
        setAppearanceConfig(getDefaultAppearanceConfig())
      } finally {
        setLoading(false)
      }
    }

    loadLayout()
  }, [address])

  // Handle query params for deep linking from Insights
  useEffect(() => {
    const focus = searchParams.get('focus')
    const linkId = searchParams.get('link')
    const categoryId = searchParams.get('category')

    if (focus === 'links' && linksSectionRef.current) {
      // Scroll to links section
      setTimeout(() => {
        linksSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }

    if (linkId) {
      setHighlightedLinkId(linkId)
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedLinkId(null), 3000)
    }

    if (categoryId) {
      setHighlightedCategoryId(categoryId)
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedCategoryId(null), 3000)
    }
  }, [searchParams])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleToggleSection = (id: ProfileSectionId, enabled: boolean) => {
    setSections((prev) =>
      prev.map((section) => (section.id === id ? { ...section, enabled } : section))
    )
    setHasUnsavedChanges(true)
  }

  const handleSaveLayout = async () => {
    if (!address) return

    try {
      setSaving(true)

      // 1. Prepare Layout Data
      const allBlocks = sections.map((section) => ({
        key: section.id,
        enabled: section.enabled,
        variant: section.variant || 'compact',
        order: 0,
        row: 0,
        col: 0 as 0 | 1,
        span: 'half' as const,
      }))

      const gridConfig = rowToGridLayout({ rows: layoutRows }, allBlocks)
      const nextConfig: ProfileLayoutConfig = {
        ...gridConfig,
        rows: layoutRows,
        layoutVariant: 'rows',
      }
      const normalizedLayout = normalizeLayoutConfig(nextConfig)

      // 2. Prepare Appearance Data
      const normalizedAppearance = normalizeAppearanceConfig(appearanceConfig)

      // 3. Prepare Profile Data
      const profileInfo = {
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
        primaryRole: primaryRole.trim() || null,
        secondaryRoles: secondaryRoles,
        statusMessage: statusMessage.trim() || null,
      }

      // 4. Get Nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) throw new Error('Failed to get nonce')
      const { nonce } = await nonceResponse.json()

      // 5. Sign Single Message
      showTransactionLoader("Confirm in Wallet...")
      const message = `Save all profile changes for ${address}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      showTransactionLoader("Saving changes...")

      // 6. Save to API (Batch Update)
      const response = await fetch('/api/profile/save-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          layout: normalizedLayout,
          appearance: normalizedAppearance,
          profile: profileInfo,
          signature,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to save changes')
      }

      const result = await response.json()

      // Update local state from response if necessary
      if (result.profile) {
        // You might want to update local state here if the API returned normalized data
        // For now, toast success is enough as we already have the state
      }

      toast.success('All changes saved successfully. Please refresh the public profile page.')
      setHasUnsavedChanges(false)
    } catch (error: any) {
      console.error('[BuilderPanel] Failed to save changes', error)
      if (error?.message?.includes('User rejected') || error?.name === 'UserRejectedRequestError') {
        toast.error('Transaction rejected')
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to save changes. Please try again.')
      }
    } finally {
      setSaving(false)
      hideTransactionLoader()
    }
  }

  const handleVariantChange = (id: ProfileSectionId, variant: BlockVariant) => {
    setSections((prev) =>
      prev.map((section) => (section.id === id ? { ...section, variant } : section))
    )
    setHasUnsavedChanges(true)
  }

  const handleResetLayout = () => {
    const defaultConfig = getDefaultProfileLayout()
    setSections(INITIAL_SECTIONS)
    setLayoutConfig(defaultConfig)
    setLayoutRows(defaultConfig.rows || gridToRowLayout(defaultConfig).rows)
    setAppearanceConfig(getDefaultAppearanceConfig())
    toast.success('Layout reset')
    setHasUnsavedChanges(false)
  }


  const handleThemeChange = (theme: ProfileTheme) => {
    setAppearanceConfig({ ...appearanceConfig, theme })
    setHasUnsavedChanges(true)
  }

  const [activeDrag, setActiveDrag] = useState<
    | { type: 'row'; id: string; data?: any }
    | { type: 'card'; id: string; data?: any }
    | null
  >(null)

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    // Determine drag type from data
    const data = active.data.current
    if (data?.type === 'row') {
      setActiveDrag({ type: 'row', id: active.id as string, data })
    } else if (data?.type === 'card') {
      setActiveDrag({ type: 'card', id: active.id as string, data })
    } else {
      // Fallback: check ID pattern
      const id = active.id as string
      if (id.startsWith('row-')) {
        setActiveDrag({ type: 'row', id })
      } else {
        setActiveDrag({ type: 'card', id })
      }
    }
  }

  // Unified drag end handler for both rows and sections
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !activeDrag) {
      setActiveId(null)
      setActiveDrag(null)
      return
    }

    if (activeDrag.type === 'row') {
      // Handle row reordering
      if (over.id === active.id) {
        setActiveId(null)
        setActiveDrag(null)
        return
      }

      // Check if dropping on another row
      const isDroppingOnRow = typeof over.id === 'string' && over.id.startsWith('row-')
      if (isDroppingOnRow) {
        const oldIndex = layoutRows.findIndex((row) => row.id === active.id)
        const newIndex = layoutRows.findIndex((row) => row.id === over.id)
        if (oldIndex !== -1 && newIndex !== -1) {
          setLayoutRows(arrayMove(layoutRows, oldIndex, newIndex))
          setHasUnsavedChanges(true)
        }
      }
      setActiveId(null)
      setActiveDrag(null)
      return
    }

    // Handle card/section drag
    if (activeDrag.type === 'card') {
      handleCardDragEnd(event, activeDrag)
    }
  }

  const handleCardDragEnd = (event: DragEndEvent, activeDrag: { type: 'card'; id: string; data?: any }) => {
    const { active, over } = event
    if (!over) {
      setActiveId(null)
      setActiveDrag(null)
      return
    }

    const sectionId = active.id as SectionId
    const dragData = activeDrag.data || {}

    // Handle drop to disabled zone
    if (over.id === 'disabled-sections') {
      // Remove section from all rows (enforce uniqueness)
      setLayoutRows((prev) =>
        prev.map((r) => {
          const slots = rowToSlots(r)
          const newSlots = slots.map((slot) => (slot === sectionId ? 'EMPTY' : slot))
          return slotsToRow(r.id, r.type, newSlots)
        })
      )
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, enabled: false } : s))
      )
      setHasUnsavedChanges(true)
      setActiveId(null)
      setActiveDrag(null)
      return
    }

    // Handle drop to slot or section card (section cards are also droppable with slot ID)
    let slotInfo = parseSlotId(over.id as string)

    // If over.id is a section ID (not a slot ID), find the slot that contains this section
    if (!slotInfo) {
      const overSectionId = over.id as string
      // Check if it's a section ID by looking in layoutRows
      for (const row of layoutRows) {
        const slots = rowToSlots(row)
        const slotIndex = slots.findIndex((s) => s === overSectionId)
        if (slotIndex !== -1) {
          slotInfo = { rowId: row.id, slotIndex }
          break
        }
      }
    }

    if (slotInfo) {
      const { rowId: targetRowId, slotIndex: targetSlotIndex } = slotInfo

      // Find target row to determine max slot index
      const targetRowForValidation = layoutRows.find((r) => r.id === targetRowId)
      if (!targetRowForValidation) {
        setActiveId(null)
        setActiveDrag(null)
        return
      }

      // Clamp slot index to valid range
      const maxSlotIndex = targetRowForValidation.type === 'single' ? 0 : 1
      const clampedSlotIndex = Math.min(targetSlotIndex, maxSlotIndex)

      // Find source row and slot (if known from drag data)
      const sourceRowId = dragData.fromRowId
      const sourceSlotIndex = dragData.fromSlotIndex

      // Calculate swapped section ID before state update
      let swappedSectionId: SectionId | null = null
      const targetRowForSwap = layoutRows.find((r) => r.id === targetRowId)
      if (targetRowForSwap) {
        const targetSlots = rowToSlots(targetRowForSwap)
        const targetSlotValue = targetSlots[clampedSlotIndex]
        if (targetSlotValue !== 'EMPTY' && targetSlotValue !== sectionId) {
          swappedSectionId = targetSlotValue as SectionId
        }
      }

      setLayoutRows((prev) => {
        // Find target row and check if swap is needed
        const targetRow = prev.find((r) => r.id === targetRowId)
        if (!targetRow) return prev

        const targetSlots = rowToSlots(targetRow)
        const targetSlotValue = targetSlots[clampedSlotIndex]
        const needsSwap = targetSlotValue !== 'EMPTY' && targetSlotValue !== sectionId

        // Find source row to determine if it's same row swap
        const sourceRow = sourceRowId ? prev.find((r) => r.id === sourceRowId) : null
        const isSameRowSwap = sourceRowId === targetRowId && needsSwap

        return prev.map((r) => {
          if (r.id === targetRowId) {
            // Target row: place or swap section
            const slots = [...targetSlots]
            slots[clampedSlotIndex] = sectionId

            // If same row swap, also handle the swapped section
            if (isSameRowSwap && swappedSectionId && typeof sourceSlotIndex === 'number') {
              // Place swapped section in the original position of dragged section
              slots[sourceSlotIndex] = swappedSectionId
            } else if (sourceRowId === targetRowId && typeof sourceSlotIndex === 'number' && !needsSwap) {
              // Same row, moving to empty slot - clear the source slot
              slots[sourceSlotIndex] = 'EMPTY'
            }

            return slotsToRow(r.id, r.type, slots)
          } else if (needsSwap && swappedSectionId && r.id === sourceRowId && typeof sourceSlotIndex === 'number' && !isSameRowSwap) {
            // Source row (different from target): place swapped section in the slot where dragged section was
            const slots = rowToSlots(r)
            const newSlots = [...slots]
            newSlots[sourceSlotIndex] = swappedSectionId
            return slotsToRow(r.id, r.type, newSlots)
          } else {
            // Other rows: remove dragged section if present (enforce uniqueness)
            const slots = rowToSlots(r)
            const newSlots = slots.map((slot) => (slot === sectionId ? 'EMPTY' : slot))

            // If swap occurred and sourceRowId is unknown, we need to find where swapped section is
            // and remove it from other rows (except target row which already handled it)
            if (needsSwap && swappedSectionId && !isSameRowSwap) {
              const swappedIndex = newSlots.findIndex((s) => s === swappedSectionId)
              if (swappedIndex !== -1) {
                // If this row is not the source row, remove swapped section (it will be placed in source row)
                if (r.id !== sourceRowId) {
                  newSlots[swappedIndex] = 'EMPTY'
                }
              }
            }

            return slotsToRow(r.id, r.type, newSlots)
          }
        })
      })

      // Update sections: enable dragged section and swapped section (if any)
      setSections((prev) =>
        prev.map((s) => {
          if (s.id === sectionId) {
            return { ...s, enabled: true }
          }
          // Also enable swapped section if it exists
          if (swappedSectionId && s.id === swappedSectionId) {
            return { ...s, enabled: true }
          }
          return s
        })
      )
      setHasUnsavedChanges(true)
      setActiveId(null)
      setActiveDrag(null)
      return
    }

    setActiveId(null)
    setActiveDrag(null)
  }

  const handleToggleRowType = (rowId: string) => {
    setLayoutRows((prev) => {
      let removedSectionId: SectionId | null = null

      const updatedRows = prev.map((row) => {
        if (row.id !== rowId) return row

        const slots = rowToSlots(row)

        if (row.type === 'single') {
          // Split: Convert single to double
          // Preserve left content, right becomes empty
          return slotsToRow(row.id, 'double', [slots[0], 'EMPTY'])
        } else {
          // Merge: Convert double to single
          // Preserve left if exists, otherwise use right
          const preservedSlot = slots[0] !== 'EMPTY' ? slots[0] : slots[1]

          // If both slots have content, the right one will be removed
          if (slots[0] !== 'EMPTY' && slots[1] !== 'EMPTY') {
            removedSectionId = slots[1] as SectionId
          }

          return slotsToRow(row.id, 'single', [preservedSlot])
        }
      })

      // If a section was removed (right slot in double -> single conversion), disable it
      if (removedSectionId) {
        setSections((prevSections) =>
          prevSections.map((s) =>
            s.id === removedSectionId ? { ...s, enabled: false } : s
          )
        )
      }

      return updatedRows
    })
    setHasUnsavedChanges(true)
  }

  const handleAddRow = () => {
    const newRow: LayoutRow = {
      id: `row-${Date.now()}`,
      type: 'double',
      left: null,
      right: null,
    }
    setLayoutRows((prev) => [...prev, newRow])
    setHasUnsavedChanges(true)
  }

  const handleRemoveRow = (rowId: string) => {
    setLayoutRows((prev) => prev.filter((row) => row.id !== rowId))
    setHasUnsavedChanges(true)
  }

  // Normalize sections grid positions to ensure compact layout
  const normalizeSectionsGrid = (sections: ProfileSection[]): ProfileSection[] => {
    const enabled = sections.filter((s) => s.enabled)
    const disabled = sections.filter((s) => !s.enabled)

    // Sort enabled by row, then col
    enabled.sort((a, b) => {
      const rowA = a.row ?? 0
      const rowB = b.row ?? 0
      if (rowA !== rowB) return rowA - rowB
      const colA = a.col ?? 0
      const colB = b.col ?? 0
      return colA - colB
    })

    // Reassign positions sequentially
    const normalized: ProfileSection[] = []
    let currentRow = 0
    let currentCol = 0

    for (const section of enabled) {
      const span = section.span || 'single'

      if (span === 'full') {
        normalized.push({
          ...section,
          row: currentRow,
          col: 0,
          span: 'full',
        })
        currentRow++
        currentCol = 0
      } else {
        if (currentCol >= 2) {
          currentRow++
          currentCol = 0
        }
        normalized.push({
          ...section,
          row: currentRow,
          col: currentCol as 0 | 1,
          span: section.span || 'half',
        })
        currentCol++
        if (currentCol >= 2) {
          currentRow++
          currentCol = 0
        }
      }
    }

    // Add disabled sections
    return [...normalized, ...disabled]
  }

  const handleApplyRecommendedLayout = () => {
    setSections((prev) =>
      prev.map((section) => {
        const recommendation = getRecommendation(section.id)
        // Apply recommended span ONLY for HARD_HEAVY blocks if span is undefined (safe mode)
        if (!section.span && recommendation.applyOnSafeMode && recommendation.defaultSpan) {
          return {
            ...section,
            span: recommendation.defaultSpan,
          }
        }
        return section
      })
    )
    setHasUnsavedChanges(true)
    toast.success('Recommended layout applied')
  }

  const handleApplyPreset = async (preset: PresetDefinition) => {
    if (!address) {
      toast.error('Wallet connection required')
      return
    }

    try {
      setSaving(true)

      // Apply preset transform to current config (pure function)
      const nextConfig = applyPreset(layoutConfig, preset.id)

      // Normalize to ensure consistency
      const normalizedConfig = normalizeLayoutConfig(nextConfig)

      // Get nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) throw new Error('Failed to get nonce')
      const { nonce } = await nonceResponse.json()

      // Sign message
      showTransactionLoader("Confirm in Wallet...")
      const message = `Update profile layout for ${address}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      showTransactionLoader("Applying preset...")

      // Save to API immediately
      const response = await fetch('/api/profile/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          layout: normalizedConfig,
          signature,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to save preset')
      }

      const data = await response.json()
      const savedConfig = data.layout || normalizedConfig

      // Update state from saved config (single source of truth)
      setLayoutConfig(savedConfig)

      // Update row-based layout
      if (savedConfig.rows && savedConfig.rows.length > 0) {
        setLayoutRows(savedConfig.rows)
      } else {
        const rowLayout = gridToRowLayout(savedConfig)
        setLayoutRows(rowLayout.rows)
      }

      // Update sections UI to match saved config
      const byId = INITIAL_SECTIONS.reduce<Record<ProfileSectionId, ProfileSection>>(
        (acc, section) => {
          acc[section.id] = section
          return acc
        },
        {} as Record<ProfileSectionId, ProfileSection>
      )

      const nextSections: ProfileSection[] = []
      // Sort blocks by grid position (row, then col)
      const sortedBlocks = [...savedConfig.blocks]
        .filter((b) => b.key !== 'summary') // Filter out deprecated summary
        .sort((a, b) => {
          const rowA = a.row ?? 0
          const rowB = b.row ?? 0
          if (rowA !== rowB) return rowA - rowB
          const colA = a.col ?? 0
          const colB = b.col ?? 0
          return colA - colB
        })
      const usedIds = new Set<ProfileSectionId>()

      for (const block of sortedBlocks) {
        const id = block.key as ProfileSectionId
        const base = byId[id]
        if (!base) continue
        usedIds.add(id)
        nextSections.push({
          ...base,
          enabled: block.enabled,
          variant: block.variant || 'compact',
          row: block.row ?? 0,
          col: block.col ?? 0,
          span: block.span || 'single',
        })
      }

      for (const section of INITIAL_SECTIONS) {
        if (!usedIds.has(section.id)) {
          nextSections.push({
            ...section,
            row: 0,
            col: 0,
            span: 'half',
          })
        }
      }

      setSections(nextSections)
      setHasUnsavedChanges(false)
      toast.success(`Preset applied: ${preset.name}. Please refresh the public profile page.`, {
        duration: 4000,
      })
    } catch (error) {
      console.error('[BuilderPanel] Failed to apply preset', error)
      toast.error('Failed to apply preset. Please try again.')
    } finally {
      setSaving(false)
      hideTransactionLoader()
    }
  }

  // Compute current effective config for UI sync (determining active preset)
  // We construct a temporary config object that reflects the current Sections and Rows state
  // This allows detectPreset to work against what the user sees, not just what was saved.
  const currentEffectiveConfig: ProfileLayoutConfig = (() => {
    const allBlocks = sections.map((section) => ({
      key: section.id,
      enabled: section.enabled,
      variant: section.variant || 'compact',
      order: 0, // Order is derived from row/col
      row: section.row ?? 0,
      col: section.col ?? 0 as 0 | 1,
      span: section.span || 'half',
    }))

    // Use current layoutRows directly
    const gridConfig = rowToGridLayout({ rows: layoutRows }, allBlocks)
    return {
      ...gridConfig,
      rows: layoutRows, // Include rows for completeness
      layoutVariant: 'rows',
    }
  })()

  return (
    <PageShell
      title="Profile Builder"
      subtitle="Control which sections appear on your public profile and how they are composed."
    >
      <div className="flex flex-col gap-6">
        {/* Profile Info - Horizontal Layout at Top */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Profile Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {/* 1. Display Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/70">Display Name</Label>
                <div className="relative group">
                  <Input
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value)
                      setHasUnsavedChanges(true)
                    }}
                    placeholder="Display name"
                    maxLength={32}
                    className="h-9"
                  />
                  <span className="absolute right-2 top-2.5 text-[10px] text-muted-foreground opacity-0 group-focus-within:opacity-100 transition-opacity">
                    {displayName.length}/32
                  </span>
                </div>
              </div>

              {/* 2. Bio (Compact) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold text-foreground/70">Bio</Label>
                </div>
                <div className="relative group">
                  <Textarea
                    value={bio}
                    onChange={(e) => {
                      setBio(e.target.value)
                      setHasUnsavedChanges(true)
                    }}
                    placeholder="Tell your story..."
                    maxLength={160}
                    rows={1}
                    className="min-h-[38px] resize-none transition-all duration-300 focus:min-h-[80px] py-2 leading-relaxed scrollbar-hide text-sm"
                  />
                  <span className="absolute right-2 bottom-2 text-[10px] text-muted-foreground opacity-0 group-focus-within:opacity-100 transition-opacity bg-background/80 px-1 rounded">
                    {bio.length}/160
                  </span>
                </div>

                {/* Pattern Badges - Hidden when bio has content */}
                {bio.length === 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-300">
                    {BIO_PATTERNS.map((pattern) => (
                      <Badge
                        key={pattern}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/10 hover:text-primary text-[10px] font-normal py-0 px-2 h-5 transition-colors border-0 bg-muted/50 text-muted-foreground"
                        onClick={() => {
                          setBio(pattern)
                          setHasUnsavedChanges(true)
                        }}
                      >
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Roles (Immediately after Bio) */}
              {/* 3. Roles (Immediately after Bio) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-baseline justify-between">
                  <Label className="text-xs font-semibold text-foreground/70">Roles <span className="text-[10px] font-normal text-muted-foreground ml-1">(Max 3)</span></Label>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline-block">First selected is Primary</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ROLES.map((role) => {
                    const isPrimary = primaryRole === role
                    const isSecondary = secondaryRoles.includes(role)
                    const isSelected = isPrimary || isSecondary

                    return (
                      <Button
                        key={role}
                        variant="outline"
                        size="sm"
                        className={`
                          rounded-full px-3 py-0.5 h-[28px] text-xs font-medium transition-all duration-200 border
                          ${isPrimary
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'
                            : isSecondary
                              ? 'bg-background text-primary border-primary/50 hover:bg-primary/5 ring-1 ring-primary/10'
                              : 'bg-transparent text-muted-foreground border-border/60 hover:border-foreground/40 hover:text-foreground hover:bg-muted/30'
                          }
                        `}
                        onClick={() => handleRoleClick(role)}
                      >
                        {role}
                        {isPrimary && <div className="ml-1.5 w-1 h-1 rounded-full bg-primary-foreground/60" />}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* 4. Status (Bottom - Enhanced Visibility) */}
              <div className="pt-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Label className="text-xs font-semibold text-foreground/70">Status</Label>
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground/70 cursor-help hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[220px] text-xs">
                        A short update about your current focus or project. Visible on your profile card.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative group">
                  <Input
                    value={statusMessage}
                    onChange={(e) => {
                      setStatusMessage(e.target.value)
                      setHasUnsavedChanges(true)
                    }}
                    placeholder="What are you building?"
                    maxLength={60}
                    className="h-9 bg-muted/30 border-border/60 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-sm placeholder:text-muted-foreground/60"
                  />
                  <span className="absolute right-2 top-2.5 text-[10px] text-muted-foreground opacity-0 group-focus-within:opacity-100 transition-opacity bg-background/80 px-1 rounded">
                    {statusMessage.length}/60
                  </span>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
          {/* Left: Sections control */}
          <div ref={linksSectionRef}>
            <Card className="bg-card border border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Profile Sections</CardTitle>
                <CardDescription>
                  Drag sections to arrange your public profile layout.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  measuring={{
                    droppable: {
                      strategy: MeasuringStrategy.Always,
                    },
                  }}
                >
                  {/* SortableContext for rows (with vertical restriction) */}
                  <SortableContext
                    items={layoutRows.map((row) => row.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {/* SortableContext for all sections/cards */}
                    <SortableContext
                      items={sections.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {/* Row-based Layout Builder */}
                      <div className="space-y-4">
                        {layoutRows.map((row) => (
                          <RowBuilder
                            key={row.id}
                            row={row}
                            sections={sections}
                            onToggleSection={handleToggleSection}
                            onVariantChange={handleVariantChange}
                            onToggleRowType={() => handleToggleRowType(row.id)}
                            onRemoveRow={() => handleRemoveRow(row.id)}
                            sensors={sensors}
                            canRemove={layoutRows.length > 1}
                            isDraggingCard={activeDrag?.type === 'card'}
                          />
                        ))}

                        {/* Add Row Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddRow}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Row
                        </Button>
                      </div>
                    </SortableContext>
                  </SortableContext>

                  {/* Disabled Sections Area */}
                  {(() => {
                    const disabledSections = sections.filter((s) => !s.enabled)
                    if (disabledSections.length === 0) return null

                    return (
                      <div className="mt-6 pt-6 border-t">
                        <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                          Disabled Sections
                        </h3>
                        <DisabledSectionsZone>
                          <SortableContext
                            items={disabledSections.map((s) => s.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {disabledSections.map((section) => (
                                <SortableSectionRow
                                  key={section.id}
                                  section={section}
                                  onToggle={handleToggleSection}
                                  onVariantChange={handleVariantChange}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DisabledSectionsZone>
                      </div>
                    )
                  })()}

                  {/* Drag Overlay - shows preview while dragging */}
                  <DragOverlay>
                    {activeDrag ? (() => {
                      if (activeDrag.type === 'row') {
                        const activeRow = layoutRows.find((r) => r.id === activeDrag.id)
                        if (!activeRow) return null
                        return (
                          <div className="rounded-lg border border-border/60 bg-background/40 p-4 shadow-lg ring-1 ring-border/60">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">
                                {activeRow.type === 'single' ? 'Full Width Row' : 'Two Columns Row'}
                              </span>
                            </div>
                          </div>
                        )
                      }

                      // Dragging a section card - show actual card component
                      const activeSection = sections.find((s) => s.id === activeDrag.id)
                      if (!activeSection) return null

                      return (
                        <div className="rounded-md border border-border/60 bg-background px-3 py-3 shadow-lg ring-1 ring-border/60">
                          <div className="flex items-start gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground bg-muted/60">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium leading-none">{activeSection.title}</p>
                                {(() => {
                                  const recommendation = getRecommendation(activeSection.id)
                                  if (!recommendation.badge) return null
                                  const isHardHeavy = activeSection.id === 'assets'
                                  const badgeText = isHardHeavy ? 'Recommended: Full width' : 'Optional: Full width'
                                  return (
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 font-normal h-4 border-muted-foreground/30 text-muted-foreground shrink-0">
                                      {badgeText}
                                    </Badge>
                                  )
                                })()}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{activeSection.description}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })() : null}
                  </DragOverlay>
                </DndContext>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Appearance */}
          <div className="flex flex-col">
            {/* Appearance Section - Visually de-emphasized */}
            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Appearance</h3>
                <p className="text-xs text-muted-foreground">Choose a visual style for your profile</p>
              </div>
              <div className="space-y-2 pb-6">
                {(['default', 'minimal', 'dense', 'spotlight'] as ProfileTheme[]).map((theme) => {
                  const isSelected = appearanceConfig.theme === theme
                  const themeDescriptions: Record<ProfileTheme, { short: string; long: string }> = {
                    default: {
                      short: 'Neutral / Standard',
                      long: 'Balanced spacing and standard card styling.',
                    },
                    minimal: {
                      short: 'Editorial / Calm',
                      long: 'Reduced borders and no shadows for readability.',
                    },
                    dense: {
                      short: 'Tactical / Dense',
                      long: 'High contrast and compact layout.',
                    },
                    spotlight: {
                      short: 'Expressive / Focus',
                      long: 'Highlights key elements with glow effects.',
                    },
                  }
                  const desc = themeDescriptions[theme]

                  return (
                    <div
                      key={theme}
                      onClick={() => handleThemeChange(theme)}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      className="cursor-pointer group outline-none"
                    >
                      <Card className={`
                        relative transition-all duration-200 border
                        ${isSelected
                          ? 'bg-muted/30 border-primary/40 shadow-sm'
                          : 'bg-card border-border hover:bg-muted/20 hover:border-border/80'
                        }
                      `}>
                        <CardContent className="p-3 flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            {/* Title */}
                            <div className={`text-sm font-medium capitalize flex items-center gap-2 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {theme}
                            </div>

                            {/* Description */}
                            <div className="text-xs text-muted-foreground leading-snug max-w-[200px]">
                              {desc.short}
                            </div>
                          </div>

                          {/* Right Side: Selection Indicator */}
                          <div className="shrink-0 pt-0.5">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Sparkles className="w-3 h-3" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-border/60 bg-transparent group-hover:border-border transition-colors" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Layout Actions - Moved from header */}
            <div className="pt-4 pb-4 border-t border-border space-y-3 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 -mx-6 px-6 -mb-6">
              <div className="flex items-center justify-between gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      disabled={saving || loading}
                    >
                      Layout options
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="text-xs">Layout presets</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {PRESETS.map((preset) => {
                      const currentPreset = detectPreset(currentEffectiveConfig)
                      const isActive = currentPreset === preset.id
                      return (
                        <DropdownMenuItem
                          key={preset.id}
                          className={`flex flex-col items-start space-y-0.5 py-2 text-xs ${isActive ? 'bg-accent' : ''
                            }`}
                          onClick={() => handleApplyPreset(preset)}
                          disabled={saving || loading}
                        >
                          <span className="font-medium flex items-center gap-2">
                            {preset.name}
                            {isActive && <span className="text-[10px] text-muted-foreground">(Active)</span>}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {preset.description}
                          </span>
                        </DropdownMenuItem>
                      )
                    })}
                    {detectPreset(currentEffectiveConfig) === 'custom' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                          Custom (manual changes detected)
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleApplyRecommendedLayout}
                      disabled={saving || loading}
                      className="text-xs"
                    >
                      Apply recommended layout
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleResetLayout}
                      className="text-xs"
                    >
                      Reset layout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveLayout}
                  disabled={saving || loading || !hasUnsavedChanges}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

