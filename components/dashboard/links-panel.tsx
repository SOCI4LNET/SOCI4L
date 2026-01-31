'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useParams, useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

import {
  DndContext,
  PointerSensor,
  closestCenter,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Link2, Plus, Pencil, Trash2, ExternalLink, BarChart2, Github, Linkedin, Globe, Youtube, Eye, EyeOff, ArrowUp, ArrowDown, Folder, ChevronDown, ChevronRight, MoreVertical, Loader2, Instagram } from 'lucide-react'
import { XIcon } from '@/components/icons/x-icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { PageShell } from '@/components/app-shell/page-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Toggle } from '@/components/ui/toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useTransaction } from '@/components/providers/transaction-provider'

import { useLinks, LinkItem, LinkCategory } from '@/hooks/use-links'

type SocialLinkPlatform = 'website' | 'x' | 'instagram' | 'github' | 'youtube' | 'linkedin'

interface SocialLink {
  id: string
  platform: SocialLinkPlatform
  url: string
  label?: string
}

// =============================================================================
// DRAG & DROP COMPONENTS
// =============================================================================

// Draggable Category Header - only the header is draggable for categories
function DraggableCategoryHeader({
  category,
  linkCount,
  isCollapsed,
  onToggleCollapse,
  onToggleVisibility,
  onEdit,
  onDelete,
  canDelete,
  isDragDisabled,
}: {
  category: LinkCategory
  linkCount: number
  isCollapsed: boolean
  onToggleCollapse: () => void
  onToggleVisibility: () => void
  onEdit: () => void
  onDelete: () => void
  canDelete: boolean
  isDragDisabled: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `cat-${category.id}`,
    data: { type: 'category', category },
    disabled: isDragDisabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md border transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border/40 bg-muted/20'
        }`}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex items-center justify-center h-6 w-6 rounded hover:bg-muted/60 transition-colors"
        aria-label={isCollapsed ? 'Expand category' : 'Collapse category'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={`flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground ${isDragDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
          }`}
        aria-label={`${category.name} drag handle`}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{category.name}</p>
          <Badge variant="secondary" className="text-xs">{linkCount}</Badge>
          {category.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
        </div>
      </div>
      <Toggle
        aria-label={`Toggle ${category.name} visibility`}
        size="sm"
        variant="outline"
        pressed={category.isVisible}
        onPressedChange={onToggleVisibility}
      >
        {category.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </Toggle>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Category menu">
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </DropdownMenuItem>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete category?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will move all links in this category to the default category.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={onDelete}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Drop zone for links - each category has one, shows when link is dragged over
function LinkDropZone({
  categoryId,
  isActive,
  isEmpty,
}: {
  categoryId: string
  isActive: boolean
  isEmpty: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${categoryId}`,
    data: { type: 'category-drop', categoryId },
  })

  // Only show drop zone when actively dragging a link and this zone is active
  if (!isActive) return null

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[40px] rounded-md border-2 border-dashed transition-colors mx-4 my-2 flex items-center justify-center ${isOver
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-muted-foreground/30 text-muted-foreground'
        }`}
    >
      <span className="text-xs">
        {isOver ? 'Drop here' : (isEmpty ? 'Drag links here' : '')}
      </span>
    </div>
  )
}

// Draggable Link Row
function DraggableLinkRow({
  link,
  targetAddress,
  highlighted,
  onToggleEnabled,
  onEdit,
  onDelete,
  isDragDisabled,
}: {
  link: LinkItem
  targetAddress: string
  highlighted?: boolean
  onToggleEnabled: (id: string, enabled: boolean) => void
  onEdit: (link: LinkItem) => void
  onDelete: (id: string) => void
  isDragDisabled: boolean
}) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
    data: { type: 'link', link },
    disabled: isDragDisabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border px-3 py-3 shadow-sm transition ${highlighted ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border/60 bg-background/60'
        } ${!link.enabled ? 'opacity-60' : ''} ${isDragging ? 'ring-1 ring-primary/40 shadow-lg bg-background' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className={`flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground ${isDragDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
            }`}
          aria-label={`${link.title || link.url} drag handle`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-sm font-medium leading-none truncate">{link.title || link.url}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:text-primary transition-colors"
              title={link.url}
            >
              {link.url}
            </a>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open link"
              className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-primary hover:bg-muted/60 shrink-0"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Toggle
            aria-label={`Toggle ${link.title || link.url}`}
            size="sm"
            variant="outline"
            pressed={link.enabled}
            onPressedChange={(pressed) => onToggleEnabled(link.id, pressed)}
          >
            {link.enabled ? 'On' : 'Off'}
          </Toggle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push(`/dashboard/${targetAddress}/links/${link.id}`)}
            aria-label="View link details"
          >
            <BarChart2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(link)}
            aria-label="Edit link"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                aria-label="Delete link"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete link?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the link from your profile builder.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onDelete(link.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

// Category Block - contains header and links
function CategoryBlock({
  category,
  categoryLinks,
  isCollapsed,
  onToggleCollapse,
  onToggleVisibility,
  onEdit,
  onDelete,
  canDelete,
  targetAddress,
  highlightedLinkId,
  onToggleEnabled,
  onEditLink,
  onDeleteLink,
  activeDragType,
  isLinkDragging,
}: {
  category: LinkCategory
  categoryLinks: LinkItem[]
  isCollapsed: boolean
  onToggleCollapse: () => void
  onToggleVisibility: () => void
  onEdit: () => void
  onDelete: () => void
  canDelete: boolean
  targetAddress: string
  highlightedLinkId: string | null
  onToggleEnabled: (id: string, enabled: boolean) => void
  onEditLink: (link: LinkItem) => void
  onDeleteLink: (id: string) => void
  activeDragType: 'category' | 'link' | null
  isLinkDragging: boolean
}) {
  return (
    <div className="space-y-2">
      <DraggableCategoryHeader
        category={category}
        linkCount={categoryLinks.length}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        onToggleVisibility={onToggleVisibility}
        onEdit={onEdit}
        onDelete={onDelete}
        canDelete={canDelete}
        isDragDisabled={activeDragType === 'link'}
      />

      {!isCollapsed && (
        <div className="pl-4 space-y-2">
          {/* Links */}
          {categoryLinks.map((link) => (
            <DraggableLinkRow
              key={link.id}
              link={link}
              targetAddress={targetAddress}
              highlighted={highlightedLinkId === link.id}
              onToggleEnabled={onToggleEnabled}
              onEdit={onEditLink}
              onDelete={onDeleteLink}
              isDragDisabled={activeDragType === 'category'}
            />
          ))}

          {/* Drop zone for empty categories or when dragging links */}
          <LinkDropZone
            categoryId={category.id}
            isActive={isLinkDragging}
            isEmpty={categoryLinks.length === 0}
          />
        </div>
      )}
    </div>
  )
}


export function LinksPanel({ targetAddress: propTargetAddress }: { targetAddress?: string }) {
  const params = useParams()
  const searchParams = useSearchParams()
  const { address: connectedAddress } = useAccount()
  const linksListRef = useRef<HTMLDivElement>(null)

  // Determine target address
  const targetAddress = propTargetAddress?.toLowerCase() || (params.address as string)?.toLowerCase() || connectedAddress?.toLowerCase() || ''

  // Use the hook
  const {
    links,
    categories,
    loading,
    socialLinks,
    createLink,
    updateLink,
    deleteLink,
    saveLinks,
    createCategory,
    updateCategory,
    deleteCategory,
    saveCategories,
    saveSocialLinks,
    isReadOnly
  } = useLinks(targetAddress)

  const categoriesLoading = loading
  const socialLinksLoading = loading
  const socialLinksSaving = loading
  const saving = loading
  const categoriesSaving = loading

  // Local UI State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formCategoryId, setFormCategoryId] = useState<string>('')

  const [highlightedLinkId, setHighlightedLinkId] = useState<string | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)

  // Category management state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<LinkCategory | null>(null)
  const [categoryFormName, setCategoryFormName] = useState('')
  const [categoryFormDescription, setCategoryFormDescription] = useState('')

  // Social Links state
  const [socialDialogOpen, setSocialDialogOpen] = useState(false)
  const [editingSocialLink, setEditingSocialLink] = useState<SocialLink | null>(null)
  const [newSocialPlatform, setNewSocialPlatform] = useState<SocialLinkPlatform>('website')
  const [newSocialUrl, setNewSocialUrl] = useState('')
  const [newSocialLabel, setNewSocialLabel] = useState('')

  // Helper functions for social links
  const getSocialIcon = (platform: SocialLinkPlatform) => {
    switch (platform) {
      case 'x': return <XIcon className="h-4 w-4" />
      case 'github': return <Github className="h-4 w-4" />
      case 'youtube': return <Youtube className="h-4 w-4" />
      case 'linkedin': return <Linkedin className="h-4 w-4" />
      case 'instagram': return <Instagram className="h-4 w-4" />
      case 'website': default: return <Globe className="h-4 w-4" />
    }
  }

  const getSocialLabel = (platform: SocialLinkPlatform) => {
    switch (platform) {
      case 'x': return 'X'
      case 'github': return 'GitHub'
      case 'youtube': return 'YouTube'
      case 'linkedin': return 'LinkedIn'
      case 'instagram': return 'Instagram'
      case 'website': default: return 'Website'
    }
  }

  const SOCIAL_LINK_ORDER: SocialLinkPlatform[] = ['website', 'x', 'instagram', 'github', 'youtube', 'linkedin']

  const sortSocialLinks = (links: SocialLink[]): SocialLink[] => {
    return [...links].sort((a, b) => {
      const indexA = SOCIAL_LINK_ORDER.indexOf(a.platform)
      const indexB = SOCIAL_LINK_ORDER.indexOf(b.platform)
      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
  }

  // Handle query params for deep linking
  useEffect(() => {
    const linkId = searchParams.get('link')
    if (linkId && linksListRef.current) {
      setHighlightedLinkId(linkId)
      setTimeout(() => {
        linksListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
      setTimeout(() => setHighlightedLinkId(null), 3000)
    }
  }, [searchParams])

  // Group links by category - memoized
  const linksByCategory = useMemo(() => {
    const grouped = new Map<string | null, LinkItem[]>()
    categories.forEach(cat => grouped.set(cat.id, []))
    grouped.set(null, [])
    links.forEach(link => {
      const categoryId = link.categoryId || null
      if (!grouped.has(categoryId)) grouped.set(categoryId, [])
      grouped.get(categoryId)!.push(link)
    })
    // Sort links within each category
    grouped.forEach((linkList) => {
      linkList.sort((a, b) => (a.order || 0) - (b.order || 0))
    })
    return grouped
  }, [categories, links])

  // Get sorted categories
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [categories])

  const getCategoryLinkCount = (categoryId: string | null) => {
    return linksByCategory.get(categoryId)?.length || 0
  }

  const toggleCategoryCollapse = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

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

  // =============================================================================
  // DRAG & DROP STATE AND HANDLERS
  // =============================================================================

  // Determine what type of item is being dragged
  const getActiveDragType = (): 'category' | 'link' | null => {
    if (!activeId) return null
    if (typeof activeId === 'string' && activeId.startsWith('cat-')) return 'category'
    if (links.some(l => l.id === activeId)) return 'link'
    return null
  }

  const activeDragType = getActiveDragType()
  const isLinkDragging = activeDragType === 'link'
  const isCategoryDragging = activeDragType === 'category'

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // Custom collision detection
  const customCollisionDetection: CollisionDetection = (args) => {
    const { active } = args
    const activeIdStr = active.id as string

    // For categories, only collide with other categories
    if (activeIdStr.startsWith('cat-')) {
      const collisions = closestCenter(args)
      return collisions.filter(c => {
        const id = c.id as string
        return id.startsWith('cat-')
      })
    }

    // For links, collide with other links and drop zones
    return closestCenter(args)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const activeIdStr = active.id as string
    const overIdStr = over.id as string

    // =======================================================================
    // CATEGORY REORDERING
    // =======================================================================
    if (activeIdStr.startsWith('cat-')) {
      const activeCategoryId = activeIdStr.replace('cat-', '')

      // Only accept drops on other categories
      if (!overIdStr.startsWith('cat-')) return

      const overCategoryId = overIdStr.replace('cat-', '')

      const activeIndex = sortedCategories.findIndex((cat) => cat.id === activeCategoryId)
      const overIndex = sortedCategories.findIndex((cat) => cat.id === overCategoryId)

      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return

      // Reorder categories
      const reordered = arrayMove(sortedCategories, activeIndex, overIndex)
      const withOrder = reordered.map((cat, idx) => ({
        ...cat,
        order: idx,
      }))

      await saveCategories(withOrder)
      return
    }

    // =======================================================================
    // LINK OPERATIONS
    // =======================================================================
    const activeLink = links.find((l) => l.id === activeIdStr)
    if (!activeLink) return

    // Case 1: Dropping on a category drop zone (empty area in category)
    if (overIdStr.startsWith('drop-')) {
      const targetCategoryId = overIdStr.replace('drop-', '')

      // Move link to new category
      const targetCategoryLinks = linksByCategory.get(targetCategoryId) || []
      const newOrder = targetCategoryLinks.length

      await updateLink(activeLink.id, { categoryId: targetCategoryId, order: newOrder })
      return
    }

    // Case 2: Dropping on another link
    const overLink = links.find((l) => l.id === overIdStr)
    if (!overLink) return

    const targetCategoryId = overLink.categoryId || null
    const targetCategoryLinks = linksByCategory.get(targetCategoryId) || []
    const overIndex = targetCategoryLinks.findIndex((l) => l.id === overIdStr)

    if (overIndex === -1) return

    // Moving to different category
    if (activeLink.categoryId !== targetCategoryId) {
      const oldCategoryLinks = linksByCategory.get(activeLink.categoryId || null) || []

      // Remove from old category
      const updatedOldLinks = oldCategoryLinks
        .filter((l) => l.id !== activeIdStr)
        .map((link, idx) => ({ ...link, order: idx }))

      // Add to new category at target position
      const newCategoryLinks = [...targetCategoryLinks]
      newCategoryLinks.splice(overIndex, 0, { ...activeLink, categoryId: targetCategoryId })
      const updatedNewLinks = newCategoryLinks.map((link, idx) => ({
        ...link,
        categoryId: targetCategoryId,
        order: idx,
      }))

      const allUpdatedLinks = [...updatedOldLinks, ...updatedNewLinks]
      await saveLinks(allUpdatedLinks)
    } else {
      // Reordering within same category
      const activeIndex = targetCategoryLinks.findIndex((l) => l.id === activeIdStr)
      if (activeIndex === -1 || activeIndex === overIndex) return

      const reordered = arrayMove(targetCategoryLinks, activeIndex, overIndex)
      const withOrder = reordered.map((link, index) => ({
        ...link,
        order: index,
      }))

      await saveLinks(withOrder)
    }
  }

  // --- CRUD Handlers ---

  const handleSubmit = async () => {
    // Validate
    const trimmedTitle = formTitle.trim()
    const trimmedUrl = formUrl.trim()
    const urlError = validateUrl(trimmedUrl)
    if (urlError) {
      toast.error('Please enter a valid URL (must start with http:// or https://)')
      return
    }

    const payload = {
      title: trimmedTitle,
      url: trimmedUrl,
      categoryId: formCategoryId === 'uncategorized' ? null : formCategoryId,
      // order handled by backend or hook default
    }

    let success = false
    if (editingLink) {
      success = await updateLink(editingLink.id, payload)
    } else {
      success = await createLink(payload)
    }

    if (success) {
      setDialogOpen(false)
      setEditingLink(null)
      setFormTitle('')
      setFormUrl('')
      setFormCategoryId('')
    }
  }

  const handleDelete = async (id: string) => {
    await deleteLink(id)
  }

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    await updateLink(id, { enabled })
  }

  const handleCategorySubmit = async () => {
    const trimmedName = categoryFormName.trim()
    if (!trimmedName) {
      toast.error('Category name is required')
      return
    }

    const slug = trimmedName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const payload = {
      name: trimmedName,
      description: categoryFormDescription.trim() || null,
      slug: slug,
      isVisible: true,
    }

    let success = false
    if (editingCategory) {
      success = await updateCategory(editingCategory.id, payload)
    } else {
      success = await createCategory({ ...payload, isDefault: false, order: categories.length })
    }

    if (success) {
      setCategoryDialogOpen(false)
      setEditingCategory(null)
      setCategoryFormName('')
      setCategoryFormDescription('')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id)
  }

  const handleToggleCategoryVisibility = async (id: string) => {
    const cat = categories.find((c) => c.id === id)
    if (cat) {
      await updateCategory(id, { isVisible: !cat.isVisible })
    }
  }

  // --- Socials ---
  const handleSaveSocialLink = async () => {
    if (!newSocialUrl.trim()) {
      toast.error('URL is required')
      return
    }

    if (!newSocialUrl.startsWith('http://') && !newSocialUrl.startsWith('https://')) {
      toast.error('URL must start with http:// or https://')
      return
    }

    let updatedLinks: SocialLink[]

    // Cast socialLinks to ensure types
    const currentSocialLinks = socialLinks as SocialLink[]

    if (editingSocialLink) {
      updatedLinks = currentSocialLinks.map((link: SocialLink) =>
        link.id === editingSocialLink.id
          ? {
            ...link,
            platform: newSocialPlatform,
            url: newSocialUrl.trim(),
            label: newSocialLabel.trim() || undefined,
          }
          : link
      )
    } else {
      // Check if platform already exists
      if (currentSocialLinks.some((link: SocialLink) => link.platform === newSocialPlatform)) {
        toast.error(`${getSocialLabel(newSocialPlatform)} is already added`)
        return
      }

      updatedLinks = [
        ...currentSocialLinks,
        {
          id: crypto.randomUUID(),
          platform: newSocialPlatform,
          url: newSocialUrl.trim(),
          label: newSocialLabel.trim() || undefined,
        },
      ]
    }

    // Sort by fixed order
    const sorted = sortSocialLinks(updatedLinks)
    const success = await saveSocialLinks(sorted)
    if (success) {
      toast.success(editingSocialLink ? 'Social link updated' : 'Social link added')
      setSocialDialogOpen(false)
    }
  }

  const handleDeleteSocialLink = async (id: string) => {
    const currentSocialLinks = socialLinks as SocialLink[]
    const newLinks = currentSocialLinks.filter((l: SocialLink) => l.id !== id)
    await saveSocialLinks(newLinks)
  }

  // Helper funcs
  const openAddDialog = () => {
    setEditingLink(null)
    setFormTitle('')
    setFormUrl('')
    // New links go to "Uncategorized" (null category)
    setFormCategoryId('')
    setDialogOpen(true)
  }

  const openEditDialog = (link: LinkItem) => {
    setEditingLink(link)
    setFormTitle(link.title)
    setFormUrl(link.url)
    setFormCategoryId(link.categoryId || '')
    setDialogOpen(true)
  }

  // Category management functions
  const openAddCategoryDialog = () => {
    setEditingCategory(null)
    setCategoryFormName('')
    setCategoryFormDescription('')
    setCategoryDialogOpen(true)
  }

  const openEditCategoryDialog = (category: LinkCategory) => {
    setEditingCategory(category)
    setCategoryFormName(category.name)
    setCategoryFormDescription(category.description || '')
    setCategoryDialogOpen(true)
  }

  const validateUrl = (value: string) => {
    const url = value.trim()
    if (!url) return 'URL is required'
    if (!/^https?:\/\//i.test(url)) return 'URL must start with http:// or https://'
    return null
  }

  // Social Links handlers
  const openAddSocialDialog = () => {
    setEditingSocialLink(null)
    setNewSocialPlatform('website')
    setNewSocialUrl('')
    setNewSocialLabel('')
    setSocialDialogOpen(true)
  }

  const openEditSocialDialog = (link: SocialLink) => {
    setEditingSocialLink(link)
    setNewSocialPlatform(link.platform)
    setNewSocialUrl(link.url)
    setNewSocialLabel(link.label || '')
    setSocialDialogOpen(true)
  }

  return (
    <PageShell
      title="Links"
      subtitle="Control which links appear on your public profile."
    >
      <div className="space-y-4">
        {/* Add Link Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLink ? 'Edit link' : 'Add link'}</DialogTitle>
              <DialogDescription>
                Provide a title and URL for the link you want to surface on your profile.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="link-title">Title (optional)</Label>
                <Input
                  id="link-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Personal website"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  URL must start with <span className="font-mono">http://</span> or{' '}
                  <span className="font-mono">https://</span>.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-category">Category</Label>
                <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                  <SelectTrigger id="link-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .sort((a, b) => a.order - b.order)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                          {cat.isDefault && ' (Default)'}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleSubmit}>
                {editingLink ? 'Save changes' : 'Add link'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit category' : 'Add category'}</DialogTitle>
              <DialogDescription>
                Create a category to organize your links.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
                  value={categoryFormName}
                  onChange={(e) => setCategoryFormName(e.target.value)}
                  placeholder="e.g. Projects, Resources"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-description">Description (optional)</Label>
                <Input
                  id="category-description"
                  value={categoryFormDescription}
                  onChange={(e) => setCategoryFormDescription(e.target.value)}
                  placeholder="Short description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleCategorySubmit} disabled={categoriesSaving}>
                {editingCategory ? 'Save changes' : 'Add category'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Profile Links</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="h-8 gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={openAddDialog} className="font-medium">
                    <Link2 className="mr-2 h-4 w-4" />
                    Add link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openAddCategoryDialog} className="text-muted-foreground">
                    <Folder className="mr-2 h-4 w-4" />
                    Add category
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            {loading || categoriesLoading ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                Loading links...
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={customCollisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                {/* SortableContext for categories */}
                <SortableContext
                  items={sortedCategories.map(c => `cat-${c.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {/* SortableContext for all links */}
                  <SortableContext
                    items={links.map(l => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div ref={linksListRef} className="space-y-4">
                      {sortedCategories.map((category) => {
                        const categoryLinks = linksByCategory.get(category.id) || []
                        const isCollapsed = collapsedCategories.has(category.id)

                        return (
                          <CategoryBlock
                            key={category.id}
                            category={category}
                            categoryLinks={categoryLinks}
                            isCollapsed={isCollapsed}
                            onToggleCollapse={() => toggleCategoryCollapse(category.id)}
                            onToggleVisibility={() => handleToggleCategoryVisibility(category.id)}
                            onEdit={() => openEditCategoryDialog(category)}
                            onDelete={() => handleDeleteCategory(category.id)}
                            canDelete={!category.isDefault}
                            targetAddress={targetAddress}
                            highlightedLinkId={highlightedLinkId}
                            onToggleEnabled={handleToggleEnabled}
                            onEditLink={openEditDialog}
                            onDeleteLink={handleDelete}
                            activeDragType={activeDragType}
                            isLinkDragging={isLinkDragging}
                          />
                        )
                      })}

                      {/* Empty State shown when no links exist, preserving Category visibility */}
                      {links.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                          <div className="p-3 bg-muted rounded-full">
                            <Link2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium mb-1">Build your profile</h3>
                            <p className="text-xs text-muted-foreground mb-4">
                              Add your first link to start building your digital identity.
                            </p>
                          </div>
                          <Button onClick={openAddDialog} size="sm" variant="default">
                            <Plus className="mr-2 h-3.5 w-3.5" />
                            Add Link
                          </Button>
                        </div>
                      )}

                      {/* Uncategorized Links */}
                      {(() => {
                        const uncategorizedLinks = linksByCategory.get(null) || []
                        if (uncategorizedLinks.length === 0) return null

                        const isCollapsed = collapsedCategories.has('uncategorized')

                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-border/40 bg-muted/20">
                              <button
                                type="button"
                                onClick={() => toggleCategoryCollapse('uncategorized')}
                                className="flex items-center justify-center h-6 w-6 rounded hover:bg-muted/60 transition-colors"
                                aria-label={isCollapsed ? 'Expand uncategorized' : 'Collapse uncategorized'}
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">Uncategorized</p>
                                  <Badge variant="secondary" className="text-xs">
                                    {uncategorizedLinks.length}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {!isCollapsed && (
                              <div className="space-y-2 pl-4">
                                {uncategorizedLinks.map((link) => (
                                  <DraggableLinkRow
                                    key={link.id}
                                    link={link}
                                    targetAddress={targetAddress}
                                    highlighted={highlightedLinkId === link.id}
                                    onToggleEnabled={handleToggleEnabled}
                                    onEdit={openEditDialog}
                                    onDelete={handleDelete}
                                    isDragDisabled={isCategoryDragging}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </SortableContext>
                </SortableContext>

                {/* Drag Overlay - shows preview of dragged item */}
                <DragOverlay dropAnimation={null}>
                  {activeId && isCategoryDragging ? (
                    (() => {
                      const draggedCategory = sortedCategories.find(c => `cat-${c.id}` === activeId)
                      if (!draggedCategory) return null

                      const draggedCategoryLinks = linksByCategory.get(draggedCategory.id) || []
                      const MAX_PREVIEW = 2
                      const visibleLinks = draggedCategoryLinks.slice(0, MAX_PREVIEW)
                      const hiddenCount = Math.max(0, draggedCategoryLinks.length - MAX_PREVIEW)

                      return (
                        <div className="rounded-md border-2 border-primary bg-background shadow-xl w-80">
                          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border-b border-primary/20">
                            <GripVertical className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{draggedCategory.name}</span>
                            <Badge variant="secondary" className="text-xs ml-auto">{draggedCategoryLinks.length}</Badge>
                          </div>
                          {visibleLinks.length > 0 && (
                            <div className="p-2 space-y-1">
                              {visibleLinks.map((link) => (
                                <div key={link.id} className="flex items-center gap-2 px-2 py-1 rounded bg-muted/50 text-xs">
                                  <Link2 className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate">{link.title || link.url}</span>
                                </div>
                              ))}
                              {hiddenCount > 0 && (
                                <div className="text-xs text-muted-foreground text-center py-1">
                                  +{hiddenCount} daha fazla
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })()
                  ) : activeId && isLinkDragging ? (
                    (() => {
                      const link = links.find(l => l.id === activeId)
                      if (!link) return null
                      return (
                        <div className="rounded-md border-2 border-primary bg-background px-3 py-2 shadow-xl">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-primary" />
                            <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium truncate">{link.title || link.url}</span>
                          </div>
                        </div>
                      )
                    })()
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Social Links Card */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Social Links</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Add your social media profiles with icons
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={openAddSocialDialog}
                disabled={socialLinks.length >= 6}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {socialLinksLoading ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                Loading social links...
              </div>
            ) : socialLinks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <Globe className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium mb-1">No social links yet</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Add your X, GitHub, LinkedIn and other social profiles
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={openAddSocialDialog}
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Add social link
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {sortSocialLinks(socialLinks).map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-3 p-3 rounded-md border border-border/60 bg-muted/5 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50">
                      {getSocialIcon(link.platform)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{getSocialLabel(link.platform)}</div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary truncate block"
                      >
                        {link.url}
                      </a>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openEditSocialDialog(link)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSocialLink(link.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Link Dialog */}
        <Dialog open={socialDialogOpen} onOpenChange={setSocialDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSocialLink ? 'Edit social link' : 'Add social link'}</DialogTitle>
              <DialogDescription>
                Add a link to your social media profile
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="social-platform">Platform</Label>
                <Select
                  value={newSocialPlatform}
                  onValueChange={(value) => setNewSocialPlatform(value as SocialLinkPlatform)}
                  disabled={!!editingSocialLink}
                >
                  <SelectTrigger id="social-platform">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOCIAL_LINK_ORDER.map((platform) => {
                      const isAdded = !editingSocialLink && socialLinks.some(l => l.platform === platform)
                      return (
                        <SelectItem
                          key={platform}
                          value={platform}
                          disabled={isAdded}
                        >
                          <div className="flex items-center gap-2">
                            {getSocialIcon(platform)}
                            <span>{getSocialLabel(platform)}</span>
                            {isAdded && <span className="text-xs text-muted-foreground">(added)</span>}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="social-url">URL</Label>
                <Input
                  id="social-url"
                  value={newSocialUrl}
                  onChange={(e) => setNewSocialUrl(e.target.value)}
                  placeholder="https://twitter.com/username"
                />
                <p className="text-xs text-muted-foreground">
                  Full URL to your profile
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setSocialDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveSocialLink}
                disabled={socialLinksSaving}
              >
                {socialLinksSaving ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingSocialLink ? 'Save changes' : 'Add link'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </PageShell>
  )
}

