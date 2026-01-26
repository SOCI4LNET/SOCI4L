/**
 * Logo Cache System
 * 
 * Caches token logos in localStorage to avoid repeated API calls.
 * Logos are cached by token address (or symbol for native tokens).
 * 
 * Cache structure:
 * {
 *   "token-logos": {
 *     "0x123...": "https://...",
 *     "native-AVAX": "https://...",
 *     ...
 *   },
 *   "cache-timestamp": 1234567890
 * }
 */

const CACHE_KEY = 'token-logos'
const CACHE_TIMESTAMP_KEY = 'token-logos-timestamp'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

interface LogoCache {
  [key: string]: string | null // address -> logoUrl (null means "no logo found")
}

/**
 * Gets the logo cache from localStorage
 */
function getCache(): LogoCache {
  if (typeof window === 'undefined') return {}
  
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return {}
    
    const data = JSON.parse(cached) as LogoCache
    return data
  } catch (error) {
    console.warn('[Logo Cache] Failed to read cache:', error)
    return {}
  }
}

/**
 * Saves the logo cache to localStorage
 */
function saveCache(cache: LogoCache): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    console.warn('[Logo Cache] Failed to save cache:', error)
    // If storage is full, try to clear old entries
    try {
      const currentCache = getCache()
      // Keep only the most recent 100 entries
      const entries = Object.entries(currentCache)
      if (entries.length > 100) {
        const recentEntries = entries.slice(-100)
        const trimmedCache: LogoCache = {}
        for (const [key, value] of recentEntries) {
          trimmedCache[key] = value
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(trimmedCache))
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
      }
    } catch (clearError) {
      console.warn('[Logo Cache] Failed to trim cache:', clearError)
    }
  }
}

/**
 * Checks if cache is still valid (not expired)
 */
function isCacheValid(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    if (!timestamp) return false
    
    const age = Date.now() - parseInt(timestamp, 10)
    return age < CACHE_DURATION
  } catch (error) {
    return false
  }
}

/**
 * Gets a cached logo URL for a token
 * @param key Token address (lowercase) or "native-{SYMBOL}" for native tokens
 * @returns Cached logo URL, or undefined if not cached
 */
export function getCachedLogo(key: string): string | undefined {
  const cache = getCache()
  const logoUrl = cache[key?.toLowerCase()]
  
  // Return undefined if explicitly null (means "no logo found" was cached)
  if (logoUrl === null) {
    return undefined
  }
  
  return logoUrl
}

/**
 * Caches a logo URL for a token
 * @param key Token address (lowercase) or "native-{SYMBOL}" for native tokens
 * @param logoUrl Logo URL to cache, or null to cache "no logo found"
 */
export function setCachedLogo(key: string, logoUrl: string | null): void {
  const cache = getCache()
  cache[key?.toLowerCase()] = logoUrl || null
  saveCache(cache)
}

/**
 * Caches multiple logos at once
 * @param logos Map of token key -> logoUrl
 */
export function setCachedLogos(logos: Record<string, string | null>): void {
  const cache = getCache()
  for (const [key, logoUrl] of Object.entries(logos)) {
    cache[key?.toLowerCase()] = logoUrl || null
  }
  saveCache(cache)
}

/**
 * Gets cache key for a token
 * @param address Token contract address (null for native tokens)
 * @param symbol Token symbol (for native tokens)
 */
export function getCacheKey(address: string | null, symbol?: string): string {
  if (!address) {
    return `native-${symbol || 'AVAX'}`.toLowerCase()
  }
  return address.toLowerCase()
}

/**
 * Clears the entire logo cache
 */
export function clearLogoCache(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_TIMESTAMP_KEY)
  } catch (error) {
    console.warn('[Logo Cache] Failed to clear cache:', error)
  }
}

/**
 * Gets cache statistics
 */
export function getCacheStats(): { size: number; isValid: boolean; age: number | null } {
  const cache = getCache()
  const size = Object.keys(cache).length
  
  let age: number | null = null
  if (typeof window !== 'undefined') {
    try {
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      if (timestamp) {
        age = Date.now() - parseInt(timestamp, 10)
      }
    } catch (error) {
      // Ignore
    }
  }
  
  return {
    size,
    isValid: isCacheValid(),
    age,
  }
}
