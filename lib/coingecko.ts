/**
 * CoinGecko API helper for fetching token prices
 * 
 * Free tier: No API key required, rate limit: 10-50 calls/minute
 * 
 * Usage:
 * ```ts
 * const avaxPrice = await getAVAXPrice()
 * ```
 */

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

export interface TokenPrice {
  usd: number
  usd_24h_change?: number
}

/**
 * Fetches AVAX USD price from CoinGecko
 */
export async function getAVAXPrice(): Promise<number> {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=avalanche-2&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          'Accept': 'application/json',
        },
        // Cache for 1 minute
        next: { revalidate: 60 },
      }
    )

    if (!response.ok) {
      console.warn('[CoinGecko] Failed to fetch AVAX price:', response.status)
      return 0
    }

    const data = await response.json()
    const price = data['avalanche-2']?.usd

    if (!price || typeof price !== 'number') {
      console.warn('[CoinGecko] Invalid price data:', data)
      return 0
    }

    console.log('[CoinGecko] AVAX price fetched:', price)
    return price
  } catch (error) {
    console.error('[CoinGecko] Error fetching AVAX price:', error)
    return 0
  }
}

/**
 * Fetches multiple token prices from CoinGecko
 * @param tokenIds Array of CoinGecko token IDs (e.g., ['avalanche-2', 'usd-coin'])
 */
export async function getTokenPrices(tokenIds: string[]): Promise<Record<string, TokenPrice>> {
  if (tokenIds.length === 0) return {}

  try {
    const ids = tokenIds.join(',')
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 },
      }
    )

    if (!response.ok) {
      console.warn('[CoinGecko] Failed to fetch token prices:', response.status)
      return {}
    }

    const data = await response.json()
    const prices: Record<string, TokenPrice> = {}

    for (const id of tokenIds) {
      if (data[id]?.usd) {
        prices[id] = {
          usd: data[id].usd,
          usd_24h_change: data[id].usd_24h_change,
        }
      }
    }

    return prices
  } catch (error) {
    console.error('[CoinGecko] Error fetching token prices:', error)
    return {}
  }
}

/**
 * Fetches token logo URL from CoinGecko
 * @param coingeckoId CoinGecko token ID (e.g., 'usd-coin', 'aave')
 * @returns Logo URL or undefined if not found
 */
export async function getTokenLogoUrl(coingeckoId: string): Promise<string | undefined> {
  if (!coingeckoId) return undefined

  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/${coingeckoId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour (logos don't change often)
      }
    )

    if (!response.ok) {
      console.warn(`[CoinGecko] Failed to fetch logo for ${coingeckoId}:`, response.status)
      return undefined
    }

    const data = await response.json()
    // CoinGecko returns image object with thumb, small, large
    const logoUrl = data.image?.small || data.image?.thumb || data.image?.large

    if (logoUrl) {
      console.log(`[CoinGecko] Logo fetched for ${coingeckoId}:`, logoUrl)
      return logoUrl
    }

    return undefined
  } catch (error) {
    console.warn(`[CoinGecko] Error fetching logo for ${coingeckoId}:`, error)
    return undefined
  }
}

/**
 * Fetches multiple token logos from CoinGecko in batch
 * @param coingeckoIds Array of CoinGecko token IDs
 * @returns Map of coingeckoId -> logoUrl
 */
export async function getTokenLogos(coingeckoIds: string[]): Promise<Record<string, string>> {
  if (coingeckoIds.length === 0) return {}

  // CoinGecko doesn't have a batch endpoint for logos, so we fetch them in parallel
  // Limit to 10 concurrent requests to avoid rate limits
  const batchSize = 10
  const results: Record<string, string> = {}

  for (let i = 0; i < coingeckoIds.length; i += batchSize) {
    const batch = coingeckoIds.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (id) => {
        const logoUrl = await getTokenLogoUrl(id)
        return { id, logoUrl }
      })
    )

    for (const { id, logoUrl } of batchResults) {
      if (logoUrl) {
        results[id] = logoUrl
      }
    }

    // Small delay between batches to respect rate limits
    if (i + batchSize < coingeckoIds.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  return results
}

/**
 * CoinGecko token list cache (in-memory, refreshed every 6 hours)
 * Maps contract address -> { id, logoUrl }
 * 
 * Note: Cache duration reduced from 24h to 6h to catch new tokens faster
 * while still avoiding excessive API calls
 */
let tokenListCache: Map<string, { id: string; logoUrl: string }> | null = null
let tokenListCacheTime: number = 0
const TOKEN_LIST_CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours (reduced from 24h for faster new token detection)

/**
 * Fetches Avalanche C-Chain token list from CoinGecko and builds address -> logo map
 * This is cached for 6 hours to balance between freshness and API rate limits
 * Uses aggressive caching to speed up logo fetching
 * 
 * @internal - Exported for use in rpc-assets.ts to pre-fetch token list
 */
export async function getAvalancheTokenList(): Promise<Map<string, { id: string; logoUrl: string }>> {
  const now = Date.now()

  // Return cached data if still valid
  if (tokenListCache && (now - tokenListCacheTime) < TOKEN_LIST_CACHE_DURATION) {
    return tokenListCache
  }

  try {
    console.log('[CoinGecko] Fetching Avalanche token list (this may take a moment on first load)...')
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/list?include_platform=true`,
      {
        headers: {
          'Accept': 'application/json',
        },
        // Cache for 6 hours on server (matches in-memory cache)
        next: { revalidate: 6 * 60 * 60 }, // 6 hours
      }
    )

    if (!response.ok) {
      console.warn('[CoinGecko] Failed to fetch token list:', response.status)
      // Return empty map but don't cache the error
      return new Map()
    }

    const data = await response.json()
    const addressMap = new Map<string, { id: string; logoUrl: string }>()

    // Filter for Avalanche C-Chain tokens and build address map
    for (const token of data) {
      if (token.platforms && token.platforms['avalanche']) {
        const address = token.platforms['avalanche'].toLowerCase()
        // Store the coin ID for later logo fetching
        addressMap.set(address, {
          id: token.id,
          logoUrl: '', // Will be fetched on demand
        })
      }
    }

    console.log(`[CoinGecko] Token list cached: ${addressMap.size} Avalanche tokens`)
    tokenListCache = addressMap
    tokenListCacheTime = now
    return addressMap
  } catch (error) {
    console.warn('[CoinGecko] Error fetching token list:', error)
    // Return empty map on error, but don't cache the error state
    return new Map()
  }
}

/**
 * Searches CoinGecko for a token by symbol (fallback method)
 * @param symbol Token symbol (e.g., 'JOE', 'KET')
 * @returns Logo URL or undefined if not found
 */
async function searchTokenBySymbol(symbol: string): Promise<string | undefined> {
  if (!symbol) return undefined

  try {
    // Search CoinGecko by symbol
    const response = await fetch(
      `${COINGECKO_API_URL}/search?query=${encodeURIComponent(symbol)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )

    if (!response.ok) {
      return undefined
    }

    const data = await response.json()

    // Look for exact symbol match in coins
    if (data.coins && Array.isArray(data.coins)) {
      for (const coin of data.coins) {
        if (coin.symbol?.toUpperCase() === symbol.toUpperCase()) {
          // Found matching symbol, fetch logo using coin ID
          const logoUrl = await getTokenLogoUrl(coin.id)
          if (logoUrl) {
            console.log(`[CoinGecko] Found logo for ${symbol} via symbol search:`, logoUrl)
            return logoUrl
          }
        }
      }
    }

    return undefined
  } catch (error) {
    console.warn(`[CoinGecko] Error searching token by symbol ${symbol}:`, error)
    return undefined
  }
}

/**
 * Fetches token logo URL by contract address on Avalanche C-Chain
 * @param contractAddress Token contract address
 * @param symbol Optional token symbol for fallback search
 * @returns Logo URL or undefined if not found
 */
export async function getTokenLogoByAddress(
  contractAddress: string,
  symbol?: string
): Promise<string | undefined> {
  if (!contractAddress) return undefined

  const normalizedAddress = contractAddress.toLowerCase()

  try {
    // First, try to get token list to find CoinGecko ID
    const tokenList = await getAvalancheTokenList()
    const tokenInfo = tokenList.get(normalizedAddress)

    if (tokenInfo) {
      // Found in token list, fetch logo using the coin ID
      const logoUrl = await getTokenLogoUrl(tokenInfo.id)
      if (logoUrl) {
        return logoUrl
      }
    }

    // If not found in token list and symbol is provided, try symbol search as fallback
    if (symbol) {
      console.log(`[CoinGecko] Token ${symbol} (${contractAddress}) not in cached list, trying symbol search...`)
      const logoUrl = await searchTokenBySymbol(symbol)
      if (logoUrl) {
        // Cache the result in token list for future use
        if (tokenList && logoUrl) {
          // Extract coin ID from logo URL or search result
          // For now, just return the logo - we can improve this later
          return logoUrl
        }
        return logoUrl
      }
    }

    // Token not found in CoinGecko
    return undefined
  } catch (error) {
    console.warn(`[CoinGecko] Error fetching logo for address ${contractAddress}:`, error)
    return undefined
  }
}

/**
 * Fetches multiple token logos by contract addresses in batch
 * @param addresses Array of token contract addresses
 * @param symbols Optional map of address -> symbol for fallback search
 * @returns Map of address -> logoUrl
 */
export async function getTokenLogosByAddresses(
  addresses: string[],
  symbols?: Record<string, string>
): Promise<Record<string, string>> {
  if (addresses.length === 0) return {}

  const normalizedAddresses = addresses.map(addr => addr.toLowerCase())
  const results: Record<string, string> = {}

  try {
    // Get token list
    const tokenList = await getAvalancheTokenList()

    // Find all matching tokens
    const tokensToFetch: Array<{ address: string; id: string }> = []
    const tokensWithoutId: Array<{ address: string; symbol?: string }> = []

    for (const address of normalizedAddresses) {
      const tokenInfo = tokenList.get(address)
      if (tokenInfo) {
        tokensToFetch.push({ address, id: tokenInfo.id })
      } else {
        // Token not in cached list, will try symbol search
        const symbol = symbols?.[address]
        tokensWithoutId.push({ address, symbol })
      }
    }

    // Fetch logos for tokens found in list
    const batchSize = 10
    for (let i = 0; i < tokensToFetch.length; i += batchSize) {
      const batch = tokensToFetch.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async ({ address, id }) => {
          const logoUrl = await getTokenLogoUrl(id)
          return { address, logoUrl }
        })
      )

      for (const { address, logoUrl } of batchResults) {
        if (logoUrl) {
          results[address] = logoUrl
        }
      }

      // Small delay between batches
      if (i + batchSize < tokensToFetch.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    // Try symbol search for tokens not found in cached list
    for (const { address, symbol } of tokensWithoutId) {
      if (symbol && !results[address]) {
        console.log(`[CoinGecko] Trying symbol search for ${symbol} (${address})...`)
        const logoUrl = await searchTokenBySymbol(symbol)
        if (logoUrl) {
          results[address] = logoUrl
        }
      }
    }

    return results
  } catch (error) {
    console.warn('[CoinGecko] Error fetching logos by addresses:', error)
    return {}
  }
}

/**
 * Fetches historical market chart data for a token
 * @param coingeckoId CoinGecko token ID (e.g., 'avalanche-2')
 * @param days '1' out of 24h, '7' for 7d, '30' for 30d
 */
export async function getTokenChart(coingeckoId: string, days: string): Promise<any[]> {
  if (!coingeckoId) return []

  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${days}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    )

    if (!response.ok) {
      console.warn(`[CoinGecko] Failed to fetch chart data for ${coingeckoId}:`, response.status)
      return []
    }

    const data = await response.json()
    if (!data.prices || !Array.isArray(data.prices)) {
      return []
    }

    // Format the data for recharts
    // data.prices is an array of [timestamp, price]
    const formattedData = data.prices.map(([timestamp, price]: [number, number]) => {
      const date = new Date(timestamp)
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      return {
        timestamp,
        date: formattedDate,
        time: formattedTime,
        value: price,
      }
    })

    return formattedData
  } catch (error) {
    console.warn(`[CoinGecko] Error fetching chart data for ${coingeckoId}:`, error)
    return []
  }
}
