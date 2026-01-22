import { createPublicClient, http, formatEther, formatUnits } from 'viem'
import { avalanche } from 'viem/chains'

const AVALANCHE_RPC = process.env.NEXT_PUBLIC_AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc'
const SNOWTRACE_API_KEY = process.env.SNOWTRACE_API_KEY || ''

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

    // Use Snowtrace API if available, otherwise use basic RPC calls
    let tokenBalances: TokenBalance[] = []
    let nfts: NFT[] = []
    let transactions: Transaction[] = []
    let firstSeen: number | undefined
    let lastSeen: number | undefined

    if (SNOWTRACE_API_KEY) {
      try {
        // Fetch token balances from Snowtrace
        const tokenResponse = await fetch(
          `https://api.snowtrace.io/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${SNOWTRACE_API_KEY}`
        )
        const tokenData = await tokenResponse.json()
        
        if (tokenData.status === '1' && tokenData.result) {
          // Process token transactions to get balances
          const tokenMap = new Map<string, { name: string; symbol: string; decimals: number; balance: bigint }>()
          
          for (const tx of tokenData.result) {
            const contract = tx.contractAddress.toLowerCase()
            const decimals = parseInt(tx.tokenDecimal || '18')
            const value = BigInt(tx.value || '0')
            
            if (!tokenMap.has(contract)) {
              tokenMap.set(contract, {
                name: tx.tokenName || 'Unknown',
                symbol: tx.tokenSymbol || 'UNKNOWN',
                decimals,
                balance: BigInt(0),
              })
            }
            
            const entry = tokenMap.get(contract)!
            if (tx.to?.toLowerCase() === address.toLowerCase()) {
              entry.balance += value
            } else if (tx.from?.toLowerCase() === address.toLowerCase()) {
              entry.balance -= value
            }
          }
          
          tokenBalances = Array.from(tokenMap.entries())
            .filter(([_, data]) => data.balance > 0)
            .map(([contract, data]) => ({
              contractAddress: contract,
              name: data.name,
              symbol: data.symbol,
              balance: formatUnits(data.balance, data.decimals),
              decimals: data.decimals,
            }))
        }

        // Fetch normal transactions
        const txResponse = await fetch(
          `https://api.snowtrace.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${SNOWTRACE_API_KEY}`
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
        console.error('Error fetching from Snowtrace:', error)
      }
    }

    // If no API key, we can still get basic data from RPC
    if (!SNOWTRACE_API_KEY) {
      // Get recent transactions (limited without API)
      // This is a simplified version - in production you'd want to use an indexing service
      transactions = []
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
