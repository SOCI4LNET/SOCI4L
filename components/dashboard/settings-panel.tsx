"use client"

import { useState, useEffect } from "react"
import { useSignMessage } from "wagmi"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Copy } from "lucide-react"
import { toast } from "sonner"
import { PageShell } from "@/components/app-shell/page-shell"
import { useTransaction } from '@/components/providers/transaction-provider'
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
  const { showTransactionLoader, hideTransactionLoader } = useTransaction()
  const [savingSlug, setSavingSlug] = useState(false)
  const [slug, setSlug] = useState<string>(profile.slug || '')
  const [savingVisibility, setSavingVisibility] = useState(false)
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(
    (profile.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC')
  )

  // Update form state when profile prop changes (e.g., after save/reload)
  useEffect(() => {
    if (profile) {
      const newSlug = profile.slug || ''
      if (slug !== newSlug) setSlug(newSlug)
      const newVisibility = profile.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC'
      if (visibility !== newVisibility) setVisibility(newVisibility)
    }
  }, [profile?.id, profile?.slug, profile?.visibility])

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
      toast.error('Failed to copy')
    }
  }

  const handleCopyProfileUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicProfileUrl)
      toast.success('Profile link copied')
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const handleSaveSlug = async () => {
    setSavingSlug(true)
    try {
      // Step 1: Get nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce')
      }
      const { nonce } = await nonceResponse.json()

      // Step 2: Sign message
      showTransactionLoader("Confirm in Wallet...")
      const message = `Set slug for ${targetAddress} to ${slug || '(empty)'}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      showTransactionLoader("Updating custom URL...")

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
        throw new Error(result.error || 'Failed to update slug')
      }

      // Success - reload data
      await onUpdate()
      toast.success('Saved')
    } catch (error: any) {
      console.error('Error updating slug:', error)
      if (error?.message?.includes('User rejected') || error?.name === 'UserRejectedRequestError') {
        toast.error('Transaction rejected')
      } else {
        // Show actual error from backend (e.g. "Slug already taken")
        toast.error(error.message || 'Failed to save custom URL')
      }
    } finally {
      setSavingSlug(false)
      hideTransactionLoader()
    }
  }

  const handleSaveVisibility = async () => {
    setSavingVisibility(true)
    try {
      // Step 1: Get nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce')
      }
      const { nonce } = await nonceResponse.json()

      // Step 2: Sign message
      showTransactionLoader("Confirm in Wallet...")
      const message = `Update visibility for ${targetAddress} to ${visibility}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      showTransactionLoader("Updating visibility...")

      // Step 3: Update visibility
      const visibilityResponse = await fetch('/api/profile/visibility', {
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

      if (!visibilityResponse.ok) {
        const errorData = await visibilityResponse.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to save visibility')
      }

      // Success - reload data
      await onUpdate()
      toast.success('Visibility updated')
    } catch (error: any) {
      console.error('Error updating visibility:', error)
      if (error?.message?.includes('User rejected') || error?.name === 'UserRejectedRequestError') {
        toast.error('Transaction rejected')
      } else {
        toast.error('Failed to save visibility settings. Please try again.')
      }
    } finally {
      setSavingVisibility(false)
      hideTransactionLoader()
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
                onChange={(e) => {
                  // Allow typing hyphens for intermediate steps, but validate on save/render
                  // Still enforce basic char set (lowercase alphanumeric + hyphen)
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  setSlug(val)
                }}
                placeholder="your-slug"
                className={`font-mono ${(slug.length > 0 && (
                    slug.length < 3 ||
                    slug.startsWith('-') ||
                    slug.endsWith('-') ||
                    slug.includes('--')
                  )) ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveSlug}
                disabled={
                  savingSlug ||
                  slug === (profile.slug || "") ||
                  slug.length < 3 ||
                  slug.startsWith('-') ||
                  slug.endsWith('-') ||
                  slug.includes('--')
                }
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
            {slug.length > 0 && (
              <div className="space-y-1">
                {slug.length < 3 && (
                  <p className="text-xs text-destructive font-medium">
                    Slug must be at least 3 characters long
                  </p>
                )}
                {(slug.startsWith('-') || slug.endsWith('-')) && (
                  <p className="text-xs text-destructive font-medium">
                    Slug cannot start or end with a hyphen
                  </p>
                )}
                {slug.includes('--') && (
                  <p className="text-xs text-destructive font-medium">
                    Slug cannot contain consecutive hyphens
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Your public link: <span className="font-mono">/p/{slug || "your-slug"}</span>
            </p>
          </CardContent>
        </Card>

        {/* Visibility Section */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Visibility</CardTitle>
            <CardDescription>
              Control who can view your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={visibility}
              onValueChange={(value) => {
                setVisibility(value as 'PUBLIC' | 'PRIVATE')
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PUBLIC" id="public" />
                <Label htmlFor="public" className="cursor-pointer text-sm">
                  Public - Anyone can view your profile
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PRIVATE" id="private" />
                <Label htmlFor="private" className="cursor-pointer text-sm">
                  Private - Only you can view full details
                </Label>
              </div>
            </RadioGroup>
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveVisibility}
                disabled={savingVisibility || visibility === (profile.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC')}
              >
                {savingVisibility ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
