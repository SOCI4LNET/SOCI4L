'use client'

import React from 'react'
import { getPublicProfileHref } from '@/lib/routing'

import { Heart } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'


interface DonateEmbedWidgetProps {
  profile: {
    address: string
    slug: string | null
    displayName: string | null
  }
}

export function DonateEmbedWidget({ profile }: DonateEmbedWidgetProps) {
  // Compute baseUrl dynamically on the client so it respects the current domain (Testnet vs Mainnet)
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || 'https://soci4l.net'

  const profileUrl = `${baseUrl}${getPublicProfileHref(profile.address, profile.slug)}?action=donate`

  const handleDonateClick = () => {
    window.open(profileUrl, '_blank')
  }

  return (
    <Card className="w-full h-full max-w-[350px] overflow-hidden border border-border/50 bg-card shadow-sm rounded-[8px] flex items-center">
      <CardContent className="p-4 w-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
            <AvatarImage
              src={`https://effigy.im/a/${profile.address.toLowerCase()}.svg`}
              alt={profile.displayName || profile.address}
            />
            <AvatarFallback className="text-[10px]">
              {profile.address.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate text-foreground">
              {profile.displayName || profile.address.slice(0, 6)}
            </h3>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors truncate block"
              title="View on SOCI4L"
            >
              Powered by SOCI4L
            </a>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 gap-1.5 shadow-md transition-all duration-300 rounded-[6px]"
          onClick={handleDonateClick}
        >
          <Heart className="h-3.5 w-3.5" />
          <span className="text-xs font-bold tracking-wider">Donate</span>
        </Button>
      </CardContent>
    </Card>
  )
}
