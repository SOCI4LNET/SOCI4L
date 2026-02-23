'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { getPublicProfileHref } from '@/lib/routing'

interface DonateEmbedWidgetProps {
  profile: {
    address: string
    slug: string | null
    displayName: string | null
  }
}

export function DonateEmbedWidget({ profile }: DonateEmbedWidgetProps) {
  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${getPublicProfileHref(profile.address, profile.slug)}?action=donate`
    : '#'

  const handleDonateClick = () => {
    window.open(profileUrl, '_blank')
  }

  return (
    <Card className="w-full max-w-[350px] overflow-hidden border-none bg-gradient-to-br from-background to-muted/30 shadow-lg ring-1 ring-border/50">
      <CardContent className="p-4 flex items-center justify-between gap-4">
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
            <p className="text-[10px] text-muted-foreground truncate italic">
              Support via SOCI4L
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 gap-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-none shadow-md hover:shadow-lg transition-all duration-300"
          onClick={handleDonateClick}
        >
          <Heart className="h-3.5 w-3.5 fill-current" />
          <span className="text-xs font-bold uppercase tracking-wider">Donate</span>
        </Button>
      </CardContent>
    </Card>
  )
}
