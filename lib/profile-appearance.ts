/**
 * Profile Appearance Configuration
 * Controls visual theme and styling of public profiles
 */

export type ProfileTheme = 'default' | 'minimal' | 'dense' | 'spotlight'

export interface ProfileAppearanceConfig {
  theme: ProfileTheme
}

export function getDefaultAppearanceConfig(): ProfileAppearanceConfig {
  return {
    theme: 'default',
  }
}

/**
 * Normalize appearance config to ensure valid theme
 */
export function normalizeAppearanceConfig(
  config: Partial<ProfileAppearanceConfig> | null | undefined
): ProfileAppearanceConfig {
  const validThemes: ProfileTheme[] = ['default', 'minimal', 'dense', 'spotlight']

  if (!config || typeof config !== 'object') {
    return getDefaultAppearanceConfig()
  }

  const theme = config.theme
  const isValidTheme = theme && validThemes.includes(theme as ProfileTheme)

  return {
    theme: isValidTheme ? (theme as ProfileTheme) : 'default',
  }
}

/**
 * Get theme-specific CSS classes for container
 */
export function getThemeContainerClasses(theme: ProfileTheme): string {
  const baseClasses = 'mx-auto max-w-2xl space-y-6'

  switch (theme) {
    case 'minimal':
      return `${baseClasses} space-y-8`
    case 'dense':
      return `${baseClasses} space-y-3 max-w-xl`
    case 'spotlight':
      return `${baseClasses} space-y-8 max-w-3xl`
    case 'default':
    default:
      return baseClasses
  }
}

/**
 * Get theme-specific CSS classes for cards
 */
export function getThemeCardClasses(theme: ProfileTheme, blockType?: 'links' | 'activity' | 'assets'): string {
  const baseClasses = 'bg-card border transition-all duration-200'

  switch (theme) {
    case 'minimal':
      // Editorial/Calm: No shadow, subtle border, clean background
      return `${baseClasses} border-muted/40 shadow-none bg-background`
    case 'dense':
      // Tactical/Data: Stronger border, no shadow, compact feel
      return `${baseClasses} border-border/80 shadow-none bg-card`
    case 'spotlight':
      // Expressive: Spotlight on links, others muted
      if (blockType === 'links') {
        return `${baseClasses} border-primary/40 shadow-lg shadow-primary/5 ring-1 ring-primary/20 bg-card`
      }
      // Other cards slightly transparent/dimmed to let links shine
      return `${baseClasses} border-border/40 opacity-90 hover:opacity-100 bg-card/50`
    case 'default':
    default:
      // Neutral Baseline: Standard card style
      return `${baseClasses} border-border/60 shadow-sm bg-card`
  }
}

/**
 * Get theme-specific CSS classes for header/avatar
 */
export function getThemeHeaderClasses(theme: ProfileTheme): string {
  switch (theme) {
    case 'minimal':
      return 'mb-10' // More breath
    case 'dense':
      return 'mb-4' // Compact
    case 'spotlight':
      return 'mb-12' // High impact
    case 'default':
    default:
      return 'mb-8' // Balanced
  }
}

/**
 * Get theme-specific CSS classes for text
 */
export function getThemeTextClasses(theme: ProfileTheme, size: 'title' | 'body' | 'small'): string {
  switch (theme) {
    case 'minimal':
      if (size === 'title') return 'text-3xl font-light tracking-tight' // Editorial feel
      if (size === 'body') return 'text-base leading-relaxed'
      return 'text-sm text-muted-foreground'
    case 'dense':
      if (size === 'title') return 'text-base font-semibold tracking-tight' // Tactical/Compact
      if (size === 'body') return 'text-xs'
      return 'text-[10px] text-muted-foreground'
    case 'spotlight':
      if (size === 'title') return 'text-4xl font-bold tracking-tighter' // Loud/Expressive
      if (size === 'body') return 'text-lg'
      return 'text-sm font-medium'
    case 'default':
    default:
      if (size === 'title') return 'text-2xl font-semibold tracking-tight' // Standard
      if (size === 'body') return 'text-sm'
      return 'text-xs text-muted-foreground'
  }
}
