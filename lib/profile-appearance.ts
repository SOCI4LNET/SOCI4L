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
      // Editorial/Calm: No card background, just subtle structure
      return `${baseClasses} border-0 shadow-none bg-transparent`
    case 'dense':
      // Tactical/Data: Thicker borders, sharp feel
      return `${baseClasses} border-2 border-primary/10 shadow-none bg-card/50 rounded-lg`
    case 'spotlight':
      // Expressive: Premium spotlight feel for all cards
      return `${baseClasses} border-primary/30 shadow-lg shadow-primary/5 ring-1 ring-primary/10 bg-card saturate-[1.1]`
    case 'default':
    default:
      // Neutral Baseline: Standard card style
      return `${baseClasses} border-border/60 shadow-none bg-card`
  }
}

/**
 * Get theme-specific CSS classes for link items (buttons)
 */
export function getThemeLinkItemClasses(theme: ProfileTheme): string {
  const baseClasses = 'group flex items-center justify-between transition-all duration-200'

  switch (theme) {
    case 'minimal':
      // Minimal: List style, no borders except separator, clean
      return `${baseClasses} px-0 py-3 border-b border-border/40 hover:pl-2 hover:border-primary/50 rounded-none bg-transparent`
    case 'dense':
      // Dense: Solid blocks, highly visible
      return `${baseClasses} px-3 py-1.5 border border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/30 rounded-md`
    case 'spotlight':
      // Spotlight: Glowy, clean surface
      return `${baseClasses} px-4 py-3 border border-primary/10 bg-background/50 hover:bg-background/80 hover:border-primary/40 hover:shadow-[0_0_15px_-3px_rgba(var(--primary),0.2)] rounded-xl`
    case 'default':
    default:
      // Default: Standard card-like link
      return `${baseClasses} px-3 py-2 border border-border/60 bg-background/60 hover:bg-primary/5 hover:border-primary/50 rounded-md shadow-sm`
  }
}

/**
 * Get theme-specific CSS classes for header/avatar
 */
export function getThemeHeaderClasses(theme: ProfileTheme): string {
  switch (theme) {
    case 'minimal':
      return 'mb-12' // More breath
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
      // Minimal: Serif-like headings, keep size same as default
      if (size === 'title') return 'text-2xl font-serif font-medium tracking-tight'
      if (size === 'body') return 'text-sm'
      return 'text-xs text-muted-foreground'
    case 'dense':
      // Dense: Technical, keep size same as default
      if (size === 'title') return 'text-2xl font-bold tracking-tight uppercase'
      if (size === 'body') return 'text-sm font-medium'
      return 'text-xs text-muted-foreground uppercase tracking-wider'
    case 'spotlight':
      // Spotlight: Expressive headings, keep size same as default
      if (size === 'title') return 'text-2xl font-heading font-bold tracking-tight'
      if (size === 'body') return 'text-sm font-medium tracking-tight'
      return 'text-xs font-medium text-muted-foreground'
    case 'default':
    default:
      if (size === 'title') return 'text-2xl font-semibold tracking-tight'
      if (size === 'body') return 'text-sm'
      return 'text-xs text-muted-foreground'
  }
}
