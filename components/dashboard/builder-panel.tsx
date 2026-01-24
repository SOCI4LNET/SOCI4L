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
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Sparkles, MoreVertical, Info } from 'lucide-react'

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
  getDefaultProfileLayout,
  applyPreset,
  detectPreset,
  normalizeLayoutConfig,
  getRecommendation,
} from '@/lib/profile-layout'
import {
  type ProfileAppearanceConfig,
  type ProfileTheme,
  getDefaultAppearanceConfig,
  normalizeAppearanceConfig,
} from '@/lib/profile-appearance'

type SectionId = ProfileBlockKey

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

// Grid drop zone component
function GridDropZone({ row, col, children }: { row: number; col: 0 | 1; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `grid-${row}-${col}`,
  })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] rounded-md border-2 border-dashed transition-colors p-2 overflow-hidden ${
        isOver ? 'border-primary bg-primary/5' : 'border-border/40 bg-muted/20'
      }`}
    >
      {children}
    </div>
  )
}

// Disabled sections drop zone component
function DisabledSectionsZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'disabled-sections',
  })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-md border-2 border-dashed transition-colors p-4 ${
        isOver ? 'border-destructive bg-destructive/5' : 'border-border/40 bg-muted/10'
      }`}
    >
      {children}
    </div>
  )
}

type SortableSectionRowProps = {
  section: ProfileSection
  onToggle: (id: ProfileSectionId, enabled: boolean) => void
  onVariantChange?: (id: ProfileSectionId, variant: BlockVariant) => void
}

function SortableSectionRow({ section, onToggle, onVariantChange }: SortableSectionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border border-border/60 bg-background/60 px-3 py-3 shadow-sm transition overflow-hidden
      ${!section.enabled ? 'opacity-60' : ''} 
      ${isDragging ? 'ring-1 ring-primary/40 shadow-lg bg-background' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing ${
            isDragging ? 'text-foreground bg-muted/60' : ''
          }`}
          aria-label={`${section.title} section drag handle`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium leading-none">{section.title}</p>
            {getRecommendation(section.id).badge && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 font-normal h-4 border-muted-foreground/30 text-muted-foreground shrink-0">
                      Recommended
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">This section usually looks better full width on public profiles.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
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

type BuilderPanelProps = {
  address: string
}

export function BuilderPanel({ address }: BuilderPanelProps) {
  const searchParams = useSearchParams()
  const linksSectionRef = useRef<HTMLDivElement>(null)
  const [sections, setSections] = useState<ProfileSection[]>(INITIAL_SECTIONS)
  const [layoutConfig, setLayoutConfig] = useState<ProfileLayoutConfig>(() =>
    getDefaultProfileLayout()
  )
  const [appearanceConfig, setAppearanceConfig] = useState<ProfileAppearanceConfig>(() =>
    getDefaultAppearanceConfig()
  )
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [highlightedLinkId, setHighlightedLinkId] = useState<string | null>(null)
  const [highlightedCategoryId, setHighlightedCategoryId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Load layout from API on mount
  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }

    const loadLayout = async () => {
      try {
        setLoading(true)
        const layoutResponse = await fetch(`/api/profile/layout?address=${encodeURIComponent(address)}`)
        const appearanceResponse = await fetch(`/api/profile/appearance?address=${encodeURIComponent(address)}`)
        
        if (!layoutResponse.ok) {
          const errorData = await layoutResponse.json().catch(() => ({ error: 'Bilinmeyen hata' }))
          throw new Error(errorData.error || `HTTP ${layoutResponse.status}: Layout yüklenemedi`)
        }
        
        const layoutData = await layoutResponse.json()
        
        // Check if response has an error field
        if (layoutData.error) {
          throw new Error(layoutData.error)
        }
        
        const config = layoutData.layout || getDefaultProfileLayout()
        setLayoutConfig(config)

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
        const errorMessage = error instanceof Error ? error.message : 'Layout yüklenirken bir hata oluştu'
        toast.error(errorMessage)
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
      // Convert sections to blocks with grid positions
      const blocks: ProfileLayoutBlock[] = sections.map((section) => {
        const row = section.row ?? 0
        const col = section.col ?? 0
        const span = section.span || 'half'
        // Calculate order for backward compatibility
        const order = span === 'full' ? row * 2 : row * 2 + col
        return {
          key: section.id,
          enabled: section.enabled,
          order,
          row,
          col,
          span,
          variant: section.variant || 'compact',
        }
      })

      const nextConfig: ProfileLayoutConfig = {
        layoutVariant: 'grid',
        columns: 2,
        blocks,
      }

      // Normalize before saving
      const normalizedConfig = normalizeLayoutConfig(nextConfig)
      console.log('[BuilderPanel] Saving layout config:', normalizedConfig)
      console.log('[BuilderPanel] Saving appearance config:', appearanceConfig)

      const response = await fetch('/api/profile/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          layout: normalizedConfig,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to save layout')
      }

      const layoutData = await response.json()
      const savedConfig = normalizeLayoutConfig(layoutData.layout || normalizedConfig)
      console.log('[BuilderPanel] Layout saved successfully:', savedConfig)
      setLayoutConfig(savedConfig)

      // Save appearance config
      const normalizedAppearance = normalizeAppearanceConfig(appearanceConfig)
      console.log('[BuilderPanel] Saving appearance config:', normalizedAppearance)
      const appearanceResponse = await fetch('/api/profile/appearance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          appearance: normalizedAppearance,
        }),
      })

      if (appearanceResponse.ok) {
        const appearanceData = await appearanceResponse.json()
        console.log('[BuilderPanel] Appearance saved successfully:', appearanceData.appearance)
        setAppearanceConfig(appearanceData.appearance)
      } else {
        console.error('[BuilderPanel] Failed to save appearance config:', appearanceResponse.status)
      }

      toast.success('Layout ve görünüm kaydedildi. Public profile sayfasını yenileyin.')
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('[BuilderPanel] Failed to save layout', error)
      toast.error(error instanceof Error ? error.message : 'Layout kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleVariantChange = (id: ProfileSectionId, variant: BlockVariant) => {
    setSections((prev) =>
      prev.map((section) => (section.id === id ? { ...section, variant } : section))
    )
    setHasUnsavedChanges(true)
  }

  const handleResetLayout = () => {
    setSections(INITIAL_SECTIONS)
    setLayoutConfig(getDefaultProfileLayout())
    setAppearanceConfig(getDefaultAppearanceConfig())
    toast.success('Layout reset')
    setHasUnsavedChanges(false)
  }

  const handleThemeChange = (theme: ProfileTheme) => {
    setAppearanceConfig({ ...appearanceConfig, theme })
    setHasUnsavedChanges(true)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Handle disabled sections drop zone: disable the section
    if (over.id === 'disabled-sections') {
      setSections((prev) =>
        prev.map((s) =>
          s.id === active.id
            ? { ...s, enabled: false }
            : s
        )
      )
      setHasUnsavedChanges(true)
      return
    }

    // Handle grid drop: over.id format is "grid-{row}-{col}"
    if (typeof over.id === 'string' && over.id.startsWith('grid-')) {
      const [, rowStr, colStr] = over.id.split('-')
      const targetRow = parseInt(rowStr, 10)
      const targetCol = parseInt(colStr, 10) as 0 | 1

      setSections((prev) => {
        const draggedSection = prev.find((s) => s.id === active.id)
        if (!draggedSection) return prev

        // Find if there's already a section at target position
        const existingAtTarget = prev.find(
          (s) => s.enabled && s.id !== active.id && s.row === targetRow && s.col === targetCol
        )

        // If target position is occupied, shift the existing section
        let updated = prev.map((s) => {
          if (s.id === active.id) {
            // Move dragged section to target
            // Apply recommended span ONLY for HARD_HEAVY blocks if span is undefined
            const recommendation = getRecommendation(s.id)
            const recommendedSpan = !s.span && recommendation.defaultSpan ? recommendation.defaultSpan : (s.span || 'half')
            return {
              ...s,
              enabled: true,
              row: targetRow,
              col: targetCol,
              span: recommendedSpan,
            }
          }
          if (existingAtTarget && s.id === existingAtTarget.id) {
            // Move existing section to dragged section's old position
            return {
              ...s,
              row: draggedSection.row ?? 0,
              col: draggedSection.col ?? 0,
            }
          }
          return s
        })

        // Normalize grid positions (remove gaps, ensure compact layout)
        return normalizeSectionsGrid(updated)
      })
      setHasUnsavedChanges(true)
      return
    }

    // Fallback: old vertical list behavior (for backward compatibility)
    setSections((prev) => {
      const oldIndex = prev.findIndex((section) => section.id === active.id)
      const newIndex = prev.findIndex((section) => section.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
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
      toast.error('Address required to apply preset')
      return
    }

    try {
      setSaving(true)
      
      // Apply preset transform to current config (pure function)
      const nextConfig = applyPreset(layoutConfig, preset.id)
      
      // Normalize to ensure consistency
      const normalizedConfig = normalizeLayoutConfig(nextConfig)

      // Save to API immediately (atomic operation)
      const response = await fetch('/api/profile/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          layout: normalizedConfig,
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
      toast.success(`Preset uygulandı: ${preset.name}`)
    } catch (error) {
      console.error('[BuilderPanel] Failed to apply preset', error)
      toast.error(error instanceof Error ? error.message : 'Preset uygulanamadı')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell
      title="Profile Builder"
      subtitle="Control which sections appear on your public profile and how they are composed."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Adjust which sections are visible and how they are ordered on your public profile.
          </p>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  disabled={saving || loading}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    {(() => {
                      const currentPreset = detectPreset(layoutConfig)
                      if (currentPreset === 'custom') return 'Presets'
                      const preset = PRESETS.find((p) => p.id === currentPreset)
                      return preset ? preset.name : 'Presets'
                    })()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs">Profile presets</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {PRESETS.map((preset) => {
                  const currentPreset = detectPreset(layoutConfig)
                  const isActive = currentPreset === preset.id
                  return (
                    <DropdownMenuItem
                      key={preset.id}
                      className={`flex flex-col items-start space-y-0.5 py-2 text-xs ${
                        isActive ? 'bg-accent' : ''
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
                {detectPreset(layoutConfig) === 'custom' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      Custom (manual changes detected)
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplyRecommendedLayout}
              disabled={saving || loading}
            >
              Apply recommended layout
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetLayout}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSaveLayout}
              disabled={saving || loading}
            >
              Save layout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Sections control */}
          <div ref={linksSectionRef}>
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Profile Sections</CardTitle>
              <CardDescription>
                Turn sections on or off and reorder them to control your public profile layout.
                <span className="block mt-1 text-xs text-muted-foreground">
                  Note: Single blocks on a row will render full-width on the public profile.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map((section) => section.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {/* Grid Builder: 2 columns */}
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const enabledSections = sections.filter((s) => s.enabled)
                      const maxRow = enabledSections.reduce((max, s) => {
                        const row = s.row ?? 0
                        return Math.max(max, row)
                      }, 0)
                      const rows = Math.max(maxRow + 1, 3) // At least 3 rows

                      // Group sections by position
                      const sectionsByPos = new Map<string, ProfileSection>()
                      for (const section of enabledSections) {
                        const row = section.row ?? 0
                        const col = section.col ?? 0
                        const key = `${row}-${col}`
                        sectionsByPos.set(key, section)
                      }

                      // Render grid cells
                      const cells: React.ReactNode[] = []
                      for (let row = 0; row < rows; row++) {
                        const leftSection = sectionsByPos.get(`${row}-0`)
                        const rightSection = sectionsByPos.get(`${row}-1`)
                        const isFullSpan = leftSection?.span === 'full'

                        // Full-span section: render once, span both columns
                        if (isFullSpan && leftSection) {
                          cells.push(
                            <div key={`${row}-full`} className="col-span-2">
                              <GridDropZone row={row} col={0}>
                                <SortableSectionRow
                                  section={leftSection}
                                  onToggle={handleToggleSection}
                                  onVariantChange={handleVariantChange}
                                />
                              </GridDropZone>
                            </div>
                          )
                          // Skip right column for full-span
                          continue
                        }

                        // Regular cells: left and right columns
                        for (let col = 0; col < 2; col++) {
                          const key = `${row}-${col}`
                          const section = sectionsByPos.get(key)
                          cells.push(
                            <GridDropZone key={key} row={row} col={col as 0 | 1}>
                              {section ? (
                                <SortableSectionRow
                                  section={section}
                                  onToggle={handleToggleSection}
                                  onVariantChange={handleVariantChange}
                                />
                              ) : (
                                <div className="text-xs text-muted-foreground text-center py-4">
                                  Drop here
                                </div>
                              )}
                            </GridDropZone>
                          )
                        }
                      }
                      return cells
                    })()}
                  </div>
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
                      </DisabledSectionsZone>
                    </div>
                  )
                })()}
                
                {/* Drag Overlay - shows preview while dragging */}
                <DragOverlay>
                  {activeId ? (() => {
                    const activeSection = sections.find((s) => s.id === activeId)
                    if (!activeSection) return null
                    return (
                      <div className="rounded-md border border-border/60 bg-background px-3 py-3 shadow-lg opacity-90 rotate-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground bg-muted/60">
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">{activeSection.title}</p>
                            <p className="text-xs text-muted-foreground">{activeSection.description}</p>
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

          {/* Appearance Section */}
          <Card className="bg-card border border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(['default', 'minimal', 'dense', 'spotlight'] as ProfileTheme[]).map((theme) => {
                  const isSelected = appearanceConfig.theme === theme
                  const themeDescriptions: Record<ProfileTheme, { short: string; long: string }> = {
                    default: {
                      short: 'Standard spacing and styling',
                      long: 'Standard spacing and styling with balanced visual hierarchy.',
                    },
                    minimal: {
                      short: 'Reduced borders, larger spacing',
                      long: 'Clean and minimal design with reduced borders and larger spacing for better readability.',
                    },
                    dense: {
                      short: 'Tighter spacing, compact cards',
                      long: 'Compact layout with tighter spacing and smaller cards for information-dense profiles.',
                    },
                    spotlight: {
                      short: 'Emphasized header and links',
                      long: 'Spotlight design that emphasizes the header and links section for maximum visibility.',
                    },
                  }
                  const description = themeDescriptions[theme]

                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => handleThemeChange(theme)}
                      aria-pressed={isSelected}
                      className={`w-full rounded-md border px-3 py-2.5 text-left transition-colors flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-1 ring-primary/20'
                          : 'border-border/60 bg-background/60 hover:border-border hover:bg-background'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium capitalize mb-0.5">{theme}</div>
                        <div className="text-xs text-muted-foreground">{description.short}</div>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                              aria-label={`${theme} theme information`}
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-[200px]">{description.long}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}

