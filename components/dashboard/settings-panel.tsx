"use client"

import { useState, useEffect } from "react"
import { useSignMessage, useAccount } from "wagmi"
import { usePrivy } from "@privy-io/react-auth"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Copy, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { PageShell } from "@/components/app-shell/page-shell"
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
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTransaction } from '@/components/providers/transaction-provider'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatAddress } from "@/lib/utils"
import { getPublicProfileHref } from "@/lib/routing"
import { ProfileReadiness } from "@/components/dashboard/profile-readiness"

import { SlugManager } from "@/components/profile/slug-manager"

interface Profile {
  id: string
  address: string
  slug: string | null
  ownerAddress: string | null
  status: string
  visibility: string
  claimedAt: string | null
  slugClaimedAt?: string | Date | null // Added
  displayName?: string | null
  bio?: string | null
  socialLinks?: Array<{ id?: string; platform?: string; type?: string; url: string; label?: string }> | null
  appearance?: any
}

import { Checkbox } from "@/components/ui/checkbox"

interface SettingsPanelProps {
  profile: Profile
  targetAddress: string
  onUpdate: () => Promise<void>
}

export function SettingsPanel({ profile, targetAddress, onUpdate }: SettingsPanelProps) {
  const { signMessageAsync } = useSignMessage()
  const { showTransactionLoader, hideTransactionLoader } = useTransaction()

  // Mismatch Detection
  const { address: connectedAddress } = useAccount()
  const { user: privyUser, authenticated, logout, login } = usePrivy()
  const isSessionMismatch = authenticated && connectedAddress && privyUser?.wallet?.address &&
    (connectedAddress.toLowerCase() !== privyUser.wallet.address.toLowerCase())

  // Removed old slug state
  const [savingVisibility, setSavingVisibility] = useState(false)
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(
    (profile.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC')
  )
  const [hideSelfActivity, setHideSelfActivity] = useState<boolean>(
    profile.appearance?.hideSelfActivity ?? false
  )
  const [savingAnalytics, setSavingAnalytics] = useState(false)

  // Update form state when profile prop changes (e.g., after save/reload)
  useEffect(() => {
    if (profile) {
      // Removed slug update
      const newVisibility = profile.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC'
      if (visibility !== newVisibility) setVisibility(newVisibility)
      const newHideSelf = profile.appearance?.hideSelfActivity ?? false
      if (hideSelfActivity !== newHideSelf) setHideSelfActivity(newHideSelf)
    }
  }, [profile?.id, profile?.slug, profile?.visibility, profile.appearance?.hideSelfActivity])

  const normalizedAddress = targetAddress.toLowerCase()
  const shortAddress = formatAddress(normalizedAddress, 4)
  // Always use the raw address URL for the settings display as requested
  const publicProfileHref = `/p/${normalizedAddress}`
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

  // Removed handleSaveSlug and handleResetSlug

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

  const handleSaveAnalytics = async () => {
    setSavingAnalytics(true)
    try {
      const nonceResponse = await fetch('/api/auth/nonce')
      if (!nonceResponse.ok) throw new Error('Failed to get nonce')
      const { nonce } = await nonceResponse.json()

      showTransactionLoader("Confirm in Wallet...")
      const message = `Update profile appearance for ${targetAddress}. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      showTransactionLoader("Updating analytics settings...")

      const appearanceResponse = await fetch('/api/profile/appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: targetAddress,
          appearance: {
            ...profile.appearance,
            hideSelfActivity
          },
          signature,
        }),
      })

      if (!appearanceResponse.ok) {
        throw new Error('Failed to save analytics settings')
      }

      await onUpdate()
      toast.success('Analytics settings updated')
    } catch (error: any) {
      console.error('Error updating analytics:', error)
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSavingAnalytics(false)
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
        {/* Profile Readiness Helper */}
        <div className="w-full">
          <ProfileReadiness profile={profile} address={targetAddress} />
        </div>

        {/* Session Mismatch Alert */}
        {isSessionMismatch && (
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Wallet Mismatch Detected</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>
                Your connected wallet ({formatAddress(connectedAddress || "")}) does not match your active session ({formatAddress(privyUser?.wallet?.address || "")}).
                Actions may verify the wrong account.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-fit border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                onClick={async () => {
                  await logout();
                  login();
                }}
              >
                Sync Session
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
                    rel="noopener"
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

        {/* Custom URL Section (New SlugManager) */}
        <SlugManager
          currentSlug={profile.slug}
          slugClaimedAt={profile.slugClaimedAt ? new Date(profile.slugClaimedAt) : null}
        />

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

        {/* Analytics Section */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Analytics</CardTitle>
            <CardDescription>
              Configure how your activity is tracked and displayed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3 space-y-0">
              <Checkbox
                id="hide-self"
                checked={hideSelfActivity}
                onCheckedChange={(checked) => setHideSelfActivity(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="hide-self"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Hide my own activities
                </Label>
                <p className="text-xs text-muted-foreground">
                  Your views and clicks will be recorded but hidden from Insights and the Recent Activity block.
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAnalytics}
                disabled={savingAnalytics || hideSelfActivity === (profile.appearance?.hideSelfActivity ?? false)}
              >
                {savingAnalytics ? (
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
