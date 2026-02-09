'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Copy, ExternalLink, Share2, Twitter, QrCode, Check, X, Pencil, Sparkles } from "lucide-react"
import { formatAddress } from "@/lib/utils"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { ClaimProfileButton } from "@/components/claim-profile-button"
import { QRCodeModal } from "@/components/qr/qr-code-modal"
import { toast } from "sonner"
import type { ProfileData } from './overview-panel-content'

interface ProfileHeaderProps {
    profile: ProfileData | null
    address: string
    isOwnProfile: boolean
    isClaimed: boolean
    publicProfileHref: string | null
    onClaimSuccess?: () => void
    isLoading?: boolean

    // Edit Mode Props
    isEditable?: boolean
    onUpdate?: (data: Partial<ProfileData>) => void
}

export function ProfileHeader({
    profile,
    address,
    isOwnProfile,
    isClaimed,
    publicProfileHref,
    onClaimSuccess,
    isLoading,
    isEditable = false,
    onUpdate
}: ProfileHeaderProps) {
    const [qrModalOpen, setQrModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Edit State
    const [editName, setEditName] = useState(profile?.displayName || '')
    const [editBio, setEditBio] = useState(profile?.bio || '')

    useEffect(() => {
        setEditName(profile?.displayName || '')
        setEditBio(profile?.bio || '')
    }, [profile])

    const normalizedAddress = address.toLowerCase()
    const displayName = profile?.displayName || formatAddress(normalizedAddress, 4)
    const bio = profile?.bio || null

    const handleCopyAddress = async () => {
        if (!normalizedAddress) return
        try {
            await navigator.clipboard.writeText(normalizedAddress)
            toast.success('Address copied')
        } catch {
            toast.error('Failed to copy')
        }
    }

    const handleCopyProfileLink = async () => {
        if (!publicProfileHref) return
        try {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
            const profileUrl = `${baseUrl}${publicProfileHref}`
            await navigator.clipboard.writeText(profileUrl)
            toast.success('Profile link copied')
        } catch {
            toast.error('Failed to copy')
        }
    }

    const handleShareOnX = () => {
        if (!publicProfileHref) return
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const profileUrl = `${baseUrl}${publicProfileHref}`
        let shareText: string
        if (isOwnProfile) {
            shareText = 'Just claimed my SOCI4L profile on Avalanche.\n\nTrack my on-chain identity and links in one place.\n\n' + profileUrl
        } else {
            const profileName = profile?.displayName || formatAddress(normalizedAddress, 4)
            shareText = `Check out this SOCI4L profile on Avalanche: ${profileName}\n\nTrack on-chain identity and links in one place.\n\n` + profileUrl
        }
        const text = encodeURIComponent(shareText)
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener')
    }

    const handleSave = () => {
        if (onUpdate) {
            onUpdate({
                displayName: editName,
                bio: editBio
            })
            toast.success('Profile updated')
        }
        setIsEditing(false)
    }

    const handleCancel = () => {
        setEditName(profile?.displayName || '')
        setEditBio(profile?.bio || '')
        setIsEditing(false)
    }

    return (
        <>
            <Card className="bg-card border border-border/60 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                        {/* Left: Avatar + Name/Bio */}
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                            <Avatar className="h-12 w-12 flex-shrink-0">
                                {normalizedAddress ? (
                                    <>
                                        <AvatarImage src={`https://effigy.im/a/${normalizedAddress}.svg`} alt={displayName} />
                                        <AvatarFallback className="text-xs">
                                            {normalizedAddress.slice(2, 4).toUpperCase()}
                                        </AvatarFallback>
                                    </>
                                ) : (
                                    <AvatarFallback className="text-xs">??</AvatarFallback>
                                )}
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                {isLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                ) : (
                                    <>
                                        {/* Header Row */}
                                        <div className="flex items-center gap-2 mb-1 min-h-[28px]">
                                            {isEditing ? (
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="h-7 w-48 text-base font-semibold px-2 py-0"
                                                    placeholder="Display Name"
                                                />
                                            ) : (
                                                <h2 className="text-base font-semibold truncate">{displayName}</h2>
                                            )}

                                            {!isClaimed && !isEditable && (
                                                <ClaimProfileButton address={normalizedAddress} onSuccess={onClaimSuccess} />
                                            )}

                                            {profile?.primaryRole && (
                                                <Badge variant="default" className="text-[10px] px-1.5 h-5 bg-primary/90 hover:bg-primary">
                                                    {profile.primaryRole}
                                                </Badge>
                                            )}
                                            {profile?.secondaryRoles?.map((role, i) => (
                                                <Badge key={i} variant="secondary" className="text-[10px] px-1.5 h-5">
                                                    {role}
                                                </Badge>
                                            ))}
                                            {profile?.isPremium && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-center p-1 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-sm border border-amber-500/20 cursor-help">
                                                                <Sparkles className="h-3 w-3 text-amber-900" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="text-[10px] font-bold">Premium Profile</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            {profile?.statusMessage && (
                                                <span className="text-xs text-muted-foreground italic ml-1">
                                                    {profile.statusMessage}
                                                </span>
                                            )}

                                            {isEditable && !isEditing && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                                                    onClick={() => setIsEditing(true)}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>

                                        {/* Bio Row */}
                                        {isEditing ? (
                                            <Textarea
                                                value={editBio}
                                                onChange={(e) => setEditBio(e.target.value)}
                                                className="min-h-[60px] text-sm resize-none mt-1"
                                                placeholder="Add a bio..."
                                            />
                                        ) : (
                                            bio && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">{bio}</p>
                                            )
                                        )}

                                        {/* Footer Row */}
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <p className="text-xs text-muted-foreground font-mono">
                                                {formatAddress(normalizedAddress, 4)}
                                            </p>

                                            {isEditing && (
                                                <div className="flex items-center gap-2">
                                                    <Button size="sm" variant="default" className="h-6 px-2 text-xs gap-1" onClick={handleSave}>
                                                        <Check className="h-3 w-3" /> Save
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs gap-1" onClick={handleCancel}>
                                                        <X className="h-3 w-3" /> Cancel
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right: Quick Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={handleCopyAddress}
                                            aria-label="Copy address"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Copy address</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {publicProfileHref && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7"
                                                asChild
                                                aria-label="Open public profile"
                                            >
                                                <Link href={publicProfileHref}>
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Open public profile</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            {publicProfileHref && (
                                <DropdownMenu>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        aria-label="Share profile"
                                                    >
                                                        <Share2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>Share profile</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleCopyProfileLink}>
                                            <Copy className="mr-2 h-4 w-4" />
                                            <span>Copy profile link</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleShareOnX}>
                                            <Twitter className="mr-2 h-4 w-4" />
                                            <span>Share on X</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setQrModalOpen(true)}>
                                            <QrCode className="mr-2 h-4 w-4" />
                                            <span>Show QR code</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* QR Code Modal */}
            {normalizedAddress && publicProfileHref && (
                <QRCodeModal
                    open={qrModalOpen}
                    onOpenChange={setQrModalOpen}
                    profile={{
                        address: normalizedAddress,
                        displayName: displayName,
                        avatarUrl: `https://effigy.im/a/${normalizedAddress}.svg`,
                    }}
                />
            )}
        </>
    )
}
