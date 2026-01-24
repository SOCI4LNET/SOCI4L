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
import { GripVertical, Link2, Plus, Pencil, Trash2, ExternalLink, BarChart2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  const linksListRef = useRef<HTMLDivElement>(null)
  const [links, setLinks] = useState<LinkItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [highlightedLinkId, setHighlightedLinkId] = useState<string | null>(null)

  // Get target address from route params or connected wallet
  const targetAddress = (params.address as string)?.toLowerCase() || connectedAddress?.toLowerCase() || ''

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

        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Preview summary</CardTitle>
            <CardDescription className="text-xs">
              This is a quick snapshot of which links are currently active on your profile and in
              which order they will appear.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {enabledLinks.length === 0 ? (
              <p>No active links. Enable at least one link above to show it on your profile.</p>
            ) : (
              <ol className="list-decimal list-inside space-y-1">
                {enabledLinks.map((link) => (
                  <li key={link.id}>
                    <span className="font-medium">{link.title || link.url}</span>
                    <span className="text-muted-foreground"> — {link.url}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

