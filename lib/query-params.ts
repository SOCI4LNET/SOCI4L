/**
 * Query parameter whitelist and sanitization utilities.
 * 
 * Each dashboard tab has specific query parameters it uses:
 * - Settings: only 'tab' and 'settingsTab' (if needed in future)
 * - Social: 'tab' and 'subtab' (following/followers)
 * - Assets: 'tab' and 'assetTab' (tokens/nfts)
 * - Activity: 'tab' only
 * - Overview: 'tab' only
 * 
 * This prevents cross-tab parameter pollution (e.g., subtab=following on Settings page).
 */

/**
 * Allowed query parameter keys per dashboard tab.
 */
export const ALLOWED_QUERY_PARAMS: Record<string, string[]> = {
  settings: ['tab', 'settingsTab'],
  social: ['tab', 'subtab'],
  assets: ['tab', 'assetTab'],
  activity: ['tab'],
  overview: ['tab'],
  builder: ['tab', 'focus', 'category', 'link'],
  links: ['tab', 'link', 'category'],
  insights: ['tab'],
}

/**
 * Sanitizes query parameters for a given tab by removing disallowed params.
 * 
 * @param currentParams - Current URLSearchParams object
 * @param targetTab - Target tab name (e.g., 'settings', 'social')
 * @returns New URLSearchParams with only allowed parameters
 * 
 * @example
 * const params = new URLSearchParams('?tab=settings&subtab=following')
 * const sanitized = sanitizeQueryParams(params, 'settings')
 * // Returns: URLSearchParams with only 'tab=settings'
 */
export function sanitizeQueryParams(
  currentParams: URLSearchParams,
  targetTab: string
): URLSearchParams {
  const allowed = ALLOWED_QUERY_PARAMS[targetTab] || ['tab']
  const sanitized = new URLSearchParams()

  // Always preserve 'tab' parameter
  if (currentParams.has('tab')) {
    sanitized.set('tab', currentParams.get('tab')!)
  }

  // Add other allowed params
  for (const key of allowed) {
    if (key !== 'tab' && currentParams.has(key)) {
      sanitized.set(key, currentParams.get(key)!)
    }
  }

  return sanitized
}

/**
 * Checks if a query parameter is allowed for a given tab.
 */
export function isParamAllowed(param: string, tab: string): boolean {
  const allowed = ALLOWED_QUERY_PARAMS[tab] || ['tab']
  return allowed.includes(param)
}
