/**
 * Routing helper functions for navigation
 * 
 * These functions ensure correct routing behavior:
 * - "My Account" actions (Dashboard, Settings, Social) always use connected wallet
 * - "Current Profile" actions use the currently viewed profile from route
 * 
 * IMPORTANT: These functions prevent the routing bug where clicking "Dashboard" 
 * from the avatar dropdown would navigate to the currently viewed profile instead 
 * of the connected wallet's dashboard.
 * 
 * @example
 * // ✅ Correct: Always use connected wallet for Dashboard
 * const { address } = useAccount()
 * const href = getConnectedDashboardHref(address)
 * router.push(href) // Goes to /dashboard/{connectedAddress}
 * 
 * // ❌ Wrong: Don't use current profile for Dashboard
 * const currentProfile = getCurrentProfileAddressFromRoute(pathname, params)
 * router.push(`/dashboard/${currentProfile}`) // BUG: Wrong address!
 */

import { isValidAddress } from './utils'

/**
 * Get the dashboard href for the connected wallet
 * Always uses the connected wallet address, never the viewed profile
 * 
 * @param connectedAddress - The connected wallet address from wagmi useAccount()
 * @returns Dashboard href or null if no address
 * 
 * @example
 * const { address } = useAccount()
 * const href = getConnectedDashboardHref(address)
 * // Returns: "/dashboard/0x123..." or null
 */
export function getConnectedDashboardHref(connectedAddress?: string | null): string | null {
  if (!connectedAddress || !isValidAddress(connectedAddress)) {
    return null
  }
  return `/dashboard/${connectedAddress.toLowerCase()}`
}

/**
 * Get the current profile address from route params
 * Used for "View Public Profile", "Copy Address", "Share" actions
 * 
 * @param pathname - Current pathname from usePathname()
 * @param params - Route params from useParams()
 * @returns Profile address from route, or null if not on a profile page
 * 
 * @example
 * const pathname = usePathname()
 * const params = useParams()
 * const profileAddress = getCurrentProfileAddressFromRoute(pathname, params)
 * // Returns: "0x123..." if on /p/0x123 or /dashboard/0x123, null otherwise
 */
export function getCurrentProfileAddressFromRoute(
  pathname: string | null,
  params: Record<string, string | string[] | undefined>
): string | null {
  if (!pathname) return null

  // Dashboard route: /dashboard/[address]
  if (pathname.startsWith('/dashboard/') && params.address) {
    const address = params.address as string
    if (isValidAddress(address)) {
      return address.toLowerCase()
    }
  }

  // Public profile route: /p/[id] where id might be address or slug
  if (pathname.startsWith('/p/') && params.id) {
    const id = params.id as string
    // Check if id is an address (starts with 0x and valid format)
    if (id.startsWith('0x') && isValidAddress(id)) {
      return id.toLowerCase()
    }
  }

  return null
}

/**
 * Get public profile href for an address
 * 
 * @param address - Wallet address
 * @param slug - Optional profile slug (if available)
 * @returns Public profile href
 */
export function getPublicProfileHref(address: string, slug?: string | null): string {
  if (slug) {
    return `/p/${slug}`
  }
  return `/p/${address.toLowerCase()}`
}
