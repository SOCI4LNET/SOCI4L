"use client"

import { useState, useEffect } from "react"
import { useSignMessage } from "wagmi"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, X, Plus } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PageShell } from "@/components/app-shell/page-shell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatAddress } from "@/lib/utils"
import { getPublicProfileHref } from "@/lib/routing"

type SocialLinkPlatform = 'x' | 'instagram' | 'youtube' | 'github' | 'linkedin' | 'website'

interface SocialLink {
  id: string
  platform: SocialLinkPlatform
  url: string
  label?: string
}

interface Profile {
  id: string
  address: string
  slug: string | null
  ownerAddress: string | null
  status: string
  visibility: string
  claimedAt: string | null
  displayName?: string | null
  bio?: string | null
  socialLinks?: Array<{ id?: string; platform?: string; type?: string; url: string; label?: string }> | null
}

interface SettingsPanelProps {
  profile: Profile
  targetAddress: string
  onUpdate: () => Promise<void>
}

export function SettingsPanel({ profile, targetAddress, onUpdate }: SettingsPanelProps) {
  const { signMessageAsync } = useSignMessage()
  const [saving, setSaving] = useState(false)
  const [savingSlug, setSavingSlug] = useState(false)
  const [savingSocial, setSavingSocial] = useState(false)
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(
    profile.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC'
  )
  const [slug, setSlug] = useState<string>(profile.slug || '')
  const [displayName, setDisplayName] = useState<string>(profile.displayName || '')
  const [bio, setBio] = useState<string>(profile.bio || '')
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => {
    // Ensure all links have id and platform field
    const links = profile.socialLinks || []
    return links.map((link: any) => ({
      id: link.id || crypto.randomUUID(),
      platform: link.platform || link.type || 'website',
      url: link.url || '',
      label: link.label || '',
    }))
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null)
  const [newLinkPlatform, setNewLinkPlatform] = useState<SocialLinkPlatform>('website')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkLabel, setNewLinkLabel] = useState('')

  // Update form state when profile prop changes (e.g., after save/reload)
  // This only runs when profile prop changes, not when user types
  // Use a ref to track if we should update from props
  useEffect(() => {
    if (profile) {
      // Only update if values actually changed to avoid unnecessary state updates
      const newVisibility = profile.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC'
      const newSlug = profile.slug || ''
      const newDisplayName = profile.displayName || ''
      const newBio = profile.bio || ''
      const newSocialLinks = profile.socialLinks || []
      
      // Update only if different
      if (visibility !== newVisibility) setVisibility(newVisibility)
      if (slug !== newSlug) setSlug(newSlug)
      if (displayName !== newDisplayName) setDisplayName(newDisplayName)
      if (bio !== newBio) setBio(newBio)
      
      // For socialLinks, ensure all have id and platform
      const normalizedLinks = newSocialLinks.map((link: any) => ({
        id: link.id || crypto.randomUUID(),
        platform: (link.platform || link.type || 'website') as SocialLinkPlatform,
        url: link.url || '',
        label: link.label || '',
      }))
      const currentLinksJson = JSON.stringify(socialLinks)
      const newLinksJson = JSON.stringify(normalizedLinks)
      if (currentLinksJson !== newLinksJson) {
        setSocialLinks(normalizedLinks)
      }
    }
  }, [
    profile?.id,
    profile?.displayName,
    profile?.bio,
    profile?.socialLinks ? JSON.stringify(profile.socialLinks) : null,
    profile?.slug,
    profile?.visibility,
  ])

  const handleSaveVisibility = async () => {
    setSaving(true)
    try {
      // Step 1: Get nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) {
        throw new Error('Nonce alınamadı')
      }
      const { nonce } = await nonceResponse.json()

      // Step 2: Sign message
      const message = `Update visibility for ${targetAddress} to ${visibility}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      // Step 3: Update visibility
      const updateResponse = await fetch('/api/profile/visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: targetAddress,
          visibility,
          signature,
        }),
      })

      const result = await updateResponse.json()

      if (!updateResponse.ok) {
        throw new Error(result.error || 'Visibility güncellenemedi')
      }

      // Success - reload data
      await onUpdate()
      toast.success('Saved')
    } catch (error: any) {
      console.error('Error updating visibility:', error)
      toast.error(error.message || 'Failed to update visibility')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSlug = async () => {
    setSavingSlug(true)
    try {
      // Step 1: Get nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) {
        throw new Error('Nonce alınamadı')
      }
      const { nonce } = await nonceResponse.json()

      // Step 2: Sign message
      const message = `Set slug for ${targetAddress} to ${slug || '(empty)'}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      // Step 3: Update slug
      const updateResponse = await fetch('/api/profile/slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: targetAddress,
          slug: slug.trim() || null,
          signature,
        }),
      })

      const result = await updateResponse.json()

      if (!updateResponse.ok) {
        throw new Error(result.error || 'Slug güncellenemedi')
      }

      // Success - reload data
      await onUpdate()
      toast.success('Saved')
    } catch (error: any) {
      console.error('Error updating slug:', error)
      toast.error(error.message || 'Failed to update custom URL')
    } finally {
      setSavingSlug(false)
    }
  }

  const handleSaveSocial = async () => {
    setSavingSocial(true)
    try {
      // Step 1: Get nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) {
        throw new Error('Nonce alınamadı')
      }
      const { nonce } = await nonceResponse.json()

      // Step 2: Sign message
      const message = `Update social profile for ${targetAddress}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      // Step 3: Update social profile
      const updateResponse = await fetch('/api/profile/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: targetAddress,
          displayName: displayName.trim() || null,
          bio: bio.trim() || null,
          socialLinks: socialLinks.length > 0 ? socialLinks : null,
          signature,
        }),
      })

      const result = await updateResponse.json()

      if (!updateResponse.ok) {
        throw new Error(result.error || 'Social profile güncellenemedi')
      }

      // Update local state immediately from API response
      if (result.profile) {
        setDisplayName(result.profile.displayName || '')
        setBio(result.profile.bio || '')
        const links = result.profile.socialLinks || []
        setSocialLinks(links.map((link: any) => ({
          id: link.id || crypto.randomUUID(),
          platform: link.platform || link.type || 'website',
          url: link.url || '',
          label: link.label || '',
        })))
      }

      // Success - reload data to ensure consistency
      await onUpdate()
      toast.success('Profile updated')
    } catch (error: any) {
      console.error('Error updating social profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSavingSocial(false)
    }
  }

  const openAddDialog = () => {
    setEditingLink(null)
    setNewLinkPlatform('website')
    setNewLinkUrl('')
    setNewLinkLabel('')
    setDialogOpen(true)
  }

  const openEditDialog = (link: SocialLink) => {
    setEditingLink(link)
    setNewLinkPlatform(link.platform)
    setNewLinkUrl(link.url)
    setNewLinkLabel(link.label || '')
    setDialogOpen(true)
  }

  const handleSaveLink = () => {
    // Validate URL
    if (!newLinkUrl.trim()) {
      toast.error('URL is required')
      return
    }

    // Validate URL format
    if (!newLinkUrl.startsWith('http://') && !newLinkUrl.startsWith('https://')) {
      toast.error('URL must start with http:// or https://')
      return
    }

    if (editingLink) {
      // Update existing link
      const updated = socialLinks.map(link =>
        link.id === editingLink.id
          ? { ...link, platform: newLinkPlatform, url: newLinkUrl.trim(), label: newLinkLabel.trim() || undefined }
          : link
      )
      setSocialLinks(updated)
    } else {
      // Add new link
      if (socialLinks.length >= 8) {
        toast.error('Maximum 8 social links allowed')
        return
      }
      setSocialLinks([
        ...socialLinks,
        {
          id: crypto.randomUUID(),
          platform: newLinkPlatform,
          url: newLinkUrl.trim(),
          label: newLinkLabel.trim() || undefined,
        },
      ])
    }
    setDialogOpen(false)
  }

  const removeSocialLink = (id: string) => {
    setSocialLinks(socialLinks.filter(link => link.id !== id))
  }

  const hasSocialChanges = () => {
    const currentDisplayName = profile.displayName || ""
    const currentBio = profile.bio || ""
    const currentSocialLinks = profile.socialLinks || []

    return (
      displayName.trim() !== currentDisplayName ||
      bio.trim() !== currentBio ||
      JSON.stringify(socialLinks) !== JSON.stringify(currentSocialLinks)
    )
  }

  const normalizedAddress = targetAddress.toLowerCase()
  const shortAddress = formatAddress(normalizedAddress, 4)
  const publicProfileHref = getPublicProfileHref(normalizedAddress, profile.slug)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soci4l.net"
  const publicProfileUrl = `${appUrl}${publicProfileHref}`
  const identityDisplayName = profile.displayName || shortAddress

  return (
    <PageShell
      title="Settings"
      subtitle="Manage how your wallet appears as a public identity"
      mode="full-width"
    >
      <div className="space-y-6">
        {/* Identity Header Card (read-only) */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-10 w-10">
                {normalizedAddress ? (
                  <>
                    <AvatarImage
                      src={`https://effigy.im/a/${normalizedAddress}.svg`}
                      alt={identityDisplayName}
                    />
                    <AvatarFallback className="text-xs">
                      {normalizedAddress.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="text-xs">??</AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-mono font-semibold truncate">
                  {shortAddress}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Avalanche •{" "}
                  <a
                    href={publicProfileHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-2 hover:underline"
                  >
                    {publicProfileUrl}
                  </a>
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              This identity is backed by your wallet and cannot be edited.
            </p>
          </CardContent>
        </Card>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Profile Info & Social Links Section */}
          <Card className="bg-card border border-border/60 shadow-sm md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Profile Info</CardTitle>
              <CardDescription>
                Manage how your wallet appears as a public identity: display name, bio, and social links.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Info Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display name (max 32 characters)"
                    maxLength={32}
                  />
                  <p className="text-xs text-muted-foreground">
                    {displayName.length}/32 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Bio (max 160 characters)"
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {bio.length}/160 characters
                  </p>
                </div>
              </div>

              {/* Social Links Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Social Links</Label>
                  {socialLinks.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No social links added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {socialLinks.map((link) => (
                        <div key={link.id} className="flex items-center gap-2 p-2.5 border rounded-lg">
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <span className="text-xs text-muted-foreground font-medium capitalize w-20 shrink-0">
                              {link.platform === "x" ? "X" : link.platform}
                            </span>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm truncate hover:text-primary transition-colors"
                              title={link.url}
                            >
                              {link.label || link.url}
                            </a>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(link)}
                              aria-label="Edit link"
                              title="Edit link"
                              className="h-8 w-8"
                            >
                              <X className="h-3.5 w-3.5 rotate-45" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSocialLink(link.id)}
                              aria-label="Remove link"
                              title="Remove link"
                              className="h-8 w-8"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {socialLinks.length < 8 && (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={openAddDialog}>
                          <Plus className="mr-2 h-3.5 w-3.5" />
                          Add Link
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingLink ? "Edit Link" : "Add Social Link"}</DialogTitle>
                          <DialogDescription>
                            Add a social media link to your profile
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="platform">Platform</Label>
                            <Select
                              value={newLinkPlatform}
                              onValueChange={(value) =>
                                setNewLinkPlatform(value as SocialLinkPlatform)
                              }
                            >
                              <SelectTrigger id="platform">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="x">X (Twitter)</SelectItem>
                                <SelectItem value="instagram">Instagram</SelectItem>
                                <SelectItem value="youtube">YouTube</SelectItem>
                                <SelectItem value="github">GitHub</SelectItem>
                                <SelectItem value="linkedin">LinkedIn</SelectItem>
                                <SelectItem value="website">Website</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input
                              id="url"
                              value={newLinkUrl}
                              onChange={(e) => setNewLinkUrl(e.target.value)}
                              placeholder="https://..."
                            />
                            <p className="text-xs text-muted-foreground">
                              URL must start with http:// or https://
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="label">Label (optional)</Label>
                            <Input
                              id="label"
                              value={newLinkLabel}
                              onChange={(e) => setNewLinkLabel(e.target.value)}
                              placeholder="Custom label"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSaveLink}>
                            {editingLink ? "Update" : "Add"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* Save Button + View Public Profile */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleSaveSocial}
                  disabled={savingSocial || !hasSocialChanges()}
                  size="sm"
                  variant="secondary"
                  className="w-full"
                >
                  {savingSocial ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Profile & Social Links"
                  )}
                </Button>
                <div className="flex items-center justify-between border-t pt-3">
                  <p className="text-xs text-muted-foreground">
                    See how your identity looks on your public profile.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={publicProfileHref} target="_blank" rel="noopener noreferrer">
                      View Public Profile
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        {/* Visibility Section */}
        <Card className="bg-card border border-border/60 shadow-sm h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Visibility</CardTitle>
            <CardDescription>Control who can view your profile</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col h-full flex-1 space-y-4">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Current:</span>
                <Badge variant={profile.visibility === 'PUBLIC' ? 'default' : 'secondary'}>
                  {profile.visibility}
                </Badge>
              </div>
              <RadioGroup value={visibility} onValueChange={(value) => setVisibility(value as 'PUBLIC' | 'PRIVATE')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PUBLIC" id="public" />
                  <Label htmlFor="public" className="cursor-pointer">
                    Public - Anyone can view your profile
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PRIVATE" id="private" />
                  <Label htmlFor="private" className="cursor-pointer">
                    Private - Only you can view full details
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveVisibility} 
              disabled={saving || visibility === profile.visibility} 
              size="sm"
              variant="secondary"
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Visibility'
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Custom URL Section */}
        <Card className="bg-card border border-border/60 shadow-sm h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Custom URL</CardTitle>
            <CardDescription>
              A custom URL turns your wallet into a shareable public identity. Use it on event slides,
              QR codes, bios, and campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col h-full flex-1 space-y-4">
            <div className="flex-1 space-y-2">
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-profile"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Your public link will look like: <span className="font-mono">/p/{slug || "your-slug"}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                3-24 characters, lowercase letters, numbers, and hyphens only
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSaveSlug}
              disabled={savingSlug || slug === (profile.slug || "")}
              size="sm"
              variant="secondary"
              className="w-full"
            >
              {savingSlug ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Custom URL"
              )}
            </Button>
          </CardFooter>
        </Card>
        </div>
      </div>
    </PageShell>
  )
}
