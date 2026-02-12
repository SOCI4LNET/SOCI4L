import { createPublicClient, http, formatEther, formatUnits } from 'viem'
import { avalanche } from 'viem/chains'
import { fetchAccountNfts, OpenSeaNft } from '@/lib/opensea'
import { SNOWTRACE_API_KEY , SNOWTRACE_API_URL } from '@/lib/constants'

const AVALANCHE_RPC = process.env.NEXT_PUBLIC_AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc'
// const SNOWTRACE_API_KEY = process.env.SNOWTRACE_API_KEY || ''

export const avalancheClient = createPublicClient({
  chain: avalanche,
  transport: http(AVALANCHE_RPC),
})

export interface TokenBalance {
  contractAddress: string
  name: string
  symbol: string
  balance: string
  decimals: number
}

export interface NFT {
  contractAddress: string
  tokenId: string
  name?: string
  image?: string
}

export interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
  blockNumber: number
}

export interface WalletData {
  address: string
  nativeBalance: string
  tokenBalances: TokenBalance[]
  nfts: NFT[]
  transactions: Transaction[]
  txCount: number
  firstSeen?: number
  lastSeen?: number
}

// Simple in-memory cache (can be replaced with Redis in production)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 1 minute

function getCached<T>(key: string): T | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }
  return null
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

export async function getWalletData(address: string): Promise<WalletData> {
  const cacheKey = `wallet:${address.toLowerCase()}`
  const cached = getCached<WalletData>(cacheKey)
  if (cached) return cached

  try {
    // Get native balance
    const balance = await avalancheClient.getBalance({
      address: address as `0x${string}`,
    })
    const nativeBalance = formatEther(balance)

    // Get transaction count
    const txCount = await avalancheClient.getTransactionCount({
      address: address as `0x${string}`,
    })

    // Use Snowtrace API (works without API key in free tier, but with rate limits)
    let tokenBalances: TokenBalance[] = []
    let nfts: NFT[] = []
    let transactions: Transaction[] = []
    let firstSeen: number | undefined
    let lastSeen: number | undefined

    // Snowtrace API works without API key (free tier: 2 req/sec, 10k/day)
    // API key improves rate limits but is not required
    const apiKeyParam = SNOWTRACE_API_KEY ? `&apikey=${SNOWTRACE_API_KEY}` : ''

    {
      try {
        // Fetch token balances from Snowtrace using tokentx endpoint
        // Note: This calculates balances from transaction history, which may not be 100% accurate
        // For more accurate balances, use the tokenlist endpoint or RPC balanceOf calls
        const tokenResponse = await fetch(
          `${SNOWTRACE_API_URL}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=asc${apiKeyParam}`
        )
        const tokenData = await tokenResponse.json()

        if (tokenData.status === '1' && tokenData.result && Array.isArray(tokenData.result)) {
          // Process token transactions to get balances
          const tokenMap = new Map<string, { name: string; symbol: string; decimals: number; balance: bigint }>()

          for (const tx of tokenData.result) {
            const contract = (tx.contractAddress || '').toLowerCase()
            if (!contract) continue

            const decimals = parseInt(tx.tokenDecimal || '18')
            const value = BigInt(tx.value || '0')

            if (!tokenMap.has(contract)) {
              tokenMap.set(contract, {
                name: tx.tokenName || 'Unknown Token',
                symbol: tx.tokenSymbol || 'UNKNOWN',
                decimals,
                balance: BigInt(0),
              })
            }

            const entry = tokenMap.get(contract)!
            const normalizedAddress = address.toLowerCase()
            if (tx.to?.toLowerCase() === normalizedAddress) {
              entry.balance += value
            } else if (tx.from?.toLowerCase() === normalizedAddress) {
              entry.balance -= value
            }
          }

          tokenBalances = Array.from(tokenMap.entries())
            .filter(([_, data]) => data.balance > BigInt(0))
            .map(([contract, data]) => ({
              contractAddress: contract,
              name: data.name,
              symbol: data.symbol,
              balance: formatUnits(data.balance, data.decimals),
              decimals: data.decimals,
            }))

          console.log(`[Avalanche] Found ${tokenBalances.length} tokens with balance > 0 for address ${address}`)
        } else {
          console.warn('[Avalanche] Snowtrace API returned invalid token data:', tokenData)
        }

        // Fetch NFTs
        const hasOpenseaApiKey = !!process.env.OPENSEA_API_KEY

        if (hasOpenseaApiKey) {
          try {
            console.log(`[Avalanche] Fetching NFTs from OpenSea for ${address}`)
            // Default limit 50 for initial fetch
            // Use fetchAccountNfts from lib/opensea (type safe)
            const openseaData = await fetchAccountNfts('avalanche', address, 50)

            nfts = openseaData.nfts.map((nft: OpenSeaNft) => ({
              contractAddress: nft.contract,
              tokenId: nft.identifier,
              name: nft.name || undefined,
              image: nft.image_url || undefined,
            }))

            console.log(`[Avalanche] Found ${nfts.length} NFTs from OpenSea`)
          } catch (error) {
            console.error('[Avalanche] Error fetching NFTs from OpenSea:', error)
            // Fallback to Snowtrace will happen below if nfts is empty
          }
        }

        // Fallback to Snowtrace if no NFTs found yet (or OpenSea failed/not configured)
        if (nfts.length === 0) {
          try {
            const nftResponse = await fetch(
              `https://api.snowtrace.io/api?module=account&action=tokennfttx&address=${address}&startblock=0&endblock=99999999&sort=asc${apiKeyParam}`
            )
            const nftData = await nftResponse.json()

            if (nftData.status === '1' && nftData.result && Array.isArray(nftData.result)) {
              // Group NFTs by contract and tokenId to get unique NFTs
              // Track ownership by processing all transfers chronologically
              const nftMap = new Map<string, { contractAddress: string; tokenId: string; name?: string }>()
              const normalizedAddress = address.toLowerCase()

              // Process transfers in chronological order to determine current ownership
              const sortedTransfers = [...nftData.result].sort((a, b) => {
                const timeA = parseInt(a.timeStamp || '0')
                const timeB = parseInt(b.timeStamp || '0')
                return timeA - timeB
              })

              for (const tx of sortedTransfers) {
                const contract = (tx.contractAddress || '').toLowerCase()
                if (!contract) continue

                const tokenId = String(tx.tokenID || tx.tokenId || '')
                if (!tokenId) continue

                const key = `${contract}-${tokenId}`

                // If NFT was transferred TO this address, add it
                if (tx.to?.toLowerCase() === normalizedAddress) {
                  nftMap.set(key, {
                    contractAddress: contract,
                    tokenId: tokenId,
                    name: tx.tokenName || undefined,
                  })
                }
                // If NFT was transferred FROM this address, remove it
                else if (tx.from?.toLowerCase() === normalizedAddress) {
                  nftMap.delete(key)
                }
              }

              nfts = Array.from(nftMap.values())
              console.log(`[Avalanche] Found ${nfts.length} NFTs for address ${address}`)
            } else {
              console.warn('[Avalanche] Snowtrace API returned invalid NFT data:', nftData)
            }
          } catch (nftError) {
            console.error('[Avalanche] Error fetching NFTs from Snowtrace:', nftError)
          }
        }

        // Fetch normal transactions
        const txResponse = await fetch(
          `https://api.snowtrace.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc${apiKeyParam}`
        )
        const txData = await txResponse.json()

        if (txData.status === '1' && txData.result) {
          transactions = txData.result
            .slice(-20) // Last 20 transactions
            .map((tx: any) => ({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: formatEther(BigInt(tx.value || '0')),
              timestamp: parseInt(tx.timeStamp),
              blockNumber: parseInt(tx.blockNumber),
            }))

          if (txData.result.length > 0) {
            firstSeen = parseInt(txData.result[0].timeStamp) * 1000
            lastSeen = parseInt(txData.result[txData.result.length - 1].timeStamp) * 1000
          }
        }
      } catch (error) {
        console.error('[Avalanche] Error fetching from Snowtrace:', error)
        // Continue with empty arrays if API fails
      }
    }

    const walletData: WalletData = {
      address,
      nativeBalance,
      tokenBalances,
      nfts,
      transactions,
      txCount,
      firstSeen,
      lastSeen,
    }

    setCache(cacheKey, walletData)
    return walletData
  } catch (error) {
    console.error('Error fetching wallet data:', error)
    throw error
  }
}
