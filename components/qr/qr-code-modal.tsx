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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Share2, ChevronDown, X } from 'lucide-react'
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

type QRTheme = 'classic' | 'soft-gradient' | 'chrome'

const themeStyles: Record<QRTheme, {
  cardBg: string
  cardBorder: string
  cardShadow: string
  qrBg: string
  qrColor: string
  exportBg: string
}> = {
  classic: {
    cardBg: 'bg-white',
    cardBorder: 'border-border',
    cardShadow: 'shadow-md',
    qrBg: '#ffffff',
    qrColor: '#000000',
    exportBg: '#ffffff',
  },
  'soft-gradient': {
    cardBg: 'bg-gradient-to-br from-white to-gray-100',
    cardBorder: 'border-border',
    cardShadow: 'shadow-md',
    qrBg: '#f8f9fa', // Soft light gray background
    qrColor: '#4a5568', // Soft dark gray instead of pure black
    exportBg: '#f8f9fa',
  },
  chrome: {
    cardBg: 'bg-background',
    cardBorder: 'border-border',
    cardShadow: 'shadow-md',
    qrBg: '#1f2937', // Dark background for QR
    qrColor: '#ffffff', // White QR code on dark background
    exportBg: '#ffffff',
  },
}

export function QRCodeModal({ open, onOpenChange, profile }: QRCodeModalProps) {
  const [mounted, setMounted] = useState(false)
  const [qrReady, setQrReady] = useState(false)
  const [theme, setTheme] = useState<QRTheme>('classic')
  const qrContainerRef = useRef<HTMLDivElement>(null)
  const qrCodeWrapperRef = useRef<HTMLDivElement>(null) // QR code wrapper (with border/padding)
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const qrInstanceRef = useRef<QRCodeStylingInstance | null>(null)
  const qrLibraryRef = useRef<any>(null)
  const didAppendRef = useRef(false)
  const lastDataRef = useRef<string>('')
  const lastThemeRef = useRef<QRTheme>('classic')
  const isAppendingRef = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const profileUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const baseUrl = window.location.origin
    const profilePath = getPublicProfileHref(profile.address, profile.slug)
    // Add source=qr parameter for QR code attribution
    return `${baseUrl}${profilePath}?source=qr`
  }, [profile.address, profile.slug])

  const currentTheme = themeStyles[theme]

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

    // Check if theme or data changed - if so, force recreation
    const themeChanged = lastThemeRef.current !== theme
    const dataChanged = lastDataRef.current !== profileUrl
    
    // If theme or data changed, reset append state
    if (themeChanged || dataChanged) {
      didAppendRef.current = false
      lastThemeRef.current = theme
      if (dataChanged) {
        lastDataRef.current = profileUrl
      }
    }

    // Prevent duplicate appends only if nothing changed
    if (isAppendingRef.current || (didAppendRef.current && !themeChanged && !dataChanged)) {
      return
    }

    // Create or update QR instance with current theme colors
    const createQRInstance = () => {
      return new qrLibraryRef.current({
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
          color: currentTheme.qrColor,
          type: 'rounded',
        },
        backgroundOptions: {
          color: currentTheme.qrBg,
        },
        cornersSquareOptions: {
          color: currentTheme.qrColor,
          type: 'extra-rounded',
        },
        cornersDotOptions: {
          color: currentTheme.qrColor,
          type: 'dot',
        },
      })
    }

    // Always recreate QR instance when theme or data changes
    try {
      qrInstanceRef.current = createQRInstance()
      // Clear container before appending
      if (qrContainerRef.current) {
        if (qrContainerRef.current.replaceChildren) {
          qrContainerRef.current.replaceChildren()
        } else {
          qrContainerRef.current.innerHTML = ''
        }
      }
    } catch (error) {
      console.error('Failed to create QR instance:', error)
      return
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
  }, [mounted, open, profileUrl, theme])

  // Handle modal close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setQrReady(false)
      didAppendRef.current = false
      isAppendingRef.current = false
    }
    onOpenChange(newOpen)
  }

  const exportToPng = async (pixelRatio: number = 2) => {
    // Export only the QR code itself, not the wrapper with padding
    if (!qrContainerRef.current) {
      toast.error('QR code container not found')
      return
    }
    
    // Get the actual QR SVG element inside the container
    const qrSvg = qrContainerRef.current.querySelector('svg')
    const exportTarget = qrSvg || qrContainerRef.current

    try {
      // Try to import html-to-image
      let toPng: any
      try {
        const htmlToImage = await import('html-to-image')
        console.log('html-to-image imported:', htmlToImage)
        toPng = htmlToImage.toPng || (htmlToImage as any).default?.toPng
        if (!toPng) {
          console.error('html-to-image structure:', Object.keys(htmlToImage))
          throw new Error('toPng function not found in html-to-image')
        }
        console.log('toPng function found:', typeof toPng)
      } catch (importError: any) {
        console.error('Failed to import html-to-image:', importError)
        toast.error(`Export failed: ${importError?.message || 'html-to-image not available. Run: pnpm install'}`)
        return
      }
      
      // Wait for card to be fully rendered (double RAF for safety)
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve(null)
          })
        })
      })

      if (!exportTarget) {
        toast.error('QR code container lost during render')
        return
      }

      const rect = exportTarget.getBoundingClientRect()
      // Use actual QR code dimensions with minimal padding (10% of QR size)
      const qrSize = Math.max(rect.width, rect.height) || 240
      const padding = Math.round(qrSize * 0.1) // 10% padding - minimal but readable
      const width = qrSize + padding * 2
      const height = qrSize + padding * 2

      console.log('Exporting PNG:', { width, height, pixelRatio, theme, qrSize, padding })

      // Determine background color based on theme
      let backgroundColor = currentTheme.qrBg
      if (theme === 'chrome') {
        backgroundColor = '#1f2937'
      } else if (theme === 'soft-gradient') {
        backgroundColor = '#ffffff'
      }

      console.log('Calling toPng with options:', {
        width: width * pixelRatio,
        height: height * pixelRatio,
        pixelRatio,
        backgroundColor,
      })

      // Convert all images to data URLs before exporting to avoid external image loading issues
      // Note: QR code doesn't have images, but check just in case
      const images = exportTarget.querySelectorAll('img')
      const imageConversionPromises = Array.from(images).map(async (img: HTMLImageElement) => {
        // If image is already a data URL, skip
        if (img.src.startsWith('data:')) {
          return
        }

        // If image is loaded and valid, convert to data URL
        if (img.complete && img.naturalWidth > 0) {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(img, 0, 0)
              img.src = canvas.toDataURL('image/png')
              console.log('Image converted to data URL:', img.src.substring(0, 50) + '...')
            }
          } catch (error) {
            console.warn('Failed to convert image to data URL, using placeholder:', error)
            // Fallback to placeholder
            const canvas = document.createElement('canvas')
            canvas.width = img.width || 64
            canvas.height = img.height || 64
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.fillStyle = '#e5e7eb'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              ctx.fillStyle = '#9ca3af'
              ctx.font = '12px sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText('?', canvas.width / 2, canvas.height / 2)
              img.src = canvas.toDataURL()
            }
          }
          return
        }

        // Wait for image to load or timeout
        return new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('Image load timeout, using placeholder:', img.src)
            const canvas = document.createElement('canvas')
            canvas.width = img.width || 64
            canvas.height = img.height || 64
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.fillStyle = '#e5e7eb'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              ctx.fillStyle = '#9ca3af'
              ctx.font = '12px sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText('?', canvas.width / 2, canvas.height / 2)
              img.src = canvas.toDataURL()
            }
            resolve()
          }, 2000) // 2 second timeout
          
          img.onload = () => {
            clearTimeout(timeout)
            try {
              const canvas = document.createElement('canvas')
              canvas.width = img.naturalWidth
              canvas.height = img.naturalHeight
              const ctx = canvas.getContext('2d')
              if (ctx) {
                ctx.drawImage(img, 0, 0)
                img.src = canvas.toDataURL('image/png')
                console.log('Image loaded and converted to data URL')
              }
            } catch (error) {
              console.warn('Failed to convert loaded image:', error)
            }
            resolve()
          }
          
          img.onerror = () => {
            clearTimeout(timeout)
            console.warn('Image load error, using placeholder:', img.src)
            const canvas = document.createElement('canvas')
            canvas.width = img.width || 64
            canvas.height = img.height || 64
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.fillStyle = '#e5e7eb'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              ctx.fillStyle = '#9ca3af'
              ctx.font = '12px sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText('?', canvas.width / 2, canvas.height / 2)
              img.src = canvas.toDataURL()
            }
            resolve()
          }
        })
      })

      await Promise.all(imageConversionPromises)
      console.log('All images converted to data URLs or placeholders')

      // Wait a bit for DOM to update
      await new Promise(resolve => setTimeout(resolve, 200))

      const dataUrl = await toPng(exportTarget, {
        width: width * pixelRatio,
        height: height * pixelRatio,
        pixelRatio: pixelRatio,
        backgroundColor: backgroundColor,
        cacheBust: true,
        quality: 1.0,
        skipFonts: true, // Skip fonts to avoid loading issues
        useCORS: true, // Allow cross-origin images
        imagePlaceholder: true, // Use placeholder for failed images
      })

      console.log('PNG generated, dataUrl length:', dataUrl?.length)

      if (!dataUrl) {
        throw new Error('Failed to generate PNG data URL')
      }

      // Download
      const link = document.createElement('a')
      link.download = `qr-code-${profile.address.slice(2, 8)}-${pixelRatio}x.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success(`PNG (${pixelRatio}x) downloaded`)
    } catch (error: any) {
      console.error('PNG export failed - full error:', error)
      console.error('Error stack:', error?.stack)
      console.error('Error name:', error?.name)
      console.error('Error message:', error?.message)
      
      // Handle Event objects (image load errors)
      let errorMessage = 'Unknown error'
      if (error instanceof Event) {
        errorMessage = 'Image loading error during export'
      } else if (error?.message) {
        errorMessage = error.message
      } else if (error?.toString) {
        errorMessage = error.toString()
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      toast.error(`PNG export failed: ${errorMessage}`)
    }
  }

  const exportToSvg = async () => {
    // Export only the QR code itself, not the wrapper with padding
    if (!qrContainerRef.current) {
      toast.error('QR code container not found')
      return
    }
    
    // Get the actual QR SVG element inside the container
    const qrSvg = qrContainerRef.current.querySelector('svg')
    const exportTarget = qrSvg || qrContainerRef.current

    try {
      // Try to import html-to-image
      let toSvg: any
      try {
        const htmlToImage = await import('html-to-image')
        toSvg = htmlToImage.toSvg || (htmlToImage as any).default?.toSvg
        if (!toSvg) {
          throw new Error('toSvg function not found in html-to-image')
        }
      } catch (importError: any) {
        console.error('Failed to import html-to-image:', importError)
        toast.error(`Export failed: ${importError?.message || 'html-to-image not available. Run: pnpm install'}`)
        return
      }
      
      // Wait for card to be fully rendered (double RAF for safety)
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve(null)
          })
        })
      })

      const rect = exportTarget.getBoundingClientRect()
      // Use actual QR code dimensions with minimal padding (10% of QR size)
      const qrSize = Math.max(rect.width, rect.height) || 240
      const padding = Math.round(qrSize * 0.1) // 10% padding - minimal but readable
      const width = qrSize + padding * 2
      const height = qrSize + padding * 2

      console.log('Exporting SVG:', { width, height, qrSize, padding })

      // Determine background color based on theme
      let backgroundColor = currentTheme.qrBg
      if (theme === 'chrome') {
        backgroundColor = '#1f2937'
      } else if (theme === 'soft-gradient') {
        backgroundColor = '#ffffff'
      }

      // Convert all images to data URLs before exporting to avoid external image loading issues
      const images = exportTarget.querySelectorAll('img')
      const imageConversionPromises = Array.from(images).map(async (img: HTMLImageElement) => {
        // If image is already a data URL, skip
        if (img.src.startsWith('data:')) {
          return
        }

        // If image is loaded and valid, convert to data URL
        if (img.complete && img.naturalWidth > 0) {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(img, 0, 0)
              img.src = canvas.toDataURL('image/png')
              console.log('Image converted to data URL for SVG')
            }
          } catch (error) {
            console.warn('Failed to convert image to data URL, using placeholder:', error)
            // Fallback to placeholder
            const canvas = document.createElement('canvas')
            canvas.width = img.width || 64
            canvas.height = img.height || 64
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.fillStyle = '#e5e7eb'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              ctx.fillStyle = '#9ca3af'
              ctx.font = '12px sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText('?', canvas.width / 2, canvas.height / 2)
              img.src = canvas.toDataURL()
            }
          }
          return
        }

        // Wait for image to load or timeout
        return new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('Image load timeout for SVG, using placeholder:', img.src)
            const canvas = document.createElement('canvas')
            canvas.width = img.width || 64
            canvas.height = img.height || 64
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.fillStyle = '#e5e7eb'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              ctx.fillStyle = '#9ca3af'
              ctx.font = '12px sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText('?', canvas.width / 2, canvas.height / 2)
              img.src = canvas.toDataURL()
            }
            resolve()
          }, 2000) // 2 second timeout
          
          img.onload = () => {
            clearTimeout(timeout)
            try {
              const canvas = document.createElement('canvas')
              canvas.width = img.naturalWidth
              canvas.height = img.naturalHeight
              const ctx = canvas.getContext('2d')
              if (ctx) {
                ctx.drawImage(img, 0, 0)
                img.src = canvas.toDataURL('image/png')
                console.log('Image loaded and converted to data URL for SVG')
              }
            } catch (error) {
              console.warn('Failed to convert loaded image for SVG:', error)
            }
            resolve()
          }
          
          img.onerror = () => {
            clearTimeout(timeout)
            console.warn('Image load error for SVG, using placeholder:', img.src)
            const canvas = document.createElement('canvas')
            canvas.width = img.width || 64
            canvas.height = img.height || 64
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.fillStyle = '#e5e7eb'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              ctx.fillStyle = '#9ca3af'
              ctx.font = '12px sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText('?', canvas.width / 2, canvas.height / 2)
              img.src = canvas.toDataURL()
            }
            resolve()
          }
        })
      })

      await Promise.all(imageConversionPromises)
      console.log('All images converted to data URLs or placeholders for SVG export')

      // Wait a bit for DOM to update
      await new Promise(resolve => setTimeout(resolve, 200))

      const dataUrl = await toSvg(exportTarget, {
        width: width,
        height: height,
        backgroundColor: backgroundColor,
        cacheBust: true,
        skipFonts: true, // Skip fonts to avoid loading issues
        useCORS: true, // Allow cross-origin images
        imagePlaceholder: true, // Use placeholder for failed images
      })

      // Download
      const link = document.createElement('a')
      link.download = `qr-code-${profile.address.slice(2, 8)}.svg`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('SVG downloaded')
    } catch (error: any) {
      console.error('SVG export failed:', error)
      const errorMessage = error?.message || 'Unknown error'
      toast.error(`SVG export failed: ${errorMessage}`)
    }
  }

  const handleDownloadPNG2x = () => exportToPng(2)
  const handleDownloadPNG4x = () => exportToPng(4)
  const handleDownloadSVG = () => exportToSvg()

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
      <DialogContent className="max-w-md bg-card border shadow-lg p-6 [&>button]:block">
        <DialogTitle className="sr-only">QR Code for {displayName}</DialogTitle>
        <DialogDescription className="sr-only">
          Scan this QR code to open the profile for {displayName} ({formatAddress(profile.address, 4)})
        </DialogDescription>
        
        {/* Card Container - This is what we export */}
        <div 
          ref={cardContainerRef}
          className="flex flex-col items-center space-y-6 p-6 rounded-lg border border-border bg-background shadow-md"
        >
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
          <div 
            ref={qrCodeWrapperRef}
            className="mx-auto flex items-center justify-center rounded-lg border border-border bg-background p-4"
          >
            {/* Skeleton shown while QR is loading */}
            {!qrReady && (
              <Skeleton className="h-[240px] w-[240px] rounded-lg" />
            )}
            {/* QR container - React doesn't manage its children */}
            <div 
              ref={qrContainerRef}
              className="h-[240px] w-[240px] flex items-center justify-center rounded-lg"
              suppressHydrationWarning
              style={{ 
                display: qrReady ? 'flex' : 'none',
                backgroundColor: currentTheme.qrBg,
              }}
            />
          </div>

          {/* Helper Text */}
          <p className="text-center text-xs text-muted-foreground">
            Scan to open this profile
          </p>

          {/* Theme Selector */}
          <div className="w-full">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Style
            </label>
            <Select value={theme} onValueChange={(value) => setTheme(value as QRTheme)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="soft-gradient">Soft Gradient</SelectItem>
                <SelectItem value="chrome">Chrome</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                <DropdownMenuItem onClick={handleDownloadPNG2x}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>PNG (2x)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPNG4x}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>PNG (4x)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadSVG}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>SVG</span>
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
