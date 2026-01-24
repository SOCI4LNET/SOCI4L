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
import { GripVertical, Link2, Plus, Pencil, Trash2, ExternalLink, BarChart2, Twitter, Github, Linkedin, Globe, Youtube } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSignMessage } from 'wagmi'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { PageShell } from '@/components/app-shell/page-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  createdAt: string
  updatedAt: string
}

type SocialLinkPlatform = 'website' | 'x' | 'github' | 'youtube' | 'linkedin'

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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [highlightedLinkId, setHighlightedLinkId] = useState<string | null>(null)
  
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
      case 'website':
      default:
        return 'Website'
    }
  }

  // Fixed order for social links
  const SOCIAL_LINK_ORDER: SocialLinkPlatform[] = ['website', 'x', 'github', 'youtube', 'linkedin']
  
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = links.findIndex((link) => link.id === active.id)
    const newIndex = links.findIndex((link) => link.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(links, oldIndex, newIndex)
    // Update order values
    const withOrder = reordered.map((link, index) => ({
      ...link,
      order: index,
    }))
    setLinks(withOrder)
    await saveLinks(withOrder)
  }

  const openAddDialog = () => {
    setEditingLink(null)
    setFormTitle('')
    setFormUrl('')
    setDialogOpen(true)
  }

  const openEditDialog = (link: LinkItem) => {
    setEditingLink(link)
    setFormTitle(link.title)
    setFormUrl(link.url)
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

    const now = new Date().toISOString()

    if (editingLink) {
      const updated = links.map((link) =>
        link.id === editingLink.id
          ? {
              ...link,
              title: trimmedTitle,
              url: trimmedUrl,
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

        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Profile Links</CardTitle>
            <CardDescription>
              Drag links to reorder them. Disable a link to hide it from your public profile without
              deleting it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                Linkler yükleniyor...
              </div>
            ) : links.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                No links added yet. Use the <span className="font-medium">Add link</span> button
                above to create your first link.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              >
                <SortableContext
                  items={links.map((link) => link.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div ref={linksListRef} className="space-y-2">
                    {links.map((link) => (
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
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Social Links Section */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Social Links</CardTitle>
            <CardDescription>
              Your public social identities connected to this wallet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {socialLinksLoading ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                Sosyal linkler yükleniyor...
              </div>
            ) : (
              <div className="space-y-2">
                {sortSocialLinks(socialLinks).map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-3 rounded-md border border-border/40 bg-background/40 px-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
                      {getSocialIcon(link.platform)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {link.label || getSocialLabel(link.platform)}
                        </p>
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground truncate hover:text-primary transition-colors block"
                        title={link.url}
                      >
                        {link.url}
                      </a>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditSocialDialog(link)}
                        aria-label="Edit social link"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            aria-label="Delete social link"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Sosyal linki sil?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu sosyal link profilinizden kaldırılacak. İsterseniz daha sonra tekrar ekleyebilirsiniz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDeleteSocialLink(link.id)}
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                {socialLinks.length === 0 && (
                  <div className="rounded-md border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                    Henüz sosyal link eklenmedi. Aşağıdaki butonu kullanarak ilk sosyal linkinizi ekleyin.
                  </div>
                )}
                {socialLinks.length < SOCIAL_LINK_ORDER.length && (
                  <Dialog open={socialDialogOpen} onOpenChange={setSocialDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openAddSocialDialog}
                        className="w-full mt-2"
                      >
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        Sosyal link ekle
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingSocialLink ? 'Sosyal linki düzenle' : 'Sosyal link ekle'}
                        </DialogTitle>
                        <DialogDescription>
                          Profilinize bağlanacak sosyal medya hesabınızı ekleyin.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="social-platform">Platform</Label>
                          <Select
                            value={newSocialPlatform}
                            onValueChange={(value) =>
                              setNewSocialPlatform(value as SocialLinkPlatform)
                            }
                            disabled={!!editingSocialLink}
                          >
                            <SelectTrigger id="social-platform">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SOCIAL_LINK_ORDER.map((platform) => {
                                const alreadyExists = socialLinks.some(
                                  (link) => link.platform === platform && link.id !== editingSocialLink?.id
                                )
                                return (
                                  <SelectItem
                                    key={platform}
                                    value={platform}
                                    disabled={alreadyExists}
                                  >
                                    {getSocialLabel(platform)}
                                    {alreadyExists && ' (zaten ekli)'}
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
                            placeholder="https://..."
                          />
                          <p className="text-xs text-muted-foreground">
                            URL <span className="font-mono">http://</span> veya{' '}
                            <span className="font-mono">https://</span> ile başlamalı.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="social-label">Etiket (opsiyonel)</Label>
                          <Input
                            id="social-label"
                            value={newSocialLabel}
                            onChange={(e) => setNewSocialLabel(e.target.value)}
                            placeholder="Özel etiket"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSocialDialogOpen(false)}
                        >
                          İptal
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveSocialLink}
                          disabled={socialLinksSaving}
                        >
                          {editingSocialLink ? 'Güncelle' : 'Ekle'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Preview summary</CardTitle>
            <CardDescription className="text-xs">
              This is a quick snapshot of which links are currently active on your profile and in
              which order they will appear.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {enabledLinks.length === 0 && socialLinks.length === 0 ? (
              <p>No active links. Enable at least one link above to show it on your profile.</p>
            ) : (
              <div className="space-y-3">
                {enabledLinks.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Profile Links:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      {enabledLinks.map((link) => (
                        <li key={link.id}>
                          <span className="font-medium">{link.title || link.url}</span>
                          <span className="text-muted-foreground"> — {link.url}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {socialLinks.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Social Links:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      {sortSocialLinks(socialLinks).map((link) => (
                        <li key={link.id}>
                          <span className="font-medium">
                            {link.label || getSocialLabel(link.platform)}
                          </span>
                          <span className="text-muted-foreground"> — {link.url}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

