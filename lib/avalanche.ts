import { createPublicClient, http, formatEther, formatUnits } from 'viem'
import { avalanche } from 'viem/chains'
import { fetchAccountNfts, OpenSeaNft } from '@/lib/opensea'
import { SNOWTRACE_API_KEY, SNOWTRACE_API_URL } from '@/lib/constants'

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
  logo?: string
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

    const apiKeyParam = SNOWTRACE_API_KEY ? `&apikey=${SNOWTRACE_API_KEY}` : ''

    // Helper functions for concurrent fetching
    const fetchTokens = async () => {
      try {
        const res = await fetch(`${SNOWTRACE_API_URL}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=asc${apiKeyParam}`)
        const data = await res.json()
        if (data.status === '1' && data.result && Array.isArray(data.result)) {
          const tokenMap = new Map<string, { name: string; symbol: string; decimals: number; balance: bigint }>()
          for (const tx of data.result) {
            const contract = (tx.contractAddress || '').toLowerCase()
            if (!contract) continue
            const decimals = parseInt(tx.tokenDecimal || '18')
            const value = BigInt(tx.value || '0')
            if (!tokenMap.has(contract)) {
              tokenMap.set(contract, { name: tx.tokenName || 'Unknown Token', symbol: tx.tokenSymbol || 'UNKNOWN', decimals, balance: BigInt(0) })
            }
            const entry = tokenMap.get(contract)!
            const normalizedAddress = address.toLowerCase()
            if (tx.to?.toLowerCase() === normalizedAddress) {
              entry.balance += value
            } else if (tx.from?.toLowerCase() === normalizedAddress) {
              entry.balance -= value
            }
          }
          // Map of common Avalanche token contract addresses to their official logos
          const KNOWN_TOKENS: Record<string, string> = {
            '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e': 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png', // USDC
            '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664': 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png', // USDC.e
            '0x63a72806098bd3d9520cc43356dd78afe5d386d9': 'https://s2.coinmarketcap.com/static/img/coins/64x64/7278.png', // AAVE.e
            '0xd24c2ad096400b6fbcd2ad8b24e7acbc21a1da64': 'https://s2.coinmarketcap.com/static/img/coins/64x64/8592.png', // FRAX
            '0x1f8db11c97ab74895f32eb7a136bfb1e7c5bc08b': 'https://s2.coinmarketcap.com/static/img/coins/64x64/13444.png', // ALOT
            '0x5a15bdcf9a3abe117c925d4810815777bd4debbc': 'https://s2.coinmarketcap.com/static/img/coins/64x64/11092.png', // GAJ
            '0x260bbf5394921fac4ebbc62bade8a31e82bb2ac3': 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png', // BNB
            '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab': 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', // WETH.e
            '0x50b7545627a5162f82ba1f705b76fd6fe12df2cc': 'https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png', // WBTC.e
            '0xc7198437980c041c805a1edcba50c1ce5db95118': 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png', // USDT.e
            '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7': 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png', // USDT
            '0xd586e7f844cea2f87f50152665bcbc2c279d8d70': 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png', // DAI.e
          }

          const balances = Array.from(tokenMap.entries())
            .filter(([_, tData]) => tData.balance > BigInt(0))
            .map(([contract, tData]) => ({
              contractAddress: contract,
              name: tData.name,
              symbol: tData.symbol,
              balance: formatUnits(tData.balance, tData.decimals),
              decimals: tData.decimals,
              logo: KNOWN_TOKENS[contract] || undefined,
            }))
          console.log(`[Avalanche] Found ${balances.length} tokens for address ${address}`)
          return balances
        }
      } catch (error) {
        console.error('[Avalanche] Error fetching from Snowtrace Tokens:', error)
      }
      return []
    }

    const fetchNftsData = async () => {
      let fetchedNfts: NFT[] = []
      const hasOpenseaApiKey = !!process.env.OPENSEA_API_KEY

      if (hasOpenseaApiKey) {
        try {
          console.log(`[Avalanche] Fetching NFTs from OpenSea for ${address}`)
          const openseaData = await fetchAccountNfts('avalanche', address, 50)
          fetchedNfts = openseaData.nfts.map((nft: OpenSeaNft) => ({
            contractAddress: nft.contract,
            tokenId: nft.identifier,
            name: nft.name || undefined,
            image: nft.image_url || undefined,
          }))
          console.log(`[Avalanche] Found ${fetchedNfts.length} NFTs from OpenSea`)
        } catch (error) {
          console.error('[Avalanche] Error fetching NFTs from OpenSea:', error)
        }
      }

      if (fetchedNfts.length === 0) {
        try {
          const res = await fetch(`https://api.snowtrace.io/api?module=account&action=tokennfttx&address=${address}&startblock=0&endblock=99999999&sort=asc${apiKeyParam}`)
          const data = await res.json()
          if (data.status === '1' && data.result && Array.isArray(data.result)) {
            const nftMap = new Map<string, { contractAddress: string; tokenId: string; name?: string }>()
            const normalizedAddress = address.toLowerCase()
            const sortedTransfers = [...data.result].sort((a, b) => parseInt(a.timeStamp || '0') - parseInt(b.timeStamp || '0'))

            for (const tx of sortedTransfers) {
              const contract = (tx.contractAddress || '').toLowerCase()
              if (!contract) continue
              const tokenId = String(tx.tokenID || tx.tokenId || '')
              if (!tokenId) continue
              const key = `${contract}-${tokenId}`
              if (tx.to?.toLowerCase() === normalizedAddress) {
                nftMap.set(key, { contractAddress: contract, tokenId, name: tx.tokenName || undefined })
              } else if (tx.from?.toLowerCase() === normalizedAddress) {
                nftMap.delete(key)
              }
            }
            fetchedNfts = Array.from(nftMap.values())
            console.log(`[Avalanche] Found ${fetchedNfts.length} NFTs for address ${address}`)
          }
        } catch (error) {
          console.error('[Avalanche] Error fetching NFTs from Snowtrace:', error)
        }
      }
      return fetchedNfts
    }

    const fetchTxData = async () => {
      try {
        const res = await fetch(`https://api.snowtrace.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc${apiKeyParam}`)
        const data = await res.json()
        if (data.status === '1' && data.result) {
          const fetchedTransactions = data.result
            .slice(-20)
            .map((tx: any) => ({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: formatEther(BigInt(tx.value || '0')),
              timestamp: parseInt(tx.timeStamp),
              blockNumber: parseInt(tx.blockNumber),
            }))

          let fSeen, lSeen
          if (data.result.length > 0) {
            fSeen = parseInt(data.result[0].timeStamp) * 1000
            lSeen = parseInt(data.result[data.result.length - 1].timeStamp) * 1000
          }
          return { transactions: fetchedTransactions, firstSeen: fSeen, lastSeen: lSeen }
        }
      } catch (error) {
        console.error('[Avalanche] Error fetching from Snowtrace TXs:', error)
      }
      return { transactions: [], firstSeen: undefined, lastSeen: undefined }
    }

    // Execute all external API calls concurrently
    const [tokensResult, nftsResult, txsResult] = await Promise.allSettled([
      fetchTokens(),
      fetchNftsData(),
      fetchTxData()
    ])

    if (tokensResult.status === 'fulfilled') tokenBalances = tokensResult.value
    if (nftsResult.status === 'fulfilled') nfts = nftsResult.value
    if (txsResult.status === 'fulfilled') {
      transactions = txsResult.value.transactions
      firstSeen = txsResult.value.firstSeen
      lastSeen = txsResult.value.lastSeen
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
