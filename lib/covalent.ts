/**
 * Covalent API integration for Avalanche C-Chain
 * 
 * This module provides functions to fetch token balances, NFTs, and native AVAX balance
 * from Covalent API for Avalanche C-Chain (chainId: 43114)
 * 
 * Environment Variables:
 * - COVALENT_API_KEY: Your Covalent API key (get FREE tier at https://www.covalenthq.com/platform/auth/register/)
 *   Free tier: 100,000 credits/month, 4 RPS - NO GoldRush subscription needed!
 * 
 * Usage:
 * ```ts
 * const assets = await fetchAssetsFromCovalent('0x...')
 * ```
 */

const COVALENT_API_KEY = process.env.COVALENT_API_KEY || ''
const COVALENT_BASE_URL = 'https://api.covalenthq.com/v1'
const AVALANCHE_CHAIN_ID = 43114 // Avalanche C-Chain

export interface CovalentToken {
  contractAddress: string
  symbol: string
  name: string
  decimals: number
  balanceRaw: string // Raw balance as string (BigInt compatible)
  balanceFormatted: string // Human-readable balance
  logoUrl?: string
  usdValue?: number
  priceUsd?: number
}

export interface CovalentNFT {
  contractAddress: string
  tokenId: string
  name?: string
  imageUrl?: string
  collectionName?: string
}

export interface CovalentNativeBalance {
  symbol: string
  balanceWei: string
  balanceFormatted: string
}

export interface CovalentAssetsResponse {
  address: string
  chainId: number
  native: CovalentNativeBalance
  tokens: CovalentToken[]
  nfts: CovalentNFT[]
  updatedAt: string
}

/**
 * Fetches all assets (native AVAX, ERC-20 tokens, NFTs) for an address
 */
export async function fetchAssetsFromCovalent(
  address: string
): Promise<CovalentAssetsResponse> {
  const normalizedAddress = address.toLowerCase()
  const chainId = AVALANCHE_CHAIN_ID

  console.log('[Covalent] Fetching assets for:', {
    address: normalizedAddress,
    chainId,
    hasApiKey: !!COVALENT_API_KEY,
  })

  if (!COVALENT_API_KEY) {
    console.warn('[Covalent] No API key found. Set COVALENT_API_KEY in .env')
    throw new Error('COVALENT_API_KEY environment variable is not set')
  }

  try {
    // Fetch token balances (includes native AVAX)
    const balancesUrl = `${COVALENT_BASE_URL}/${chainId}/address/${normalizedAddress}/balances_v2/?nft=false&key=${COVALENT_API_KEY}`
    console.log('[Covalent] Fetching balances from:', balancesUrl.replace(COVALENT_API_KEY, '***'))

    const balancesResponse = await fetch(balancesUrl, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!balancesResponse.ok) {
      const errorText = await balancesResponse.text()
      console.error('[Covalent] Balances API error:', {
        status: balancesResponse.status,
        statusText: balancesResponse.statusText,
        body: errorText,
      })
      throw new Error(`Covalent API error: ${balancesResponse.status} ${balancesResponse.statusText}`)
    }

    const balancesData = await balancesResponse.json()
    console.log('[Covalent] Balances response:', {
      status: balancesData.error === false,
      items: balancesData.data?.items?.length || 0,
      error: balancesData.error_message,
    })

    if (balancesData.error === true) {
      throw new Error(balancesData.error_message || 'Covalent API returned an error')
    }

    const items = balancesData.data?.items || []
    
    console.log('[Covalent] Raw items from API:', {
      totalItems: items.length,
      sampleItem: items[0] ? {
        contract_address: items[0].contract_address,
        contract_ticker_symbol: items[0].contract_ticker_symbol,
        type: items[0].type,
        balance: items[0].balance,
      } : null,
    })

    // Extract native AVAX balance
    // Covalent returns native token with contract_address as null, empty string, or sometimes as a special value
    const nativeItem = items.find((item: any) => {
      const addr = item.contract_address
      // Native token can be: null, empty string, or sometimes "0x0000000000000000000000000000000000000000"
      return !addr || addr === '' || addr === '0x0000000000000000000000000000000000000000' || item.type === 'native'
    })
    
    console.log('[Covalent] Native item found:', {
      found: !!nativeItem,
      contract_address: nativeItem?.contract_address,
      symbol: nativeItem?.contract_ticker_symbol,
      balance: nativeItem?.balance,
    })
    
    const nativeBalance: CovalentNativeBalance = nativeItem
      ? {
          symbol: nativeItem.contract_ticker_symbol || 'AVAX',
          balanceWei: nativeItem.balance || '0',
          balanceFormatted: formatBalance(nativeItem.balance || '0', nativeItem.contract_decimals || 18),
        }
      : {
          symbol: 'AVAX',
          balanceWei: '0',
          balanceFormatted: '0',
        }

    console.log('[Covalent] Native balance:', {
      symbol: nativeBalance.symbol,
      balanceWei: nativeBalance.balanceWei,
      balanceFormatted: nativeBalance.balanceFormatted,
    })

    // Extract ERC-20 tokens (filter out native and zero balances)
    const tokens: CovalentToken[] = items
      .filter((item: any) => {
        // Exclude native token
        if (!item.contract_address || item.contract_address === '') return false
        // Only include tokens with balance > 0
        const balance = BigInt(item.balance || '0')
        return balance > 0n
      })
      .map((item: any) => {
        const balanceRaw = item.balance || '0'
        const decimals = item.contract_decimals || 18
        const balanceFormatted = formatBalance(balanceRaw, decimals)

        return {
          contractAddress: item.contract_address.toLowerCase(),
          symbol: item.contract_ticker_symbol || 'UNKNOWN',
          name: item.contract_name || 'Unknown Token',
          decimals,
          balanceRaw,
          balanceFormatted,
          logoUrl: item.logo_url,
          priceUsd: item.quote_rate,
          usdValue: item.quote,
        }
      })

    console.log('[Covalent] Tokens found:', {
      count: tokens.length,
      tokens: tokens.map((t) => ({ symbol: t.symbol, balance: t.balanceFormatted })),
    })

    // Fetch NFTs
    const nftsUrl = `${COVALENT_BASE_URL}/${chainId}/address/${normalizedAddress}/balances_v2/?nft=true&key=${COVALENT_API_KEY}`
    console.log('[Covalent] Fetching NFTs from:', nftsUrl.replace(COVALENT_API_KEY, '***'))

    let nfts: CovalentNFT[] = []
    try {
      const nftsResponse = await fetch(nftsUrl, {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (nftsResponse.ok) {
        const nftsData = await nftsResponse.json()
        if (nftsData.error === false && nftsData.data?.items) {
          nfts = nftsData.data.items
            .filter((item: any) => item.type === 'nft' && item.nft_data && item.nft_data.length > 0)
            .flatMap((item: any) =>
              item.nft_data.map((nft: any) => ({
                contractAddress: item.contract_address.toLowerCase(),
                tokenId: nft.token_id || '',
                name: nft.external_data?.name || nft.token_id || undefined,
                imageUrl: nft.external_data?.image || nft.external_data?.image_256,
                collectionName: item.contract_name,
              }))
            )

          console.log('[Covalent] NFTs found:', {
            count: nfts.length,
          })
        }
      } else {
        console.warn('[Covalent] NFTs API returned non-OK status:', nftsResponse.status)
      }
    } catch (nftError) {
      console.warn('[Covalent] Error fetching NFTs (non-critical):', nftError)
      // NFTs are optional, so we don't throw
    }

    const result: CovalentAssetsResponse = {
      address: normalizedAddress,
      chainId,
      native: nativeBalance,
      tokens,
      nfts,
      updatedAt: new Date().toISOString(),
    }

    console.log('[Covalent] Final result:', {
      address: result.address,
      chainId: result.chainId,
      nativeBalance: result.native.balanceFormatted,
      tokenCount: result.tokens.length,
      nftCount: result.nfts.length,
    })

    return result
  } catch (error) {
    console.error('[Covalent] Error fetching assets:', error)
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
    console.error('[Covalent] Error formatting balance:', error, { balanceWei, decimals })
    return '0'
  }
}
