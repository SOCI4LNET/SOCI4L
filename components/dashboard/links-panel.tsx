'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useParams, useSearchParams } from 'next/navigation'

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
import { GripVertical, Link2, Plus, Pencil, Trash2, ExternalLink, BarChart2, Github, Linkedin, Globe, Youtube, Eye, EyeOff, ArrowUp, ArrowDown, Folder, ChevronDown, ChevronRight, MoreVertical, Loader2, Instagram, CheckCircle } from 'lucide-react'
import { XIcon } from '@/components/icons/x-icon'
import { useRouter } from 'next/navigation'
import { useSignMessage } from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { PageShell } from '@/components/app-shell/page-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Toggle } from '@/components/ui/toggle'
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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useTransaction } from '@/components/providers/transaction-provider'

type LinkItem = {
  id: string
  title: string
  url: string
  enabled: boolean
  categoryId?: string | null
  order?: number
  createdAt: string
  updatedAt: string
}

type LinkCategory = {
  id: string
  name: string
  slug: string
  description?: string | null
  order: number
  isVisible: boolean
  isDefault: boolean
  linkCount?: number
  createdAt: string
  updatedAt: string
}

type SocialLinkPlatform = 'website' | 'x' | 'instagram' | 'github' | 'youtube' | 'linkedin' | 'twitter'

interface SocialLink {
  id: string
  platform: SocialLinkPlatform
  url: string
  label?: string
  verified?: boolean
  enabled?: boolean
}

type StoredLinksState = {
  version: number
  updatedAt: string
  links: LinkItem[]
}

const PRIMARY_STORAGE_KEY = 'soci4l.links.v1'
const LEGACY_STORAGE_KEY = 'soci4l.profileLinks.v1'


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
        } ${!link.enabled ? 'opacity-60' : ''} ${isDragging ? 'ring-1 ring-primary/40 shadow-xl dark:shadow-2xl bg-background' : ''}`}
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
              rel="noopener"
              className="truncate hover:text-primary transition-colors"
              title={link.url}
            >
              {link.url}
            </a>
            <a
              href={link.url}
              target="_blank"
              rel="noopener"
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


export function LinksPanel() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, linkTwitter, unlinkTwitter, ready: privyReady, authenticated, login } = usePrivy()
  const { address: connectedAddress } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { showTransactionLoader, hideTransactionLoader } = useTransaction()
  const linksListRef = useRef<HTMLDivElement>(null)

  // State for triggering Twitter link after Privy authentication
  const [pendingTwitterLink, setPendingTwitterLink] = useState(false)

  // Auto-link Twitter after Privy authentication
  useEffect(() => {
    if (authenticated && pendingTwitterLink && privyReady) {
      setPendingTwitterLink(false)
      linkTwitter()
    }
  }, [authenticated, pendingTwitterLink, privyReady, linkTwitter])



  const [links, setLinks] = useState<LinkItem[]>([])
  const [categories, setCategories] = useState<LinkCategory[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formCategoryId, setFormCategoryId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categoriesSaving, setCategoriesSaving] = useState(false)
  const [highlightedLinkId, setHighlightedLinkId] = useState<string | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)

  // Category management state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<LinkCategory | null>(null)
  const [categoryFormName, setCategoryFormName] = useState('')
  const [categoryFormDescription, setCategoryFormDescription] = useState('')

  // Social Links state
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [socialLinksLoading, setSocialLinksLoading] = useState(true)

  // Sync with backend when Twitter account is detected
  useEffect(() => {
    const twitterAccount = user?.twitter
    if (twitterAccount) {
      const syncSocial = async () => {
        // Validation: Ensure the authenticated Privy user matches the current target profile
        // This prevents "bleeding" of social links when switching wallets but not full sessions
        const privyWallet = user?.wallet?.address?.toLowerCase()
        const currentTarget = targetAddress?.toLowerCase()

        if (!privyWallet || !currentTarget || privyWallet !== currentTarget) {
          console.warn('[LinksPanel] Skipping social sync: Wallet mismatch', { privy: privyWallet, target: currentTarget })
          return
        }

        // Check if we are already verified in the backend
        const twitterLink = socialLinks.find(l => l.platform === 'x' || l.platform === 'twitter')
        const isBackendVerified = twitterLink?.verified === true

        // Force sync if we have Twitter but backend says not verified
        const forceSync = twitterLink && !isBackendVerified

        // Prevent double sync if already verified recently, UNLESS we need to force sync
        const lastSync = localStorage.getItem(`soci4l_twitter_sync_${twitterAccount.username}`)
        const now = Date.now()

        // Don't re-sync if synced in last 1 minute, unless forcing
        if (!forceSync && lastSync && now - parseInt(lastSync) < 60000) return

        try {
          const response = await fetch('/api/social/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: 'twitter',
              platformUsername: twitterAccount.username,
              platformUserId: twitterAccount.subject,
              address: currentTarget, // Explicitly pass address for safety
            }),
          })

          if (response.ok) {
            if (forceSync) {
              console.log('[LinksPanel] Forced social sync completed')
            } else {
              toast.success(`Connected as @${twitterAccount.username}`)
            }
            localStorage.setItem(`soci4l_twitter_sync_${twitterAccount.username}`, now.toString())
          }
        } catch (error) {
          console.error('Sync error:', error)
        }
      }

      // Delay slightly to ensure socialLinks are loaded
      if (!socialLinksLoading) {
        syncSocial()
      }
    }
  }, [user?.twitter, socialLinks, socialLinksLoading])
  const [socialLinksSaving, setSocialLinksSaving] = useState(false)
  const [socialDialogOpen, setSocialDialogOpen] = useState(false)
  const [editingSocialLink, setEditingSocialLink] = useState<SocialLink | null>(null)
  const [newSocialPlatform, setNewSocialPlatform] = useState<SocialLinkPlatform>('website')
  const [newSocialUrl, setNewSocialUrl] = useState('')
  const [newSocialLabel, setNewSocialLabel] = useState('')

  // Get target address from route params or connected wallet
  const targetAddress = (params.address as string)?.toLowerCase() || connectedAddress?.toLowerCase() || ''

  // Helper functions for social links
  const getSocialIcon = (platform: SocialLinkPlatform) => {
    switch (platform) {
      case 'x':
      case 'twitter':
        return <XIcon className="h-4 w-4" />
      case 'github':
        return <Github className="h-4 w-4" />
      case 'youtube':
        return <Youtube className="h-4 w-4" />
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />
      case 'instagram':
        return <Instagram className="h-4 w-4" />
      case 'website':
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const getSocialLabel = (platform: SocialLinkPlatform) => {
    switch (platform) {
      case 'x':
      case 'twitter':
        return 'X'
      case 'github':
        return 'GitHub'
      case 'youtube':
        return 'YouTube'
      case 'linkedin':
        return 'LinkedIn'
      case 'instagram':
        return 'Instagram'
      case 'website':
      default:
        return 'Website'
    }
  }

  // Fixed order for social links
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

  // Handle query params for deep linking from Insights
  useEffect(() => {
    const linkId = searchParams.get('link')
    const categoryId = searchParams.get('category')

    if (linkId && linksListRef.current) {
      setHighlightedLinkId(linkId)
      // Scroll to links list
      setTimeout(() => {
        linksListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedLinkId(null), 3000)
    }

    if (categoryId) {
      // Category highlighting can be added later if needed
      // For now, just scroll to links list
      setTimeout(() => {
        linksListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [searchParams, links])

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

  // Load categories from API
  useEffect(() => {
    if (!targetAddress) {
      setCategoriesLoading(false)
      return
    }

    const loadCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await fetch(`/api/profile/categories?address=${encodeURIComponent(targetAddress)}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to load categories`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        const loadedCategories = (data.categories || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description || null,
          order: cat.order || 0,
          isVisible: cat.isVisible ?? true,
          isDefault: cat.isDefault ?? false,
          linkCount: cat.linkCount || 0,
          createdAt: cat.createdAt || new Date().toISOString(),
          updatedAt: cat.updatedAt || new Date().toISOString(),
        }))

        setCategories(loadedCategories)

        // If no categories exist, create default "General" category
        if (loadedCategories.length === 0) {
          await saveCategories([{
            name: 'General',
            slug: 'general',
            description: null,
            order: 0,
            isVisible: true,
            isDefault: true,
          }])
        }
      } catch (error) {
        console.error('[LinksPanel] Failed to load categories from API', error)
        // Don't show error toast for empty categories
        setCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }

    loadCategories()
  }, [targetAddress])

  // Load links from API
  useEffect(() => {
    if (!targetAddress) {
      setLoading(false)
      return
    }

    const loadLinks = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/profile/links?address=${encodeURIComponent(targetAddress)}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to load links`)
        }

        const data = await response.json()

        // Check if response has an error field
        if (data.error) {
          throw new Error(data.error)
        }

        setLinks(
          (data.links || []).map((link: any) => ({
            id: link.id,
            title: link.title || '',
            url: link.url,
            enabled: link.enabled,
            categoryId: link.categoryId || null,
            order: link.order || 0,
            createdAt: link.createdAt || new Date().toISOString(),
            updatedAt: link.updatedAt || new Date().toISOString(),
          }))
        )
      } catch (error) {
        console.error('[LinksPanel] Failed to load links from API', error)
        toast.error('Failed to load links. Please refresh the page.')
        // Set empty links array on error to prevent UI blocking
        setLinks([])
      } finally {
        setLoading(false)
      }
    }

    loadLinks()
  }, [targetAddress])

  // Load social links from API
  useEffect(() => {
    if (!targetAddress) {
      setSocialLinksLoading(false)
      return
    }

    const loadSocialLinks = async () => {
      try {
        setSocialLinksLoading(true)
        const cacheBust = `${Date.now()}-${Math.random().toString(36).substring(7)}`
        const response = await fetch(`/api/wallet?address=${encodeURIComponent(targetAddress)}&_t=${cacheBust}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to load profile')
        }

        const data = await response.json()
        const links = data.profile?.socialLinks || []
        setSocialLinks(links.map((link: any) => ({
          // Use deterministic ID if missing to match public profile behavior
          id: link.id || `social-${link.url}`,
          platform: (link.platform || link.type || 'website') as SocialLinkPlatform,
          url: link.url || '',
          label: link.label || '',
          verified: link.verified,
          enabled: link.enabled !== false,
        })))
      } catch (error) {
        console.error('[LinksPanel] Failed to load social links', error)
        // Ensure even empty/failed state doesn't break ID expectations if defaults used
        setSocialLinks([])
      } finally {
        setSocialLinksLoading(false)
      }
    }

    loadSocialLinks()
  }, [targetAddress])

  // Save social links
  const saveSocialLinks = async (linksToSave: SocialLink[]) => {
    if (!targetAddress) {
      toast.error('Wallet connection not found')
      return false
    }

    try {
      setSocialLinksSaving(true)

      // Step 1: Get nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce')
      }
      const { nonce } = await nonceResponse.json()

      // Step 2: Sign message (must match API's expected format)
      showTransactionLoader("Confirm in Wallet...")
      const message = `Update social profile for ${targetAddress}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      showTransactionLoader("Saving social links...")

      // Step 3: Update profile
      const response = await fetch('/api/profile/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: targetAddress,
          socialLinks: linksToSave.map(l => ({
            ...l,
            id: l.id && !l.id.startsWith('social-') ? l.id : `social-${l.url}`
          })),
          signature,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to save social links`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const savedLinks = data.profile?.socialLinks || []
      setSocialLinks(savedLinks.map((link: any) => ({
        id: link.id || `social-${link.url}`,
        platform: (link.platform || link.type || 'website') as SocialLinkPlatform,
        url: link.url || '',
        label: link.label || '',
        verified: link.verified,
        enabled: link.enabled !== false,
      })))
      return true
    } catch (error: any) {
      console.error('[LinksPanel] Failed to save social links', error)
      if (error?.message?.includes('User rejected') || error?.name === 'UserRejectedRequestError') {
        toast.error('Transaction rejected')
      } else {
        toast.error('Failed to save social links. Please try again.')
      }
      return false
    } finally {
      setSocialLinksSaving(false)
      hideTransactionLoader()
    }
  }

  const handleToggleSocialEnabled = async (id: string, enabled: boolean) => {
    const updated = socialLinks.map((link) =>
      link.id === id ? { ...link, enabled } : link
    )
    setSocialLinks(updated)
    await saveSocialLinks(updated)
  }

  const saveCategories = async (categoriesToSave: (Omit<LinkCategory, 'id' | 'createdAt' | 'updatedAt' | 'linkCount'> & { id?: string })[]) => {
    if (!targetAddress) {
      toast.error('Wallet connection not found')
      return false
    }

    try {
      setCategoriesSaving(true)

      // Get nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) throw new Error('Failed to get nonce')
      const { nonce } = await nonceResponse.json()

      // Sign message
      showTransactionLoader("Confirm in Wallet...")
      const message = `Update categories for ${targetAddress.toLowerCase()}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      showTransactionLoader("Saving categories...")

      const response = await fetch('/api/profile/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: targetAddress,
          categories: categoriesToSave.map((cat: Omit<LinkCategory, 'id' | 'createdAt' | 'updatedAt' | 'linkCount'> & { id?: string }, index) => ({
            id: cat.id || undefined,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || null,
            order: cat.order !== undefined ? cat.order : index,
            isVisible: cat.isVisible !== undefined ? cat.isVisible : true,
            isDefault: cat.isDefault || false,
          })),
          signature, // Included for future backend verification
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to save categories`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setCategories(
        (data.categories || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description || null,
          order: cat.order ?? 0,
          isVisible: cat.isVisible ?? true,
          isDefault: cat.isDefault ?? false,
          linkCount: cat._count?.links || cat.linkCount || 0,
          createdAt: cat.createdAt || new Date().toISOString(),
          updatedAt: cat.updatedAt || new Date().toISOString(),
        }))
      )
      return true
    } catch (error: any) {
      console.error('[LinksPanel] Failed to save categories', error)
      if (error?.message?.includes('User rejected') || error?.name === 'UserRejectedRequestError') {
        toast.error('Transaction rejected')
      } else {
        toast.error('Failed to save categories. Please try again.')
      }
      return false
    } finally {
      setCategoriesSaving(false)
      hideTransactionLoader()
    }
  }

  const saveLinks = async (linksToSave: LinkItem[]) => {
    if (!targetAddress) {
      toast.error('Wallet connection not found')
      return false
    }

    try {
      setSaving(true)

      // Get nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) throw new Error('Failed to get nonce')
      const { nonce } = await nonceResponse.json()

      // Sign message - MUST MATCH BACKEND EXPECTATION
      showTransactionLoader("Confirm in Wallet...")
      const message = `Update links for ${targetAddress.toLowerCase()}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      showTransactionLoader("Saving links...")

      const response = await fetch('/api/profile/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: targetAddress,
          links: linksToSave.map((link, index) => ({
            id: link.id,
            title: link.title,
            url: link.url,
            enabled: link.enabled,
            categoryId: link.categoryId || null,
            order: link.order !== undefined ? link.order : index,
          })),
          signature,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to save links`)
      }

      const data = await response.json()

      // Check if response has an error field
      if (data.error) {
        throw new Error(data.error)
      }

      setLinks(
        (data.links || []).map((link: any) => ({
          id: link.id,
          title: link.title || '',
          url: link.url,
          enabled: link.enabled ?? true,
          categoryId: link.categoryId || null,
          order: link.order ?? 0,
          createdAt: link.createdAt || new Date().toISOString(),
          updatedAt: link.updatedAt || new Date().toISOString(),
        }))
      )
      return true
    } catch (error: any) {
      console.error('[LinksPanel] Failed to save links', error)
      if (error?.message?.includes('Profile not claimed yet')) {
        toast.error('Failed to save: You must claim your profile first.')
      } else if (error?.message?.includes('User rejected') || error?.name === 'UserRejectedRequestError') {
        toast.error('Transaction rejected')
      } else {
        toast.error('Failed to save links. Please try again.')
      }
      return false
    } finally {
      setSaving(false)
      hideTransactionLoader()
    }
  }

  const updateLinks = async (updater: (prev: LinkItem[]) => LinkItem[]) => {
    const next = updater(links)
    setLinks(next)
    await saveLinks(next)
  }

  // Group links by category - memoized to prevent recalculation issues
  const linksByCategory = useMemo(() => {
    const grouped = new Map<string | null, LinkItem[]>()

    // Initialize with all categories
    categories.forEach(cat => {
      grouped.set(cat.id, [])
    })

    // Add uncategorized bucket
    grouped.set(null, [])

    // Group links
    links.forEach(link => {
      const categoryId = link.categoryId || null
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, [])
      }
      grouped.get(categoryId)!.push(link)
    })

    // Sort links within each category by order
    grouped.forEach((linkList, categoryId) => {
      linkList.sort((a, b) => (a.order || 0) - (b.order || 0))
    })

    return grouped
  }, [categories, links])

  // Get sorted categories (by order only - all categories can be sorted) - memoized
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      return (a.order || 0) - (b.order || 0)
    })
  }, [categories])

  // Get link count for a category
  const getCategoryLinkCount = (categoryId: string | null) => {
    return linksByCategory.get(categoryId)?.length || 0
  }

  const toggleCategoryCollapse = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // =============================================================================
  // DRAG & DROP STATE AND HANDLERS
  // =============================================================================

  // Determine what type of item is being dragged
  const getActiveDragType = (): 'category' | 'link' | null => {
    if (!activeId) return null
    if (typeof activeId === 'string' && activeId.startsWith('cat-')) return 'category'
    // If it's a link ID (not starting with special prefix)
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

      const activeIndex = sortedCategories.findIndex(cat => cat.id === activeCategoryId)
      const overIndex = sortedCategories.findIndex(cat => cat.id === overCategoryId)

      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return

      // Reorder categories
      const reordered = arrayMove(sortedCategories, activeIndex, overIndex)
      const withOrder = reordered.map((cat, idx) => ({
        ...cat,
        order: idx,
      }))

      // Save previous state for rollback
      const previousCategories = [...categories]

      // Optimistic update
      setCategories(withOrder)

      // Persist to server
      const success = await saveCategories(withOrder.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        order: cat.order,
        isVisible: cat.isVisible,
        isDefault: cat.isDefault,
      })))

      if (!success) {
        setCategories(previousCategories)
        toast.error('Failed to reorder categories')
      }
      return
    }

    // =======================================================================
    // LINK OPERATIONS
    // =======================================================================
    const activeLink = links.find(l => l.id === activeIdStr)
    if (!activeLink) return

    // Case 1: Dropping on a category drop zone (empty area in category)
    if (overIdStr.startsWith('drop-')) {
      const targetCategoryId = overIdStr.replace('drop-', '')

      // Move link to new category
      const targetCategoryLinks = linksByCategory.get(targetCategoryId) || []
      const newOrder = targetCategoryLinks.length

      const previousLinks = [...links]
      const updated = links.map(l =>
        l.id === activeIdStr
          ? { ...l, categoryId: targetCategoryId, order: newOrder }
          : l
      )
      setLinks(updated)

      const success = await saveLinks(updated)
      if (!success) {
        setLinks(previousLinks)
        toast.error('Failed to move link')
      }
      return
    }

    // Case 2: Dropping on another link
    const overLink = links.find(l => l.id === overIdStr)
    if (!overLink) return

    const targetCategoryId = overLink.categoryId || null
    const targetCategoryLinks = linksByCategory.get(targetCategoryId) || []
    const overIndex = targetCategoryLinks.findIndex(l => l.id === overIdStr)

    if (overIndex === -1) return

    // Moving to different category
    if (activeLink.categoryId !== targetCategoryId) {
      const oldCategoryLinks = linksByCategory.get(activeLink.categoryId || null) || []

      // Remove from old category
      const updatedOldLinks = oldCategoryLinks
        .filter(l => l.id !== activeIdStr)
        .map((link, idx) => ({ ...link, order: idx }))

      // Add to new category at target position
      const newCategoryLinks = [...targetCategoryLinks]
      newCategoryLinks.splice(overIndex, 0, { ...activeLink, categoryId: targetCategoryId })
      const updatedNewLinks = newCategoryLinks.map((link, idx) => ({
        ...link,
        categoryId: targetCategoryId,
        order: idx,
      }))

      const previousLinks = [...links]
      const updated = links.map(l => {
        const inOld = updatedOldLinks.find(wl => wl.id === l.id)
        const inNew = updatedNewLinks.find(wl => wl.id === l.id)
        return inNew || inOld || l
      })

      setLinks(updated)

      const success = await saveLinks(updated)
      if (!success) {
        setLinks(previousLinks)
        toast.error('Failed to move link')
      }
    } else {
      // Reordering within same category
      const activeIndex = targetCategoryLinks.findIndex(l => l.id === activeIdStr)
      if (activeIndex === -1 || activeIndex === overIndex) return

      const previousLinks = [...links]
      const reordered = arrayMove(targetCategoryLinks, activeIndex, overIndex)
      const withOrder = reordered.map((link, index) => ({
        ...link,
        order: index,
      }))

      // Update all links, preserving other categories
      const updated = links.map(l => {
        const found = withOrder.find(wl => wl.id === l.id)
        return found || l
      })

      setLinks(updated)

      // Persist to server
      const success = await saveLinks(updated)

      // Rollback on failure
      if (!success) {
        setLinks(previousLinks)
        toast.error('Failed to reorder links')
      }
    }
  }

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

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    const previousLinks = [...links]
    const updated = links.map((link) =>
      link.id === id
        ? {
          ...link,
          enabled,
          updatedAt: new Date().toISOString(),
        }
        : link
    )
    setLinks(updated)
    const success = await saveLinks(updated)
    if (!success) {
      setLinks(previousLinks)
    }
  }

  const handleDelete = async (id: string) => {
    const previousLinks = [...links]
    const updated = links.filter((link) => link.id !== id)
    setLinks(updated)
    const success = await saveLinks(updated)
    if (success) {
      toast.success('Link deleted')
    } else {
      setLinks(previousLinks)
    }
  }

  const validateUrl = (value: string) => {
    const url = value.trim()
    if (!url) return 'URL is required'
    if (!/^https?:\/\//i.test(url)) return 'URL must start with http:// or https://'
    return null
  }

  const handleSubmit = async () => {
    const trimmedTitle = formTitle.trim()
    const trimmedUrl = formUrl.trim()
    const urlError = validateUrl(trimmedUrl)
    if (urlError) {
      toast.error('Please enter a valid URL (must start with http:// or https://)')
      return
    }

    // New links go to "Uncategorized" (null) if no category selected
    const categoryId = formCategoryId || null

    const now = new Date().toISOString()

    const previousLinks = [...links]

    if (editingLink) {
      const updated = links.map((link) =>
        link.id === editingLink.id
          ? {
            ...link,
            title: trimmedTitle,
            url: trimmedUrl,
            categoryId,
            updatedAt: now,
          }
          : link
      )
      setLinks(updated)
      const success = await saveLinks(updated)
      if (success) {
        toast.success('Link updated')
        setDialogOpen(false)
      } else {
        setLinks(previousLinks)
      }
    } else {
      const newItem: LinkItem = {
        id: crypto.randomUUID(),
        title: trimmedTitle,
        url: trimmedUrl,
        enabled: true,
        categoryId,
        order: links.length,
        createdAt: now,
        updatedAt: now,
      }
      const updated = [...links, newItem]
      setLinks(updated)
      const success = await saveLinks(updated)
      if (success) {
        toast.success('Link added')
        setDialogOpen(false)
      } else {
        setLinks(previousLinks)
      }
    }
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

    if (editingCategory) {
      const updated = categories.map((cat) =>
        cat.id === editingCategory.id
          ? {
            ...cat,
            name: trimmedName,
            slug,
            description: categoryFormDescription.trim() || null,
          }
          : cat
      )
      const success = await saveCategories(updated)
      if (success) {
        toast.success('Category updated')
        setCategoryDialogOpen(false)
      }
    } else {
      const newCategory: Omit<LinkCategory, 'id' | 'createdAt' | 'updatedAt' | 'linkCount'> = {
        name: trimmedName,
        slug,
        description: categoryFormDescription.trim() || null,
        order: categories.length,
        isVisible: true,
        isDefault: false,
      }
      const updated = [...categories, newCategory as LinkCategory]
      const success = await saveCategories(updated.map(cat => ({
        ...(cat.id ? { id: cat.id } : {}),
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        order: cat.order,
        isVisible: cat.isVisible,
        isDefault: cat.isDefault,
      })))
      if (success) {
        toast.success('Category added')
        setCategoryDialogOpen(false)
      }
    }
  }

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find(cat => cat.id === id)
    if (category?.isDefault) {
      toast.error('Default category cannot be deleted')
      return
    }

    // Move links from deleted category to default category
    const defaultCategory = categories.find(cat => cat.isDefault)
    if (defaultCategory) {
      const updatedLinks = links.map(link =>
        link.categoryId === id
          ? { ...link, categoryId: defaultCategory.id }
          : link
      )
      await saveLinks(updatedLinks)
    }

    const updated = categories.filter(cat => cat.id !== id)
    const success = await saveCategories(updated.map(cat => ({
      ...(cat.id ? { id: cat.id } : {}),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      order: cat.order,
      isVisible: cat.isVisible,
      isDefault: cat.isDefault,
    })))
    if (success) {
      toast.success('Category deleted')
    }
  }

  const handleToggleCategoryVisibility = async (id: string) => {
    const updated = categories.map((cat) =>
      cat.id === id
        ? { ...cat, isVisible: !cat.isVisible }
        : cat
    )
    await saveCategories(updated.map(cat => ({
      ...(cat.id ? { id: cat.id } : {}),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      order: cat.order,
      isVisible: cat.isVisible,
      isDefault: cat.isDefault,
    })))
  }

  const handleMoveCategory = async (id: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(cat => cat.id === id)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= categories.length) return

    const reordered = arrayMove(categories, index, newIndex)
    const withOrder = reordered.map((cat, idx) => ({
      ...cat,
      order: idx,
    }))
    await saveCategories(withOrder.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      order: cat.order,
      isVisible: cat.isVisible,
      isDefault: cat.isDefault,
    })))
  }

  const enabledLinks = links.filter((link) => link.enabled)

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

    if (editingSocialLink) {
      updatedLinks = socialLinks.map(link =>
        link.id === editingSocialLink.id
          ? { ...link, platform: newSocialPlatform, url: newSocialUrl.trim(), label: newSocialLabel.trim() || undefined }
          : link
      )
    } else {
      // Check if platform already exists
      if (socialLinks.some(link => link.platform === newSocialPlatform)) {
        toast.error(`${getSocialLabel(newSocialPlatform)} is already added`)
        return
      }

      updatedLinks = [
        ...socialLinks,
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
    setSocialLinks(sorted)
    const success = await saveSocialLinks(sorted)
    if (success) {
      toast.success(editingSocialLink ? 'Social link updated' : 'Social link added')
      setSocialDialogOpen(false)
    }
  }

  const handleDeleteSocialLink = async (id: string) => {
    const updated = socialLinks.filter(link => link.id !== id)
    setSocialLinks(updated)
    const success = await saveSocialLinks(updated)
    if (success) {
      toast.success('Social link deleted')
    }
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
                    className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${link.enabled !== false
                      ? 'border-border/60 bg-muted/5 hover:bg-muted/20'
                      : 'border-border/40 bg-muted/5 opacity-60'
                      }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 shrink-0">
                        {getSocialIcon(link.platform)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{getSocialLabel(link.platform)}</div>
                          {!link.enabled && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground border-border/40">
                              Off
                            </Badge>
                          )}
                          {link.platform === 'x' && (
                            (() => {
                              const twitterUser = user?.twitter
                              const getUsernameFromUrl = (url: string) => {
                                try {
                                  const urlToParse = url.startsWith('http') ? url : `https://${url}`
                                  const urlObj = new URL(urlToParse)
                                  const segments = urlObj.pathname.split('/').filter(Boolean)
                                  return segments[segments.length - 1]?.toLowerCase() || ''
                                } catch {
                                  return url.split('/').filter(Boolean).pop()?.split('?')[0]?.toLowerCase() || ''
                                }
                              }

                              const linkUsername = getUsernameFromUrl(link.url)
                              const privyUsername = twitterUser?.username?.toLowerCase()
                              const isVerified = link.verified

                              if (isVerified) {
                                return (
                                  <Badge variant="outline" className="h-5 px-1.5 gap-1 text-[10px] font-normal text-green-600 border-green-600/30 bg-green-500/5">
                                    <CheckCircle className="h-3 w-3" />
                                    Verified
                                  </Badge>
                                )
                              }

                              if (!twitterUser) {
                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-5 px-2 text-[10px]"
                                    onClick={async () => {
                                      if (!privyReady) {
                                        toast.error('Twitter verification is currently unavailable. Please try again later.')
                                        return
                                      }

                                      // If not authenticated, show Twitter-only login
                                      if (!authenticated) {
                                        setPendingTwitterLink(true)
                                        await login({ loginMethods: ['twitter'] })
                                        return
                                      }

                                      // Already authenticated, link Twitter
                                      linkTwitter()
                                    }}
                                    disabled={!privyReady}
                                  >
                                    Verify
                                  </Button>
                                )
                              }

                              return (
                                <div className="flex flex-col gap-1 items-start">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-5 px-2 text-[10px]"
                                    onClick={async () => {
                                      try {
                                        const toastId = toast.loading('Verifying...')
                                        const response = await fetch('/api/social/link', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            platform: 'twitter',
                                            platformUsername: twitterUser.username,
                                            platformUserId: twitterUser.subject,
                                            walletAddress: targetAddress,
                                          }),
                                        })

                                        if (response.ok) {
                                          toast.success('Verified!', { id: toastId })
                                          window.location.reload()
                                        } else {
                                          const data = await response.json()
                                          toast.error(data.error || 'Verification failed', { id: toastId })
                                        }
                                      } catch (e) {
                                        toast.error('Failed to connect')
                                      }
                                    }}
                                  >
                                    Verify
                                  </Button>
                                  <button
                                    className="text-[10px] text-muted-foreground hover:text-red-500 underline"
                                    onClick={async () => {
                                      try {
                                        await unlinkTwitter(twitterUser.subject)
                                        toast.success('Twitter disconnected. Link a new account.')
                                        // No reload needed, usePrivy updates automatically
                                      } catch (e) {
                                        toast.error('Failed to disconnect')
                                      }
                                    }}
                                  >
                                    Wrong account? Change
                                  </button>
                                </div>
                              )
                            })()
                          )}
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener"
                          className="text-xs text-muted-foreground hover:text-primary truncate block"
                        >
                          {link.url}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Toggle
                        aria-label={`Toggle ${getSocialLabel(link.platform)}`}
                        size="sm"
                        variant="outline"
                        pressed={link.enabled !== false}
                        onPressedChange={(pressed) => handleToggleSocialEnabled(link.id, pressed)}
                        className="h-8 px-2"
                      >
                        {link.enabled !== false ? 'On' : 'Off'}
                      </Toggle>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          // ID is now guaranteed to be consistent
                          router.push(`/dashboard/${targetAddress}/links/${link.id}`)
                        }}
                        aria-label="View link details"
                      >
                        <BarChart2 className="h-3.5 w-3.5" />
                      </Button>

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

