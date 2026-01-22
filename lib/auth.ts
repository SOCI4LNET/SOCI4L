import { cookies } from 'next/headers'

/**
 * Get the authenticated wallet address from session cookie
 * Returns null if no valid session exists
 */
export async function getSessionAddress(): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionAddress = cookieStore.get('aph_session')?.value
  
  if (!sessionAddress) {
    return null
  }

  return sessionAddress.toLowerCase()
}

/**
 * Clear the session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('aph_session')
}
