'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Share2, ChevronDown } from 'lucide-react'
import { formatAddress } from '@/lib/utils'
import { toast } from 'sonner'
import { getPublicProfileHref } from '@/lib/routing'

interface QRCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: {
    address: string
    slug?: string | null
    displayName?: string | null
    avatarUrl?: string | null
  }
}

type QRCodeStylingInstance = {
  append: (container: HTMLElement) => void
  update: (options: { data: string }) => void
  download: (options: { extension: string }) => void
}

export function QRCodeModal({ open, onOpenChange, profile }: QRCodeModalProps) {
  const [mounted, setMounted] = useState(false)
  const [qrReady, setQrReady] = useState(false)
  const qrContainerRef = useRef<HTMLDivElement>(null)
  const qrInstanceRef = useRef<QRCodeStylingInstance | null>(null)
  const qrLibraryRef = useRef<any>(null)
  const didAppendRef = useRef(false)
  const lastDataRef = useRef<string>('')
  const isAppendingRef = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const profileUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const baseUrl = window.location.origin
    const profilePath = getPublicProfileHref(profile.address, profile.slug)
    return `${baseUrl}${profilePath}`
  }, [profile.address, profile.slug])

  // Initialize QR code library once
  useEffect(() => {
    if (!mounted) return

    // Load QR library once
    if (!qrLibraryRef.current) {
      import('qr-code-styling').then((QRCodeStyling) => {
        const QRCodeStylingClass = QRCodeStyling.default || QRCodeStyling.QRCodeStyling
        qrLibraryRef.current = QRCodeStylingClass
        console.log('QR library loaded')
      }).catch((error) => {
        console.error('Failed to load QR code library:', error)
        toast.error('QR code generation failed. Please install qr-code-styling package.')
      })
    }
  }, [mounted])

  // Handle modal open/close and QR rendering - simplified to prevent flicker
  useEffect(() => {
    if (!mounted || !open || !profileUrl) {
      if (!open) {
        setQrReady(false)
        didAppendRef.current = false
        isAppendingRef.current = false
      }
      return
    }

    // Wait for library to load
    if (!qrLibraryRef.current) {
      return
    }

    // Prevent duplicate appends
    if (isAppendingRef.current || didAppendRef.current) {
      return
    }

    // Create or update QR instance
    if (!qrInstanceRef.current) {
      try {
        qrInstanceRef.current = new qrLibraryRef.current({
          width: 240,
          height: 240,
          type: 'svg',
          data: profileUrl,
          margin: 20,
          qrOptions: {
            typeNumber: 0,
            mode: 'Byte',
            errorCorrectionLevel: 'M',
          },
          dotsOptions: {
            color: '#000000',
            type: 'rounded',
          },
          backgroundOptions: {
            color: '#ffffff',
          },
          cornersSquareOptions: {
            color: '#000000',
            type: 'extra-rounded',
          },
          cornersDotOptions: {
            color: '#000000',
            type: 'dot',
          },
        })
        lastDataRef.current = profileUrl
      } catch (error) {
        console.error('Failed to create QR instance:', error)
        return
      }
    } else if (lastDataRef.current !== profileUrl) {
      try {
        qrInstanceRef.current.update({ data: profileUrl })
        lastDataRef.current = profileUrl
      } catch (error) {
        console.error('Failed to update QR instance:', error)
        return
      }
    }

    // Append QR after a short delay to ensure container is ready
    isAppendingRef.current = true
    const timeoutId = setTimeout(() => {
      if (!qrContainerRef.current || !qrInstanceRef.current || !open) {
        isAppendingRef.current = false
        return
      }

      try {
        // Clear container
        if (qrContainerRef.current.replaceChildren) {
          qrContainerRef.current.replaceChildren()
        } else {
          qrContainerRef.current.innerHTML = ''
        }
        
        // Append QR
        qrInstanceRef.current.append(qrContainerRef.current)
        didAppendRef.current = true
        setQrReady(true)
      } catch (error) {
        console.error('Failed to append QR code:', error)
        setQrReady(false)
        didAppendRef.current = false
      } finally {
        isAppendingRef.current = false
      }
    }, 150)

    return () => {
      clearTimeout(timeoutId)
      if (!open) {
        isAppendingRef.current = false
      }
    }
  }, [mounted, open, profileUrl])

  // Handle modal close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setQrReady(false)
      didAppendRef.current = false
      isAppendingRef.current = false
    }
    onOpenChange(newOpen)
  }

  const handleDownloadPNG = async () => {
    if (!qrLibraryRef.current) {
      toast.error('QR code library not loaded')
      return
    }

    try {
      const QRCodeStyling = qrLibraryRef.current
      
      // Create a new instance for download with high quality PNG
      const downloadQR = new QRCodeStyling({
        width: 1024,
        height: 1024,
        type: 'canvas',
        data: profileUrl,
        margin: 20,
        qrOptions: {
          typeNumber: 0,
          mode: 'Byte',
          errorCorrectionLevel: 'M',
        },
        dotsOptions: {
          color: '#ffffff',
          type: 'rounded',
        },
        backgroundOptions: {
          color: 'transparent',
        },
        cornersSquareOptions: {
          color: '#ffffff',
          type: 'extra-rounded',
        },
        cornersDotOptions: {
          color: '#ffffff',
          type: 'dot',
        },
      })

      // Download after a brief delay to ensure canvas is ready
      setTimeout(() => {
        downloadQR.download({ extension: 'png' })
        toast.success('QR code downloaded')
      }, 200)
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Download failed')
    }
  }

  const handleDownloadSVG = async () => {
    if (!qrLibraryRef.current) {
      toast.error('QR code library not loaded')
      return
    }

    try {
      const QRCodeStyling = qrLibraryRef.current
      
      // Create a new instance for download with high quality SVG
      const downloadQR = new QRCodeStyling({
        width: 1024,
        height: 1024,
        type: 'svg',
        data: profileUrl,
        margin: 20,
        qrOptions: {
          typeNumber: 0,
          mode: 'Byte',
          errorCorrectionLevel: 'M',
        },
        dotsOptions: {
          color: '#ffffff',
          type: 'rounded',
        },
        backgroundOptions: {
          color: 'transparent',
        },
        cornersSquareOptions: {
          color: '#ffffff',
          type: 'extra-rounded',
        },
        cornersDotOptions: {
          color: '#ffffff',
          type: 'dot',
        },
      })

      // Download after a brief delay to ensure SVG is ready
      setTimeout(() => {
        downloadQR.download({ extension: 'svg' })
        toast.success('QR code downloaded')
      }, 200)
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Download failed')
    }
  }

  const handleShare = async () => {
    if (!profileUrl) {
      toast.error('Profile URL not available')
      return
    }

    // Try Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Avalanche Profile',
          text: `Check out this Avalanche profile`,
          url: profileUrl,
        })
        return
      } catch (error: any) {
        // User cancelled or share failed, fall back to clipboard
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error)
        }
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(profileUrl)
      toast.success('Link copied')
    } catch (error) {
      toast.error('Copy failed')
    }
  }

  const displayName = profile.displayName || formatAddress(profile.address)
  const avatarUrl = profile.avatarUrl || `https://effigy.im/a/${profile.address}.svg`
  const fallbackText = profile.address.slice(2, 5).toUpperCase()

  if (!mounted) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-card border shadow-lg p-6 [&>button]:hidden">
        <DialogTitle className="sr-only">QR Code for {displayName}</DialogTitle>
        <DialogDescription className="sr-only">
          Scan this QR code to open the profile for {displayName} ({formatAddress(profile.address, 4)})
        </DialogDescription>
        
        <div className="flex flex-col items-center space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center space-y-3">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                {fallbackText}
              </AvatarFallback>
            </Avatar>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold">{displayName}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                {formatAddress(profile.address, 4)}
              </p>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="mx-auto flex items-center justify-center rounded-lg border border-border bg-background p-4">
            {/* Skeleton shown while QR is loading */}
            {!qrReady && (
              <Skeleton className="h-[240px] w-[240px] rounded-lg" />
            )}
            {/* QR container - React doesn't manage its children */}
            <div 
              ref={qrContainerRef}
              className="h-[240px] w-[240px] flex items-center justify-center"
              suppressHydrationWarning
              style={{ display: qrReady ? 'flex' : 'none' }}
            />
          </div>

          {/* Helper Text */}
          <p className="text-center text-xs text-muted-foreground">
            Scan to open this profile
          </p>

          {/* Actions */}
          <div className="flex items-center justify-center gap-2 w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={handleDownloadPNG}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Download PNG</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadSVG}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Download SVG</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
