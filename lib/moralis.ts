/**
 * Moralis API integration for Avalanche C-Chain
 * 
 * This module provides functions to fetch token balances, NFTs, and native AVAX balance
 * from Moralis API for Avalanche C-Chain (chainId: 43114)
 * 
 * Environment Variables:
 * - MORALIS_API_KEY: Your Moralis API key (get FREE tier at https://moralis.io/)
 *   Free tier: 40,000 Compute Units/day, unlimited duration - NO trial!
 * 
 * Usage:
 * ```ts
 * const assets = await fetchAssetsFromMoralis('0x...')
 * ```
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY || ''
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2'
const AVALANCHE_CHAIN_ID = '0xa86a' // Avalanche C-Chain in hex (43114)

export interface MoralisToken {
  contractAddress: string
  symbol: string
  name: string
  decimals: number
  balanceRaw: string
  balanceFormatted: string
  logoUrl?: string
  usdValue?: number
  priceUsd?: number
}

export interface MoralisNFT {
  contractAddress: string
  tokenId: string
  name?: string
  imageUrl?: string
  collectionName?: string
}

export interface MoralisNativeBalance {
  symbol: string
  balanceWei: string
  balanceFormatted: string
  usdValue?: number
  priceUsd?: number
  logoUrl?: string
}

export interface MoralisAssetsResponse {
  address: string
  chainId: number
  native: MoralisNativeBalance
  tokens: MoralisToken[]
  nfts: MoralisNFT[]
  updatedAt: string
}

/**
 * Fetches all assets (native AVAX, ERC-20 tokens, NFTs) for an address
 */
export async function fetchAssetsFromMoralis(
  address: string
): Promise<MoralisAssetsResponse> {
  const normalizedAddress = address.toLowerCase()

  console.log('[Moralis] Fetching assets for:', {
    address: normalizedAddress,
    chainId: AVALANCHE_CHAIN_ID,
    hasApiKey: !!MORALIS_API_KEY,
  })

  if (!MORALIS_API_KEY) {
    console.warn('[Moralis] No API key found. Set MORALIS_API_KEY in .env')
    throw new Error('MORALIS_API_KEY environment variable is not set')
  }

  try {
    // Fetch native balance
    const nativeBalanceUrl = `${MORALIS_BASE_URL}/${normalizedAddress}/balance?chain=${AVALANCHE_CHAIN_ID}`
    console.log('[Moralis] Fetching native balance from:', nativeBalanceUrl.replace(MORALIS_API_KEY, '***'))

    const nativeResponse = await fetch(nativeBalanceUrl, {
      headers: {
        'Accept': 'application/json',
        'X-API-Key': MORALIS_API_KEY,
      },
    })

    if (!nativeResponse.ok) {
      const errorText = await nativeResponse.text()
      console.error('[Moralis] Native balance API error:', {
        status: nativeResponse.status,
        statusText: nativeResponse.statusText,
        body: errorText,
      })
      throw new Error(`Moralis API error: ${nativeResponse.status} ${nativeResponse.statusText}`)
    }

    const nativeData = await nativeResponse.json()
    const nativeBalanceWei = nativeData.balance || '0'
    const nativeBalanceFormatted = formatBalance(nativeBalanceWei, 18)

    console.log('[Moralis] Native balance:', {
      balanceWei: nativeBalanceWei,
      balanceFormatted: nativeBalanceFormatted,
    })

    // Note: Moralis doesn't provide native token price in balance endpoint
    // We'll fetch it from CoinGecko in the API route

    // Fetch token balances
    const tokensUrl = `${MORALIS_BASE_URL}/${normalizedAddress}/erc20?chain=${AVALANCHE_CHAIN_ID}`
    console.log('[Moralis] Fetching tokens from:', tokensUrl.replace(MORALIS_API_KEY, '***'))

    const tokensResponse = await fetch(tokensUrl, {
      headers: {
        'Accept': 'application/json',
        'X-API-Key': MORALIS_API_KEY,
      },
    })

    let tokens: MoralisToken[] = []
    if (tokensResponse.ok) {
      const tokensData = await tokensResponse.json()
      console.log('[Moralis] Tokens response:', {
        count: tokensData?.length || 0,
      })

      tokens = (tokensData || [])
        .filter((token: any) => {
          // Only include tokens with balance > 0
          const balance = BigInt(token.balance || '0')
          return balance > 0n
        })
        .map((token: any) => {
          const balanceRaw = token.balance || '0'
          const decimals = parseInt(token.decimals || '18')
          const balanceFormatted = formatBalance(balanceRaw, decimals)

          return {
            contractAddress: token.token_address.toLowerCase(),
            symbol: token.symbol || 'UNKNOWN',
            name: token.name || 'Unknown Token',
            decimals,
            balanceRaw,
            balanceFormatted,
            logoUrl: token.logo,
            priceUsd: token.usd_price,
            usdValue: token.usd_price ? parseFloat(balanceFormatted) * token.usd_price : undefined,
          }
        })

      console.log('[Moralis] Processed tokens:', {
        count: tokens.length,
        tokens: tokens.map((t) => ({ symbol: t.symbol, balance: t.balanceFormatted })),
      })
    } else {
      console.warn('[Moralis] Tokens API returned non-OK status:', tokensResponse.status)
    }

    // Fetch NFTs
    const nftsUrl = `${MORALIS_BASE_URL}/${normalizedAddress}/nft?chain=${AVALANCHE_CHAIN_ID}&format=decimal`
    console.log('[Moralis] Fetching NFTs from:', nftsUrl.replace(MORALIS_API_KEY, '***'))

    let nfts: MoralisNFT[] = []
    try {
      const nftsResponse = await fetch(nftsUrl, {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': MORALIS_API_KEY,
        },
      })

      if (nftsResponse.ok) {
        const nftsData = await nftsResponse.json()
        if (nftsData.result && Array.isArray(nftsData.result)) {
          nfts = nftsData.result
            .filter((nft: any) => nft.token_id !== null && nft.token_id !== undefined)
            .map((nft: any) => ({
              contractAddress: nft.token_address.toLowerCase(),
              tokenId: nft.token_id.toString(),
              name: nft.name || nft.token_id?.toString() || undefined,
              imageUrl: nft.token_uri || nft.metadata?.image,
              collectionName: nft.name?.split('#')[0] || undefined,
            }))

          console.log('[Moralis] NFTs found:', {
            count: nfts.length,
          })
        }
      } else {
        console.warn('[Moralis] NFTs API returned non-OK status:', nftsResponse.status)
      }
    } catch (nftError) {
      console.warn('[Moralis] Error fetching NFTs (non-critical):', nftError)
      // NFTs are optional, so we don't throw
    }

    const result: MoralisAssetsResponse = {
      address: normalizedAddress,
      chainId: 43114,
      native: {
        symbol: 'AVAX',
        balanceWei: nativeBalanceWei,
        balanceFormatted: nativeBalanceFormatted,
        logoUrl: '/tokens/avax.svg', // Local logo path
      },
      tokens,
      nfts,
      updatedAt: new Date().toISOString(),
    }

    console.log('[Moralis] Final result:', {
      address: result.address,
      chainId: result.chainId,
      nativeBalance: result.native.balanceFormatted,
      tokenCount: result.tokens.length,
      nftCount: result.nfts.length,
    })

    return result
  } catch (error) {
    console.error('[Moralis] Error fetching assets:', error)
    throw error
  }
}

/**
 * Formats a balance string (wei) to human-readable format
 */
function formatBalance(balanceWei: string, decimals: number): string {
  try {
    const balance = BigInt(balanceWei)
    if (balance === 0n) return '0'

    const divisor = BigInt(10 ** decimals)
    const wholePart = balance / divisor
    const fractionalPart = balance % divisor

    if (fractionalPart === 0n) {
      return wholePart.toString()
    }

    // Format fractional part with proper padding
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
    // Remove trailing zeros
    const trimmedFractional = fractionalStr.replace(/0+$/, '')
    
    if (trimmedFractional === '') {
      return wholePart.toString()
    }

    // Limit to 6 decimal places for display
    const displayDecimals = Math.min(6, decimals)
    const displayFractional = trimmedFractional.slice(0, displayDecimals)
    
    return `${wholePart}.${displayFractional}`
  } catch (error) {
    console.error('[Moralis] Error formatting balance:', error, { balanceWei, decimals })
    return '0'
  }
}
