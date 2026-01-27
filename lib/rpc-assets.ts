/**
 * Asset fetching - FREE, NO API KEY REQUIRED
 * 
 * This module fetches token balances using multiple methods:
 * 1. SnowTrace API (FREE tier - no API key required)
 *    - Uses tokentx endpoint to get all token transfers
 *    - Calculates balances from transfer history
 *    - Free tier: 2 req/sec, 10,000 calls/day
 * 2. RPC fallback: Check popular token list + balanceOf calls
 *    - Used if SnowTrace API fails or for additional tokens
 * 
 * Strategy:
 * 1. Native AVAX: Direct RPC call (always free)
 * 2. ERC-20 tokens: SnowTrace API first, then RPC fallback
 * 3. Token metadata: From API or contract calls
 * 4. Prices: CoinGecko (free, no API key)
 */

import { avalancheClient } from './avalanche'
import { formatEther, formatUnits, parseUnits } from 'viem'
import { getAVAXPrice, getTokenLogos, getTokenLogoUrl, getTokenLogosByAddresses, getAvalancheTokenList } from './coingecko'

const SNOWTRACE_API_KEY = process.env.SNOWTRACE_API_KEY || ''
const SNOWTRACE_API_URL = 'https://api.snowtrace.io/api'

// ERC-20 ABI for balanceOf, name, symbol, decimals
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
] as const

// Popular Avalanche C-Chain tokens (top tokens by usage)
// These are the most commonly held tokens
interface PopularToken {
  address: string
  symbol: string
  name: string
  decimals: number
  coingeckoId?: string
}

const POPULAR_TOKENS: PopularToken[] = [
  // Stablecoins
  { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol: 'USDC', name: 'USD Coin', decimals: 6, coingeckoId: 'usd-coin' },
  { address: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', symbol: 'USDT', name: 'Tether USD', decimals: 6, coingeckoId: 'tether' },
  { address: '0xd586e7f844cea2f87f50152665bcbc2c279d8d70', symbol: 'DAI.e', name: 'Dai Stablecoin', decimals: 18, coingeckoId: 'dai' },
  
  // Wrapped tokens
  { address: '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab', symbol: 'WETH.e', name: 'Wrapped Ether', decimals: 18, coingeckoId: 'ethereum' },
  { address: '0x408d4cd0adb7cebd1f1a1c33a0ba2098e1295bab', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, coingeckoId: 'wrapped-bitcoin' },
  { address: '0x152b9d0FdC40C096757F570A51E494bd4b943E50', symbol: 'BTC.b', name: 'Bitcoin', decimals: 8, coingeckoId: 'bitcoin' },
  
  // DeFi tokens
  { address: '0x5947bb275c521040051d82396192181b413227a3', symbol: 'LINK.e', name: 'Chainlink Token', decimals: 18, coingeckoId: 'chainlink' },
  { address: '0x8ce2dee54bb9921a2ae0a63dbb2df8ed88b91dd9', symbol: 'AAVE', name: 'Aave Token', decimals: 18, coingeckoId: 'aave' },
  { address: '0x63a72806098bd3d9520cc43356dd78afe5d386d9', symbol: 'AAVE.e', name: 'Aave Token', decimals: 18, coingeckoId: 'aave' },
  { address: '0x2b2c81e08f1af8835a78bb2a90ae924ace0ea4be', symbol: 'sAVAX', name: 'Staked AVAX', decimals: 18, coingeckoId: 'avalanche-2' },
  { address: '0x60781C2586D68229fde47564546784ab3fACA982', symbol: 'PNG', name: 'Pangolin', decimals: 18, coingeckoId: 'pangolin' },
  
  // More popular tokens
  { address: '0xf20d962a6c8f70c731bd838a3a388d7d48fa6e15', symbol: 'ETH', name: 'Ethereum', decimals: 18, coingeckoId: 'ethereum' },
] as const

export interface RPCToken {
  contractAddress: string
  symbol: string
  name: string
  decimals: number
  balanceRaw: string
  balanceFormatted: string
  priceUsd?: number
  usdValue?: number
  logoUrl?: string
  coingeckoId?: string // Optional, for price fetching
}

export interface RPCNFT {
  contractAddress: string
  tokenId: string
  name?: string
  imageUrl?: string
}

export interface RPCAssetsResponse {
  address: string
  chainId: number
  native: {
    symbol: string
    name: string
    balanceWei: string
    balanceFormatted: string
    usdValue?: number
    priceUsd?: number
    logoUrl?: string
  }
  tokens: RPCToken[]
  nfts: RPCNFT[]
  updatedAt: string
}

/**
 * Fetch NFTs from SnowTrace API using tokennfttx endpoint
 * This gets all NFT transfers and calculates current ownership
 */
async function fetchNFTsFromSnowTrace(address: string): Promise<RPCNFT[]> {
  const normalizedAddress = address.toLowerCase()
  const apiKeyParam = SNOWTRACE_API_KEY ? `&apikey=${SNOWTRACE_API_KEY}` : ''
  
  try {
    const nftTxUrl = `${SNOWTRACE_API_URL}?module=account&action=tokennfttx&address=${normalizedAddress}&startblock=0&endblock=99999999&sort=asc${apiKeyParam}`
    
    console.log('[RPC Assets] Fetching NFTs from SnowTrace API...')
    const response = await fetch(nftTxUrl, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    })
    
    if (!response.ok) {
      throw new Error(`SnowTrace API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status !== '1' || !data.result || !Array.isArray(data.result)) {
      console.warn('[RPC Assets] SnowTrace API returned no NFT data')
      return []
    }
    
    // Group NFTs by contract and tokenId to get unique NFTs
    // Track ownership by processing all transfers chronologically
    const nftMap = new Map<string, { contractAddress: string; tokenId: string; name?: string }>()
    
    for (const tx of data.result) {
      const contract = tx.contractAddress?.toLowerCase()
      const tokenId = tx.tokenID
      
      if (!contract || !tokenId) continue
      
      const key = `${contract}-${tokenId}`
      
      // If NFT was transferred TO this address, add it
      if (tx.to?.toLowerCase() === normalizedAddress) {
        nftMap.set(key, {
          contractAddress: contract,
          tokenId,
          name: tx.tokenName || undefined,
        })
      } 
      // If NFT was transferred FROM this address, remove it
      else if (tx.from?.toLowerCase() === normalizedAddress) {
        nftMap.delete(key)
      }
    }
    
    const nfts = Array.from(nftMap.values())
    console.log(`[RPC Assets] Found ${nfts.length} NFTs from SnowTrace for address ${address}`)
    
    return nfts
  } catch (error) {
    console.error('[RPC Assets] Error fetching NFTs from SnowTrace:', error)
    return []
  }
}

/**
 * Fetches token balance from contract
 */
async function getTokenBalance(
  contractAddress: string,
  userAddress: string
): Promise<bigint> {
  try {
    const balance = await avalancheClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`],
    })
    return balance as bigint
  } catch (error) {
    console.warn(`[RPC Assets] Failed to get balance for ${contractAddress}:`, error)
    return BigInt(0)
  }
}

/**
 * Fetches token metadata from contract
 */
async function getTokenMetadata(contractAddress: string): Promise<{
  name: string
  symbol: string
  decimals: number
}> {
  try {
    const [name, symbol, decimals] = await Promise.all([
      avalancheClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'name',
      }).catch(() => 'Unknown Token'),
      avalancheClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }).catch(() => 'UNKNOWN'),
      avalancheClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }).catch(() => 18),
    ])

    return {
      name: typeof name === 'string' ? name : 'Unknown Token',
      symbol: typeof symbol === 'string' ? symbol : 'UNKNOWN',
      decimals: typeof decimals === 'number' ? decimals : 18,
    }
  } catch (error) {
    console.warn(`[RPC Assets] Failed to get metadata for ${contractAddress}:`, error)
    return {
      name: 'Unknown Token',
      symbol: 'UNKNOWN',
      decimals: 18,
    }
  }
}

/**
 * Fetch token balances from SnowTrace API using tokentx endpoint
 * This gets ALL token transfers and calculates current balances
 */
async function fetchTokensFromSnowTrace(address: string): Promise<RPCToken[]> {
  const normalizedAddress = address.toLowerCase()
  const apiKeyParam = SNOWTRACE_API_KEY ? `&apikey=${SNOWTRACE_API_KEY}` : ''
  
  try {
    // Fetch all token transfers for this address
    const tokenTxUrl = `${SNOWTRACE_API_URL}?module=account&action=tokentx&address=${normalizedAddress}&startblock=0&endblock=99999999&sort=asc${apiKeyParam}`
    
    console.log('[RPC Assets] Fetching tokens from SnowTrace API...')
    const response = await fetch(tokenTxUrl, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    })
    
    if (!response.ok) {
      throw new Error(`SnowTrace API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status !== '1' || !data.result || !Array.isArray(data.result)) {
      console.warn('[RPC Assets] SnowTrace API returned no token data')
      return []
    }
    
    // Process token transfers to calculate current balances
    const tokenMap = new Map<string, {
      name: string
      symbol: string
      decimals: number
      balance: bigint
      contractAddress: string
    }>()
    
    for (const tx of data.result) {
      const contract = tx.contractAddress?.toLowerCase()
      if (!contract) continue
      
      const decimals = parseInt(tx.tokenDecimal || '18')
      const value = BigInt(tx.value || '0')
      
      if (!tokenMap.has(contract)) {
        tokenMap.set(contract, {
          name: tx.tokenName || 'Unknown Token',
          symbol: tx.tokenSymbol || 'UNKNOWN',
          decimals,
          balance: BigInt(0),
          contractAddress: contract,
        })
      }
      
      const entry = tokenMap.get(contract)!
      // Calculate balance: incoming adds, outgoing subtracts
      if (tx.to?.toLowerCase() === normalizedAddress) {
        entry.balance += value
      } else if (tx.from?.toLowerCase() === normalizedAddress) {
        entry.balance -= value
      }
    }
    
    // Convert to RPCToken format, filter out zero balances
    const tokens: RPCToken[] = []
    for (const [contract, data] of tokenMap.entries()) {
      if (data.balance > BigInt(0)) {
        const balanceFormatted = formatUnits(data.balance, data.decimals)
        tokens.push({
          contractAddress: contract,
          symbol: data.symbol,
          name: data.name,
          decimals: data.decimals,
          balanceRaw: data.balance.toString(),
          balanceFormatted,
          // Prices will be fetched separately if needed
          priceUsd: undefined,
          usdValue: undefined,
          logoUrl: undefined,
        })
      }
    }
    
    console.log('[RPC Assets] SnowTrace API tokens found:', {
      count: tokens.length,
      tokens: tokens.map((t) => ({ symbol: t.symbol, balance: t.balanceFormatted })),
    })
    
    return tokens
  } catch (error) {
    console.warn('[RPC Assets] SnowTrace API fetch failed:', error)
    return []
  }
}

/**
 * Fetches all assets using SnowTrace API first, then RPC fallback
 * SnowTrace API is FREE and works without API key (2 req/sec, 10k/day)
 */
export async function fetchAssetsFromRPC(
  address: string
): Promise<RPCAssetsResponse> {
  const normalizedAddress = address.toLowerCase()
  const startTime = Date.now()

  console.log('[RPC Assets] Fetching assets for:', {
    address: normalizedAddress,
    method: 'SnowTrace API + RPC fallback',
  })

  try {
    // 1. Get native AVAX balance
    const nativeBalance = await avalancheClient.getBalance({
      address: normalizedAddress as `0x${string}`,
    })
    const nativeBalanceFormatted = formatEther(nativeBalance)

    // Get AVAX price and logo from CoinGecko
    let avaxPrice = 0
    let avaxLogoUrl: string | undefined
    try {
      const [price, logo] = await Promise.all([
        getAVAXPrice(),
        getTokenLogoUrl('avalanche-2'),
      ])
      avaxPrice = price
      avaxLogoUrl = logo
    } catch (error) {
      console.warn('[RPC Assets] Failed to fetch AVAX price/logo:', error)
    }

    const nativeUsdValue = avaxPrice > 0 ? parseFloat(nativeBalanceFormatted) * avaxPrice : undefined

    console.log('[RPC Assets] Native balance:', {
      balance: nativeBalanceFormatted,
      usdValue: nativeUsdValue,
      logoUrl: avaxLogoUrl || 'none (CoinGecko only)',
    })

    // 2. Try SnowTrace API first (gets ALL tokens, not just popular ones)
    let tokens: RPCToken[] = await fetchTokensFromSnowTrace(normalizedAddress)
    
    // 3. If SnowTrace didn't return tokens, fallback to popular tokens check
    if (tokens.length === 0) {
      console.log('[RPC Assets] SnowTrace returned no tokens, using popular tokens fallback')
      
      // Check popular tokens in parallel (batch requests)
      const tokenChecks = POPULAR_TOKENS.map(async (tokenInfo) => {
        const balance = await getTokenBalance(tokenInfo.address, normalizedAddress)
      
      const zero = BigInt(0)
      if (balance === zero) {
        return null
      }

      // Use known metadata or fetch from contract
      let name: string = tokenInfo.name
      let symbol: string = tokenInfo.symbol
      let decimals: number = tokenInfo.decimals

      // Fetch metadata from contract to ensure accuracy
      const metadata = await getTokenMetadata(tokenInfo.address)
      // Use fetched metadata if it's valid, otherwise use known values
      if (metadata.name !== 'Unknown Token') {
        name = metadata.name
      }
      if (metadata.symbol !== 'UNKNOWN') {
        symbol = metadata.symbol
      }
      if (metadata.decimals !== 18 || tokenInfo.decimals === 18) {
        decimals = metadata.decimals
      }

      const balanceFormatted = formatUnits(balance, decimals)

      // Get price and logo from CoinGecko if available
      let priceUsd: number | undefined
      let usdValue: number | undefined
      let logoUrl: string | undefined
      
      if (tokenInfo.coingeckoId) {
        try {
          // Fetch price and logo in parallel
          const [priceResponse, logoUrlResult] = await Promise.all([
            fetch(
              `https://api.coingecko.com/api/v3/simple/price?ids=${tokenInfo.coingeckoId}&vs_currencies=usd`,
              { next: { revalidate: 60 } }
            ),
            getTokenLogoUrl(tokenInfo.coingeckoId),
          ])
          
          if (priceResponse.ok) {
            const priceData = await priceResponse.json()
            priceUsd = priceData[tokenInfo.coingeckoId]?.usd
            if (priceUsd) {
              usdValue = parseFloat(balanceFormatted) * priceUsd
            }
          }
          
          logoUrl = logoUrlResult
        } catch (error) {
          console.warn(`[RPC Assets] Failed to fetch price/logo for ${tokenInfo.symbol}:`, error)
        }
      }

      return {
        contractAddress: tokenInfo.address.toLowerCase(),
        symbol,
        name,
        decimals,
        balanceRaw: balance.toString(),
        balanceFormatted,
        priceUsd,
        usdValue,
        logoUrl,
        coingeckoId: tokenInfo.coingeckoId,
      } as RPCToken
    })

      const tokenResults = await Promise.all(tokenChecks)
      tokens = tokenResults.filter((token): token is RPCToken => token !== null)
      
      console.log('[RPC Assets] Popular tokens found:', {
        count: tokens.length,
        tokens: tokens.map((t) => ({ symbol: t.symbol, balance: t.balanceFormatted })),
      })
    } else {
      // SnowTrace returned tokens, but we can still check popular tokens for prices/metadata
      // Merge with popular tokens to get better metadata and prices
      const popularTokenMap = new Map(POPULAR_TOKENS.map(t => [t.address.toLowerCase(), t]))
      
      // Enhance SnowTrace tokens with metadata from popular tokens list
      tokens = tokens.map(token => {
        const popularToken = popularTokenMap.get(token.contractAddress)
        if (popularToken?.coingeckoId) {
          // Keep SnowTrace data but add coingeckoId for price fetching
          return { ...token, coingeckoId: popularToken.coingeckoId } as RPCToken
        }
        return token
      })
      
      // Collect all coingeckoIds for batch fetching
      const coingeckoIds = tokens
        .map(t => (t as RPCToken & { coingeckoId?: string }).coingeckoId)
        .filter((id): id is string => !!id)
      
      // Get addresses and symbols of tokens without coingeckoId (for logo lookup by address)
      const tokensWithoutId = tokens
        .filter(t => !(t as RPCToken & { coingeckoId?: string }).coingeckoId)
        .map(t => t.contractAddress)
      
      // Build symbol map for fallback search
      const symbolMap: Record<string, string> = {}
      for (const token of tokens) {
        if (!(token as RPCToken & { coingeckoId?: string }).coingeckoId) {
          symbolMap[token.contractAddress.toLowerCase()] = token.symbol
        }
      }
      
      // Pre-fetch token list in parallel with prices to speed up logo fetching
      // This ensures the token list is ready when we need to fetch logos by address
      const [pricesData, logosById, tokenListReady] = await Promise.all([
        // Fetch prices
        Promise.all(
          coingeckoIds.map(async (id) => {
            try {
              const priceResponse = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
                { next: { revalidate: 60 } }
              )
              if (priceResponse.ok) {
                const priceData = await priceResponse.json()
                return { id, price: priceData[id]?.usd }
              }
            } catch (error) {
              console.warn(`[RPC Assets] Failed to fetch price for ${id}:`, error)
            }
            return { id, price: undefined }
          })
        ),
        // Fetch logos by CoinGecko ID
        coingeckoIds.length > 0 ? getTokenLogos(coingeckoIds) : Promise.resolve({} as Record<string, string>),
        // Pre-fetch token list so address-based lookup is faster
        tokensWithoutId.length > 0 ? getAvalancheTokenList() : Promise.resolve(new Map<string, { id: string; logoUrl: string }>()),
      ])
      
      // Now fetch logos by address (token list is already cached)
      // Pass symbol map for fallback search if token not in cached list
      const logosByAddress = tokensWithoutId.length > 0 && tokenListReady.size > 0
        ? await getTokenLogosByAddresses(tokensWithoutId, symbolMap)
        : {} as Record<string, string>
      
      // Create maps for easy lookup
      const priceMap = new Map((pricesData as Array<{ id: string; price: number | undefined }>).map(p => [p.id, p.price]))
      
      // Apply prices and logos to tokens
      tokens = tokens.map(token => {
        const coingeckoId = (token as RPCToken & { coingeckoId?: string }).coingeckoId
        let priceUsd: number | undefined
        let logoUrl: string | undefined
        
        if (coingeckoId) {
          // Token has coingeckoId - use ID-based lookup
          priceUsd = priceMap.get(coingeckoId)
          logoUrl = (logosById as Record<string, string>)[coingeckoId]
        } else {
          // Token doesn't have coingeckoId - try address-based lookup
          logoUrl = logosByAddress[token.contractAddress.toLowerCase()]
        }
        
        return {
          ...token,
          priceUsd,
          usdValue: priceUsd ? parseFloat(token.balanceFormatted) * priceUsd : undefined,
          logoUrl,
        }
      })
    }

    console.log('[RPC Assets] Final tokens found:', {
      count: tokens.length,
      tokens: tokens.map((t) => ({ symbol: t.symbol, balance: t.balanceFormatted })),
    })

    // 4. Fetch NFTs from SnowTrace
    const nfts = await fetchNFTsFromSnowTrace(normalizedAddress)

    const duration = Date.now() - startTime
    console.log('[RPC Assets] Fetch completed:', {
      duration: `${duration}ms`,
      tokenCount: tokens.length,
      nftCount: nfts.length,
    })

    return {
      address: normalizedAddress,
      chainId: 43114,
      native: {
        symbol: 'AVAX',
        name: 'Avalanche',
        balanceWei: nativeBalance.toString(),
        balanceFormatted: nativeBalanceFormatted,
        usdValue: nativeUsdValue,
        priceUsd: avaxPrice > 0 ? avaxPrice : undefined,
        logoUrl: avaxLogoUrl || undefined, // Only use CoinGecko logo, no fallback
      },
      tokens,
      nfts,
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[RPC Assets] Error fetching assets:', error)
    throw error
  }
}
