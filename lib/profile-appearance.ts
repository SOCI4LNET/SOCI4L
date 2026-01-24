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
  const baseClasses = 'bg-card border border-border/60 shadow-sm'
  
  switch (theme) {
    case 'minimal':
      return `${baseClasses} border-border/40 shadow-none`
    case 'dense':
      return `${baseClasses} border-border/80`
    case 'spotlight':
      if (blockType === 'links') {
        return `${baseClasses} border-primary/20 shadow-md ring-1 ring-primary/10`
      }
      return `${baseClasses} border-border/40 opacity-90`
    case 'default':
    default:
      return baseClasses
  }
}

/**
 * Get theme-specific CSS classes for header/avatar
 */
export function getThemeHeaderClasses(theme: ProfileTheme): string {
  switch (theme) {
    case 'minimal':
      return 'mb-8'
    case 'dense':
      return 'mb-4'
    case 'spotlight':
      return 'mb-10'
    case 'default':
    default:
      return 'mb-6'
  }
}

/**
 * Get theme-specific CSS classes for text
 */
export function getThemeTextClasses(theme: ProfileTheme, size: 'title' | 'body' | 'small'): string {
  switch (theme) {
    case 'minimal':
      if (size === 'title') return 'text-2xl'
      if (size === 'body') return 'text-base'
      return 'text-sm'
    case 'dense':
      if (size === 'title') return 'text-lg'
      if (size === 'body') return 'text-sm'
      return 'text-xs'
    case 'spotlight':
      if (size === 'title') return 'text-3xl'
      if (size === 'body') return 'text-base'
      return 'text-sm'
    case 'default':
    default:
      if (size === 'title') return 'text-xl'
      if (size === 'body') return 'text-sm'
      return 'text-xs'
  }
}
