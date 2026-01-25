"use client"

import { useState, useEffect } from "react"
import { useSignMessage } from "wagmi"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Copy } from "lucide-react"
import { toast } from "sonner"
import { PageShell } from "@/components/app-shell/page-shell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatAddress } from "@/lib/utils"
import { getPublicProfileHref } from "@/lib/routing"

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
  const [savingSlug, setSavingSlug] = useState(false)
  const [slug, setSlug] = useState<string>(profile.slug || '')

  // Update form state when profile prop changes (e.g., after save/reload)
  useEffect(() => {
    if (profile) {
      const newSlug = profile.slug || ''
      if (slug !== newSlug) setSlug(newSlug)
    }
  }, [profile?.id, profile?.slug])

  const normalizedAddress = targetAddress.toLowerCase()
  const shortAddress = formatAddress(normalizedAddress, 4)
  const publicProfileHref = getPublicProfileHref(normalizedAddress, profile.slug)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soci4l.net"
  const publicProfileUrl = `${appUrl}${publicProfileHref}`
  const identityDisplayName = profile.displayName || shortAddress
  const isClaimed = profile.status === 'CLAIMED'

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(targetAddress)
      toast.success('Address copied')
    } catch (error) {
      toast.error('Copy failed')
    }
  }

  const handleCopyProfileUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicProfileUrl)
      toast.success('Profile link copied')
    } catch (error) {
      toast.error('Copy failed')
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

  return (
    <PageShell
      title="Settings"
      subtitle="Account and identity information"
      mode="full-width"
    >
      <div className="space-y-6">
        {/* Account Card */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>
              Your wallet identity information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
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
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono font-semibold truncate">
                    {shortAddress}
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={handleCopyAddress}
                          aria-label="Copy address"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy address</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground">
                  Avalanche C-Chain
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Claim Status</span>
                <Badge variant={isClaimed ? 'default' : 'outline'}>
                  {isClaimed ? 'Claimed' : 'Unclaimed'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Public Profile</span>
                <div className="flex items-center gap-2">
                  <a
                    href={publicProfileHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-primary hover:underline truncate max-w-[200px]"
                  >
                    {publicProfileUrl}
                  </a>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={handleCopyProfileUrl}
                          aria-label="Copy profile link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy profile link</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom URL Section */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Custom URL</CardTitle>
            <CardDescription>
              Your custom profile URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="your-slug"
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveSlug}
                disabled={savingSlug || slug === (profile.slug || "")}
              >
                {savingSlug ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your public link: <span className="font-mono">/p/{slug || "your-slug"}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Public profile content (name, bio, links, visibility) is managed in the Builder.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
