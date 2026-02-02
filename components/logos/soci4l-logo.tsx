import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Soci4LLogoProps {
  variant?: 'icon' | 'combination'
  className?: string
  width?: number
  height?: number
}

/**
 * SOCI4L Logo Component
 * 
 * Renders the SOCI4L logo using local PNG assets.
 * Automatically adapts to light/dark mode via CSS filters.
 * 
 * @param variant - 'icon' for icon only, 'combination' for logo + text
 * @param className - Additional CSS classes
 * @param width - Logo width
 * @param height - Logo height
 */
export function Soci4LLogo({
  variant = 'combination',
  className = '',
  width,
  height
}: Soci4LLogoProps) {
  // Determine standard dimensions if not provided
  // Icon is roughly square, Combination is wide
  const defaultWidth = variant === 'icon' ? 40 : 120
  const defaultHeight = variant === 'icon' ? 40 : 36

  const finalWidth = width || defaultWidth
  const finalHeight = height || defaultHeight

  // Source image is White-on-Transparent (optimized for Dark Mode).
  // For Light Mode (White background), we invert it to Black.
  // Exception: If className includes 'text-...' override, filter might not work as intended for color control,
  // but standard usage in standard layouts works with inversion.
  const themeClasses = "invert dark:invert-0 transition-all duration-300"

  if (variant === 'icon') {
    return (
      <Image
        src="/logos/icon.png"
        alt="SOCI4L Logo"
        width={finalWidth}
        height={finalHeight}
        className={cn('flex-shrink-0 object-contain', themeClasses, className)}
        priority
      />
    )
  }

  // Combination logo
  return (
    <Image
      src="/logos/combination.png"
      alt="SOCI4L"
      width={finalWidth}
      height={finalHeight}
      className={cn('flex-shrink-0 object-contain', themeClasses, className)}
      priority
    />
  )
}
