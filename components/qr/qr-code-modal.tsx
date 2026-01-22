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

  // Handle modal open/close and QR rendering
  useEffect(() => {
    if (!mounted) return

    if (!profileUrl) {
      console.log('QR: No profile URL')
      return
    }

    // Modal closed: cleanup only in onClose handler, not here
    if (!open) {
      return
    }

    // Wait for library to load
    if (!qrLibraryRef.current) {
      console.log('QR: Library not loaded yet')
      return
    }

    // Prevent duplicate appends
    if (isAppendingRef.current) {
      console.log('QR: Already appending')
      return
    }

    // Check if data changed
    const dataChanged = lastDataRef.current !== profileUrl

    // Create QR instance if it doesn't exist (don't wait for container)
    if (!qrInstanceRef.current) {
      console.log('QR open: Creating QR instance', { profileUrl })
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
          imageOptions: {
            hideBackgroundDots: true,
            imageSize: 0.4,
            margin: 0,
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
        lastDataRef.current = profileUrl
        didAppendRef.current = false
        console.log('QR instance created')
      } catch (error) {
        console.error('Failed to create QR instance:', error)
        return
      }
    } else if (dataChanged) {
      // Update existing instance with new data
      console.log('QR open: Updating QR data', { profileUrl })
      try {
        qrInstanceRef.current.update({ data: profileUrl })
        lastDataRef.current = profileUrl
      } catch (error) {
        console.error('Failed to update QR instance:', error)
        return
      }
    }

    // Schedule append after modal is mounted and visible
    // Use multiple RAFs and setTimeout to ensure container is ready
    if (!didAppendRef.current || dataChanged) {
      isAppendingRef.current = true
      setQrReady(false)

      // Wait for container to be ready with multiple checks
      const attemptAppend = (attempts = 0) => {
        if (attempts > 10) {
          console.error('QR: Container never became ready after 10 attempts')
          isAppendingRef.current = false
          return
        }

        if (!qrContainerRef.current || !qrInstanceRef.current || !open) {
          if (attempts < 10) {
            setTimeout(() => attemptAppend(attempts + 1), 50)
          } else {
            console.log('QR: Append cancelled', {
              hasContainer: !!qrContainerRef.current,
              hasInstance: !!qrInstanceRef.current,
              isOpen: open
            })
            isAppendingRef.current = false
          }
          return
        }

        // Container is ready, proceed with append
        // Use setTimeout to ensure React has finished its render cycle
        setTimeout(() => {
          if (!qrContainerRef.current || !qrInstanceRef.current || !open) {
            isAppendingRef.current = false
            return
          }

          try {
            // Update data before append (in case it changed)
            qrInstanceRef.current.update({ data: profileUrl })
            
            // Clear container - use replaceChildren which is safer and doesn't conflict with React
            const container = qrContainerRef.current
            if (container) {
              // Use replaceChildren which is atomic and doesn't cause removeChild errors
              // This clears all children at once without individual removeChild calls
              if (container.replaceChildren) {
                container.replaceChildren()
              } else {
                // Fallback for older browsers
                container.innerHTML = ''
              }
            }
            
            // Append QR - this adds elements directly to DOM outside React's control
            qrInstanceRef.current.append(qrContainerRef.current)
            didAppendRef.current = true
            setQrReady(true)
            console.log('QR appended successfully')
          } catch (error) {
            console.error('Failed to append QR code:', error)
            setQrReady(false)
            didAppendRef.current = false
          } finally {
            isAppendingRef.current = false
          }
        }, 100)
      }

      // Start append attempt after a short delay to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          attemptAppend(0)
        })
      })
    }
  }, [mounted, open, profileUrl])

  // Handle modal close - cleanup only here, not in effect cleanup
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && open) {
      // Modal is closing
      console.log('QR close')
      setQrReady(false)
      didAppendRef.current = false
      isAppendingRef.current = false
      
      // Don't clear container here - let React handle it naturally
      // Clearing it manually causes removeChild conflicts
      // The container will be cleared when the component unmounts or re-renders
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
      <DialogContent className="max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl p-6 [&>button]:hidden relative overflow-hidden">
        <DialogTitle className="sr-only">QR Code for {displayName}</DialogTitle>
        <DialogDescription className="sr-only">
          Scan this QR code to open the profile for {displayName} ({formatAddress(profile.address, 4)})
        </DialogDescription>
        
        {/* Holographic gradient overlay effect with subtle animation */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-50 pointer-events-none animate-pulse" 
             style={{ animationDuration: '3s' }} />
        
        <div className="relative z-10 space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center space-y-3">
            <Avatar className="h-16 w-16 border-2 border-white/20">
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
          <div className="mx-auto flex items-center justify-center rounded-xl border border-white/10 bg-black/20 p-4">
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
          <div className="flex items-center justify-center gap-2 pt-2">
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
