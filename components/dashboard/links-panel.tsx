'use client'

import { useEffect, useState, useRef } from 'react'
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
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Link2, Plus, Pencil, Trash2, ExternalLink, BarChart2, Twitter, Github, Linkedin, Globe, Youtube, Eye, EyeOff, ArrowUp, ArrowDown, Folder, ChevronDown, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSignMessage } from 'wagmi'
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
import { toast } from 'sonner'

type LinkItem = {
  id: string
  title: string
  url: string
  enabled: boolean
  categoryId?: string | null
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

type SocialLinkPlatform = 'website' | 'x' | 'instagram' | 'github' | 'youtube' | 'linkedin'

interface SocialLink {
  id: string
  platform: SocialLinkPlatform
  url: string
  label?: string
}

type StoredLinksState = {
  version: number
  updatedAt: string
  links: LinkItem[]
}

const PRIMARY_STORAGE_KEY = 'soci4l.links.v1'
const LEGACY_STORAGE_KEY = 'soci4l.profileLinks.v1'

type SortableLinkRowProps = {
  link: LinkItem
  targetAddress: string
  highlighted?: boolean
  onToggleEnabled: (id: string, enabled: boolean) => void
  onEdit: (link: LinkItem) => void
  onDelete: (id: string) => void
}

// Category Drop Zone Component
function CategoryDropZone({ categoryId, children }: { categoryId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `category-${categoryId}`,
  })

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${isOver ? 'bg-primary/5 border-primary/20 border-2 border-dashed rounded-md' : ''}`}
    >
      {children}
    </div>
  )
}

function SortableLinkRow({ link, targetAddress, highlighted, onToggleEnabled, onEdit, onDelete }: SortableLinkRowProps) {
  const router = useRouter()
  
  const handleViewDetails = () => {
    router.push(`/dashboard/${targetAddress}/links/${link.id}`)
  }
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleToggle = (pressed: boolean) => {
    onToggleEnabled(link.id, pressed)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border px-3 py-3 shadow-sm transition 
      ${highlighted ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border/60 bg-background/60'} 
      ${!link.enabled ? 'opacity-60' : ''} 
      ${isDragging ? 'ring-1 ring-primary/40 shadow-lg bg-background' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className={`flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing ${
            isDragging ? 'text-foreground bg-muted/60' : ''
          }`}
          aria-label={`${link.title || link.url} drag handle`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-sm font-medium leading-none truncate">
              {link.title || link.url}
            </p>
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
            onPressedChange={handleToggle}
          >
            {link.enabled ? 'On' : 'Off'}
          </Toggle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleViewDetails}
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
                  This will remove the link from your profile builder. You can add it again later if
                  needed.
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

export function LinksPanel() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { address: connectedAddress } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const linksListRef = useRef<HTMLDivElement>(null)
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
  
  // Category management state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<LinkCategory | null>(null)
  const [categoryFormName, setCategoryFormName] = useState('')
  const [categoryFormDescription, setCategoryFormDescription] = useState('')
  
  // Social Links state
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [socialLinksLoading, setSocialLinksLoading] = useState(true)
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
        return <Twitter className="h-4 w-4" />
      case 'github':
        return <Github className="h-4 w-4" />
      case 'youtube':
        return <Youtube className="h-4 w-4" />
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />
      case 'instagram':
        return <Globe className="h-4 w-4" />
      case 'website':
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const getSocialLabel = (platform: SocialLinkPlatform) => {
    switch (platform) {
      case 'x':
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
          const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }))
          throw new Error(errorData.error || `HTTP ${response.status}: Kategoriler yüklenemedi`)
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
          const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }))
          throw new Error(errorData.error || `HTTP ${response.status}: Linkler yüklenemedi`)
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
        const errorMessage = error instanceof Error ? error.message : 'Linkler yüklenirken bir hata oluştu'
        toast.error(errorMessage)
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
        const response = await fetch(`/api/wallet?address=${encodeURIComponent(targetAddress)}`)
        
        if (!response.ok) {
          throw new Error('Failed to load profile')
        }
        
        const data = await response.json()
        const links = data.profile?.socialLinks || []
        setSocialLinks(links.map((link: any) => ({
          id: link.id || crypto.randomUUID(),
          platform: (link.platform || link.type || 'website') as SocialLinkPlatform,
          url: link.url || '',
          label: link.label || '',
        })))
      } catch (error) {
        console.error('[LinksPanel] Failed to load social links', error)
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
      toast.error('Cüzdan adresi bulunamadı')
      return false
    }

    try {
      setSocialLinksSaving(true)
      
      // Step 1: Get nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) {
        throw new Error('Nonce alınamadı')
      }
      const { nonce } = await nonceResponse.json()

      // Step 2: Sign message
      const message = `Update profile for ${targetAddress}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      // Step 3: Update profile
      const response = await fetch('/api/profile/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: targetAddress,
          socialLinks: linksToSave.length > 0 ? linksToSave : null,
          signature,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }))
        throw new Error(errorData.error || `HTTP ${response.status}: Sosyal linkler kaydedilemedi`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      const savedLinks = data.profile?.socialLinks || []
      setSocialLinks(savedLinks.map((link: any) => ({
        id: link.id || crypto.randomUUID(),
        platform: (link.platform || link.type || 'website') as SocialLinkPlatform,
        url: link.url || '',
        label: link.label || '',
      })))
      return true
    } catch (error) {
      console.error('[LinksPanel] Failed to save social links', error)
      toast.error(error instanceof Error ? error.message : 'Sosyal linkler kaydedilirken bir hata oluştu')
      return false
    } finally {
      setSocialLinksSaving(false)
    }
  }

  const saveCategories = async (categoriesToSave: Omit<LinkCategory, 'id' | 'createdAt' | 'updatedAt' | 'linkCount'>[]) => {
    if (!targetAddress) {
      toast.error('Cüzdan adresi bulunamadı')
      return false
    }

    try {
      setCategoriesSaving(true)
      const response = await fetch('/api/profile/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: targetAddress,
          categories: categoriesToSave.map((cat, index) => ({
            id: cat.id || undefined,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || null,
            order: cat.order !== undefined ? cat.order : index,
            isVisible: cat.isVisible !== undefined ? cat.isVisible : true,
            isDefault: cat.isDefault || false,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }))
        throw new Error(errorData.error || `HTTP ${response.status}: Kategoriler kaydedilemedi`)
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
          linkCount: cat.linkCount || 0,
          createdAt: cat.createdAt || new Date().toISOString(),
          updatedAt: cat.updatedAt || new Date().toISOString(),
        }))
      )
      return true
    } catch (error) {
      console.error('[LinksPanel] Failed to save categories', error)
      toast.error(error instanceof Error ? error.message : 'Kategoriler kaydedilirken bir hata oluştu')
      return false
    } finally {
      setCategoriesSaving(false)
    }
  }

  const saveLinks = async (linksToSave: LinkItem[]) => {
    if (!targetAddress) {
      toast.error('Cüzdan adresi bulunamadı')
      return false
    }

    try {
      setSaving(true)
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
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }))
        throw new Error(errorData.error || `HTTP ${response.status}: Linkler kaydedilemedi`)
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
    } catch (error) {
      console.error('[LinksPanel] Failed to save links', error)
      toast.error(error instanceof Error ? error.message : 'Linkler kaydedilirken bir hata oluştu')
      return false
    } finally {
      setSaving(false)
    }
  }

  const updateLinks = async (updater: (prev: LinkItem[]) => LinkItem[]) => {
    const next = updater(links)
    setLinks(next)
    await saveLinks(next)
  }

  // Group links by category
  const linksByCategory = (() => {
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
  })()

  // Get sorted categories (by order, with uncategorized last)
  const sortedCategories = [...categories].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1
    if (!a.isDefault && b.isDefault) return 1
    return (a.order || 0) - (b.order || 0)
  })

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Check if dragging to a category drop zone
    if (typeof over.id === 'string' && over.id.startsWith('category-')) {
      const targetCategoryId = over.id.replace('category-', '') || null
      const link = links.find(l => l.id === active.id)
      if (link) {
        const updated = links.map(l =>
          l.id === active.id
            ? { ...l, categoryId: targetCategoryId === 'null' ? null : targetCategoryId }
            : l
        )
        setLinks(updated)
        await saveLinks(updated)
      }
      return
    }

    // Regular link reordering within category
    const activeLink = links.find(l => l.id === active.id)
    const overLink = links.find(l => l.id === over.id)
    
    if (!activeLink || !overLink) return
    
    // If same category, reorder within category
    if (activeLink.categoryId === overLink.categoryId) {
      const categoryLinks = linksByCategory.get(activeLink.categoryId || null) || []
      const oldIndex = categoryLinks.findIndex(l => l.id === active.id)
      const newIndex = categoryLinks.findIndex(l => l.id === over.id)
      
      if (oldIndex === -1 || newIndex === -1) return
      
      const reordered = arrayMove(categoryLinks, oldIndex, newIndex)
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
      await saveLinks(updated)
    } else {
      // Moving between categories - handled by category drop zone above
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
    await saveLinks(updated)
  }

  const handleDelete = async (id: string) => {
    const updated = links.filter((link) => link.id !== id)
    setLinks(updated)
    const success = await saveLinks(updated)
    if (success) {
      toast.success('Link silindi')
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
      toast.error(urlError)
      return
    }

    // New links go to "Uncategorized" (null) if no category selected
    const categoryId = formCategoryId || null

    const now = new Date().toISOString()

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
        toast.success('Link güncellendi')
        setDialogOpen(false)
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
        toast.success('Link eklendi')
        setDialogOpen(false)
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
      toast.error('Kategori ismi gerekli')
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
        toast.success('Kategori güncellendi')
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
        toast.success('Kategori eklendi')
        setCategoryDialogOpen(false)
      }
    }
  }

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find(cat => cat.id === id)
    if (category?.isDefault) {
      toast.error('Varsayılan kategori silinemez')
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
      toast.success('Kategori silindi')
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
        toast.error(`${getSocialLabel(newSocialPlatform)} zaten eklenmiş`)
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
      toast.success(editingSocialLink ? 'Sosyal link güncellendi' : 'Sosyal link eklendi')
      setSocialDialogOpen(false)
    }
  }

  const handleDeleteSocialLink = async (id: string) => {
    const updated = socialLinks.filter(link => link.id !== id)
    setSocialLinks(updated)
    const success = await saveSocialLinks(updated)
    if (success) {
      toast.success('Sosyal link silindi')
    }
  }

  return (
    <PageShell
      title="Links"
      subtitle="Manage the external links that appear on your public SOCI4L profile."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Add, reorder and toggle links that will be visible on your public profile. Only enabled
            links are shown publicly.
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" variant="default" onClick={openAddDialog}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add link
              </Button>
            </DialogTrigger>
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
        </div>

        {/* Categories Management */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Link Categories</CardTitle>
                <CardDescription>
                  Organize your links into categories. Categories can be shown or hidden on your public profile.
                </CardDescription>
              </div>
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" size="sm" variant="outline" onClick={openAddCategoryDialog}>
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Add Category
                  </Button>
                </DialogTrigger>
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
            </div>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                Kategoriler yükleniyor...
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                No categories yet. Create your first category above.
              </div>
            ) : (
              <div className="space-y-2">
                {categories
                  .sort((a, b) => a.order - b.order)
                  .map((category, index) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-3 rounded-md border border-border/60 bg-background/60 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(category.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(category.id, 'down')}
                          disabled={index === categories.length - 1}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {category.name}
                            {category.isDefault && (
                              <Badge variant="secondary" className="ml-2 text-xs">Default</Badge>
                            )}
                          </p>
                        </div>
                        {category.description && (
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {category.linkCount || 0} {category.linkCount === 1 ? 'link' : 'links'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Toggle
                          aria-label={`Toggle ${category.name} visibility`}
                          size="sm"
                          variant="outline"
                          pressed={category.isVisible}
                          onPressedChange={() => handleToggleCategoryVisibility(category.id)}
                        >
                          {category.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </Toggle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditCategoryDialog(category)}
                          aria-label="Edit category"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {!category.isDefault && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                aria-label="Delete category"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete category?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will move all links in this category to the default category. The category will be removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDeleteCategory(category.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Profile Links</CardTitle>
            <CardDescription>
              Organize links into categories. Drag links to reorder them within or between categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading || categoriesLoading ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                Linkler yükleniyor...
              </div>
            ) : links.length === 0 && categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <Link2 className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium mb-1">No links yet</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Add your first link to start building your profile.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={openAddDialog}
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Add your first link
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              >
                <div ref={linksListRef} className="space-y-4">
                  {sortedCategories.map((category) => {
                    const categoryLinks = linksByCategory.get(category.id) || []
                    const isCollapsed = collapsedCategories.has(category.id)
                    const linkCount = categoryLinks.length
                    
                    // Don't show empty categories
                    if (linkCount === 0) return null
                    
                    return (
                      <div key={category.id} className="space-y-2">
                        {/* Category Header */}
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-border/40 bg-muted/20">
                          <button
                            type="button"
                            onClick={() => toggleCategoryCollapse(category.id)}
                            className="flex items-center justify-center h-6 w-6 rounded hover:bg-muted/60 transition-colors"
                            aria-label={isCollapsed ? 'Expand category' : 'Collapse category'}
                          >
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{category.name}</p>
                              <Badge variant="secondary" className="text-xs">
                                {linkCount}
                              </Badge>
                              {category.isDefault && (
                                <Badge variant="outline" className="text-xs">Default</Badge>
                              )}
                            </div>
                          </div>
                          <Toggle
                            aria-label={`Toggle ${category.name} visibility`}
                            size="sm"
                            variant="outline"
                            pressed={category.isVisible}
                            onPressedChange={() => handleToggleCategoryVisibility(category.id)}
                          >
                            {category.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </Toggle>
                        </div>
                        
                        {/* Category Links */}
                        {!isCollapsed && (
                          <CategoryDropZone categoryId={category.id}>
                            <div className="space-y-2 pl-4">
                            <SortableContext
                              items={categoryLinks.map(l => l.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              {categoryLinks.map((link) => (
                                <SortableLinkRow
                                  key={link.id}
                                  link={link}
                                  targetAddress={targetAddress}
                                  highlighted={highlightedLinkId === link.id}
                                  onToggleEnabled={handleToggleEnabled}
                                  onEdit={openEditDialog}
                                  onDelete={handleDelete}
                                />
                              ))}
                            </SortableContext>
                            </div>
                          </CategoryDropZone>
                        )}
                      </div>
                    )
                  })}
                  
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
                          <CategoryDropZone categoryId="null">
                            <div className="space-y-2 pl-4">
                              <SortableContext
                                items={uncategorizedLinks.map(l => l.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                {uncategorizedLinks.map((link) => (
                                  <SortableLinkRow
                                    key={link.id}
                                    link={link}
                                    targetAddress={targetAddress}
                                    highlighted={highlightedLinkId === link.id}
                                    onToggleEnabled={handleToggleEnabled}
                                    onEdit={openEditDialog}
                                    onDelete={handleDelete}
                                  />
                                ))}
                              </SortableContext>
                            </div>
                          </CategoryDropZone>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </DndContext>
            )}
          </CardContent>
        </Card>

      </div>
    </PageShell>
  )
}

