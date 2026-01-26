/**
 * OpenSea API v2 Client
 * 
 * Server-only module for fetching NFT data from OpenSea API v2.
 * API key must be stored in OPENSEA_API_KEY environment variable.
 * 
 * Features:
 * - Rate limit handling with exponential backoff
 * - Caching with Next.js revalidate
 * - Type-safe responses
 */

const OPENSEA_BASE = 'https://api.opensea.io/api/v2'
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || ''

/**
 * Validate OpenSea API key
 * API key is optional - without it, rate limits are lower but API still works
 * In development: warns if missing (but still tries without key)
 * In production: works without key but with lower rate limits
 */
function validateApiKey(): boolean {
  if (!OPENSEA_API_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[OpenSea] OPENSEA_API_KEY not set. Using API without key (lower rate limits).')
      console.warn('[OpenSea] Get your free API key for higher limits at: https://docs.opensea.io/reference/api-keys')
    }
    return false
  }
  return true
}

export interface OpenSeaNft {
  identifier: string
  collection: string
  contract: string
  token_standard: string
  name: string | null
  description: string | null
  image_url: string | null
  metadata_url: string | null
  opensea_url: string | null
  updated_at: string | null
  is_disabled: boolean
  is_nsfw: boolean
}

export interface OpenSeaNftResponse {
  nfts: OpenSeaNft[]
  next: string | null
}

export interface OpenSeaError {
  detail?: string
  message?: string
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetch from OpenSea API with retry logic and rate limit handling
 */
async function fetchOpenSea(
  path: string,
  params: Record<string, string | number | undefined> = {},
  retries = 2
): Promise<Response> {
  // API key is optional - without it, rate limits are lower but API still works
  const hasApiKey = validateApiKey()

  // Build URL with query params
  const url = new URL(`${OPENSEA_BASE}${path}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value))
    }
  })

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Build headers - API key is optional
      const headers: Record<string, string> = {
        'accept': 'application/json',
      }
      
      // Only add API key header if available
      if (hasApiKey && OPENSEA_API_KEY) {
        headers['x-api-key'] = OPENSEA_API_KEY
      }

      const response = await fetch(url.toString(), {
        headers,
        next: { revalidate: 60 }, // Cache for 60 seconds
      })

      // Handle rate limit (429)
      if (response.status === 429) {
        if (attempt < retries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000
          console.warn(`[OpenSea] Rate limited (429), retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1})`)
          await sleep(delay)
          continue
        } else {
          throw new Error('OpenSea API rate limit exceeded. Please try again later.')
        }
      }

      // Handle other errors
      if (!response.ok) {
        let errorMessage = `OpenSea API error: ${response.status} ${response.statusText}`
        try {
          const errorData: OpenSeaError = await response.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMessage)
      }

      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry on non-rate-limit errors (except network errors)
      if (error instanceof Error && !error.message.includes('rate limit') && !error.message.includes('429')) {
        if (attempt < retries && error.message.includes('fetch')) {
          // Network error - retry with exponential backoff
          const delay = Math.pow(2, attempt) * 1000
          console.warn(`[OpenSea] Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1})`)
          await sleep(delay)
          continue
        }
        throw error
      }

      // If it's the last attempt, throw the error
      if (attempt === retries) {
        throw lastError
      }
    }
  }

  throw lastError || new Error('Failed to fetch from OpenSea API')
}

/**
 * Fetch NFTs owned by an account on a specific chain
 * 
 * @param chain - Chain identifier (e.g., 'avalanche', 'ethereum')
 * @param address - Wallet address (0x...)
 * @param limit - Number of NFTs to fetch (default: 24, max: 200)
 * @param next - Pagination cursor (optional)
 * @returns Normalized NFT data with pagination cursor
 */
export async function fetchAccountNfts(
  chain: string = 'avalanche',
  address: string,
  limit: number = 24,
  next?: string | null
): Promise<{ nfts: OpenSeaNft[]; next: string | null }> {
  if (!address || !address.startsWith('0x')) {
    throw new Error('Invalid wallet address')
  }

  const params: Record<string, string | number> = {
    limit: Math.min(limit, 200), // OpenSea max is 200
  }

  if (next) {
    params.next = next
  }

  const path = `/chain/${chain}/account/${address.toLowerCase()}/nfts`
  
  try {
    console.log('[OpenSea] Fetching NFTs:', {
      path,
      params,
      hasApiKey: !!OPENSEA_API_KEY,
      fullUrl: `${OPENSEA_BASE}${path}?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}`,
    })
    
    const response = await fetchOpenSea(path, params)
    
    // Log response status and headers for debugging
    console.log('[OpenSea] Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    })
    
    const data: OpenSeaNftResponse = await response.json()

    console.log('[OpenSea] API response parsed:', {
      nftCount: data.nfts?.length || 0,
      hasNext: !!data.next,
      rawResponseKeys: Object.keys(data),
      sampleNft: data.nfts?.[0] ? {
        identifier: data.nfts[0].identifier,
        name: data.nfts[0].name,
        contract: data.nfts[0].contract,
        collection: data.nfts[0].collection,
      } : null,
    })

    return {
      nfts: data.nfts || [],
      next: data.next || null,
    }
  } catch (error) {
    console.error('[OpenSea] Error fetching NFTs:', {
      chain,
      address,
      path,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.constructor.name : typeof error,
    })
    throw error
  }
}
