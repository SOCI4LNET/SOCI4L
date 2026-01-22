'use client'

import { useState } from 'react'
import { useSignMessage } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
  id: string
  address: string
  slug: string | null
  ownerAddress: string | null
  status: string
  visibility: string
  claimedAt: string | null
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
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(
    profile.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC'
  )
  const [slug, setSlug] = useState<string>(profile.slug || '')

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
      toast.success('Visibility updated successfully')
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
      toast.success('Custom URL updated successfully')
    } catch (error: any) {
      console.error('Error updating slug:', error)
      toast.error(error.message || 'Failed to update custom URL')
    } finally {
      setSavingSlug(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Profile configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Profile Visibility</Label>
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
          <Button onClick={handleSaveVisibility} disabled={saving || visibility === profile.visibility} size="sm">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>

        <div className="space-y-3 pt-6 border-t">
          <Label>Custom URL</Label>
          <div className="space-y-2">
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-profile"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              /p/{slug || 'your-slug'}
            </p>
            <p className="text-xs text-muted-foreground">
              3-24 characters, lowercase letters, numbers, and hyphens only
            </p>
          </div>
          <Button onClick={handleSaveSlug} disabled={savingSlug || slug === (profile.slug || '')} size="sm">
            {savingSlug ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Custom URL'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
