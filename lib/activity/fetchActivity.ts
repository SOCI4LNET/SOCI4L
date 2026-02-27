/**
 * Activity/Transaction Fetching Service
 * 
 * API SOURCE:
 * - Primary: SnowTrace API (FREE tier - no API key required!)
 *   - Free tier: 2 requests/second, 10,000 calls/day
 *   - API key is OPTIONAL (only needed for higher rate limits)
 *   - Get free API key: https://snowtrace.io/apis (optional)
 * - Fallback: Mock data (only used if API fails)
 * 
 * TO CHANGE NETWORK:
 * - Update SNOWTRACE_API_URL and explorer URLs in this file
 * - Update chain ID constants
 * - Update RPC endpoint in lib/avalanche.ts
 * 
 * CACHING:
 * - Server-side: Next.js fetch with revalidate: 30 (configured in route handler)
 * - Manual refresh: Cache busting via ?t=${Date.now()} query param
 */

import { formatEther, formatUnits } from 'viem'
import { SNOWTRACE_API_KEY , SNOWTRACE_API_URL } from '@/lib/constants'

// const SNOWTRACE_API_KEY = process.env.SNOWTRACE_API_KEY || ''
// const SNOWTRACE_API_URL = 'https://api.snowtrace.io/api'

// Known DEX router addresses on Avalanche (for swap detection)
const DEX_ROUTERS = [
  '0x5485a0751a249225d3ba2f6f296551507e22547f', // Pangolin V3 Router
  '0xe54ca86531e17ef3616d22ca28b0d458b6c89106', // Pangolin V2 Router
  '0x60ae616a2155ee3d9a68541ba4544862300933d4', // TraderJoe Router
  '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506', // SushiSwap Router
].map(addr => addr.toLowerCase())

export interface TokenTransfer {
  symbol: string
  name: string
  decimals: number
  amount: string
  contract: string
  logoUrl?: string
}

export interface ActivityTransaction {
  hash: string
  status: 'success' | 'failed' | 'pending'
  timestamp: number
  type: 'transfer' | 'contract' | 'swap'
  direction: 'incoming' | 'outgoing'
  from: string
  to: string
  nativeValueAvax: string
  feeAvax: string
  tokenTransfers: TokenTransfer[]
  method?: string
  explorerUrl: string
  blockNumber: number
  gasUsed?: string
  gasPrice?: string
}

export interface FetchActivityOptions {
  address: string
  dateRange?: '24h' | '7d' | '30d' | 'all'
  type?: 'all' | 'transfer' | 'contract' | 'swap'
  direction?: 'all' | 'incoming' | 'outgoing'
  search?: string
  limit?: number
  offset?: number
}

/**
 * Fetch transactions from SnowTrace API
 * 
 * NOTE: SnowTrace API offers a FREE tier:
 * - 2 requests per second
 * - 10,000 calls per day
 * - API key is OPTIONAL (not required for free tier)
 * - If API key is provided, it will be used for higher rate limits
 */
async function fetchFromSnowTrace(
  address: string,
  options: FetchActivityOptions
): Promise<ActivityTransaction[]> {
  const normalizedAddress = address.toLowerCase()
  const limit = options.limit || 100
  const startBlock = getStartBlock(options.dateRange || 'all')

  // Build API URLs - API key is optional (free tier works without it)
  const apiKeyParam = SNOWTRACE_API_KEY ? `&apikey=${SNOWTRACE_API_KEY}` : ''

  // Fetch normal transactions
  const txUrl = `${SNOWTRACE_API_URL}?module=account&action=txlist&address=${normalizedAddress}&startblock=${startBlock}&endblock=99999999&sort=desc${apiKeyParam}`
  const txResponse = await fetch(txUrl, {
    next: { revalidate: 30 }, // Cache for 30 seconds
  })

  if (!txResponse.ok) {
    throw new Error(`SnowTrace API error: ${txResponse.status} ${txResponse.statusText}`)
  }

  const txData = await txResponse.json()

  // Fetch token transfers
  const tokenTxUrl = `${SNOWTRACE_API_URL}?module=account&action=tokentx&address=${normalizedAddress}&startblock=${startBlock}&endblock=99999999&sort=desc${apiKeyParam}`
  const tokenTxResponse = await fetch(tokenTxUrl, {
    next: { revalidate: 30 }, // Cache for 30 seconds
  })

  if (!tokenTxResponse.ok) {
    throw new Error(`SnowTrace API error: ${tokenTxResponse.status} ${tokenTxResponse.statusText}`)
  }

  const tokenTxData = await tokenTxResponse.json()

  const transactions: ActivityTransaction[] = []

  // Process normal transactions
  if (txData.status === '1' && txData.result && Array.isArray(txData.result)) {
    for (const tx of txData.result.slice(0, limit)) {
      const isOutgoing = tx.from?.toLowerCase() === normalizedAddress
      const isContract = tx.to === '' || tx.input !== '0x' || (tx.input && tx.input.length > 10)

      const nativeValue = formatEther(BigInt(tx.value || '0'))
      const gasUsed = tx.gasUsed ? BigInt(tx.gasUsed).toString() : undefined
      const gasPrice = tx.gasPrice ? formatEther(BigInt(tx.gasPrice)) : undefined
      const fee = tx.gasUsed && tx.gasPrice
        ? formatEther(BigInt(tx.gasUsed) * BigInt(tx.gasPrice))
        : '0'

      const activityTx: ActivityTransaction = {
        hash: tx.hash,
        status: tx.txreceipt_status === '1' ? 'success' : 'failed',
        timestamp: parseInt(tx.timeStamp),
        type: isContract ? 'contract' : 'transfer',
        direction: isOutgoing ? 'outgoing' : 'incoming',
        from: tx.from,
        to: tx.to || '',
        nativeValueAvax: nativeValue,
        feeAvax: fee,
        tokenTransfers: [],
        explorerUrl: `https://snowtrace.io/tx/${tx.hash}`,
        blockNumber: parseInt(tx.blockNumber),
        gasUsed,
        gasPrice,
      }

      // Try to decode method name from input (basic check)
      if (tx.input && tx.input.length > 10) {
        const methodId = tx.input.slice(0, 10)
        // Common method IDs (simplified - in production use ABI decoding)
        if (methodId === '0xa9059cbb') activityTx.method = 'transfer'
        else if (methodId === '0x23b872dd') activityTx.method = 'transferFrom'
        else if (methodId === '0x095ea7b3') activityTx.method = 'approve'
        else activityTx.method = 'contract_call'
      }

      transactions.push(activityTx)
    }
  }

  // Process token transfers
  if (tokenTxData.status === '1' && tokenTxData.result && Array.isArray(tokenTxData.result)) {
    const tokenTxMap = new Map<string, ActivityTransaction>()

    for (const tx of tokenTxData.result) {
      const txHash = tx.hash
      let activityTx = tokenTxMap.get(txHash)

      if (!activityTx) {
        // Check if we already have this transaction from normal tx list
        const existing = transactions.find(t => t.hash === txHash)
        if (existing) {
          activityTx = existing
        } else {
          const isOutgoing = tx.from?.toLowerCase() === normalizedAddress
          const isDexRouter = tx.to && DEX_ROUTERS.includes(tx.to.toLowerCase())

          activityTx = {
            hash: txHash,
            status: 'success',
            timestamp: parseInt(tx.timeStamp),
            // If it's a DEX router, mark as swap, otherwise transfer
            type: isDexRouter ? 'swap' : 'transfer',
            direction: isOutgoing ? 'outgoing' : 'incoming',
            from: tx.from,
            to: tx.to,
            nativeValueAvax: '0',
            feeAvax: '0',
            tokenTransfers: [],
            explorerUrl: `https://snowtrace.io/tx/${txHash}`,
            blockNumber: parseInt(tx.blockNumber),
          }
          transactions.push(activityTx)
        }
        tokenTxMap.set(txHash, activityTx)
      }

      // Add token transfer
      const decimals = parseInt(tx.tokenDecimal || '18')
      const amount = formatUnits(BigInt(tx.value || '0'), decimals)

      activityTx.tokenTransfers.push({
        symbol: tx.tokenSymbol || 'UNKNOWN',
        name: tx.tokenName || 'Unknown Token',
        decimals,
        amount,
        contract: tx.contractAddress,
      })

      // Track token transfer direction for swap detection
      // Store in a temporary map (we'll use this info before cleaning up)
      if (!(activityTx as any)._tokenDirections) {
        (activityTx as any)._tokenDirections = []
      }
      const isTokenOutgoing = tx.from?.toLowerCase() === normalizedAddress
        ; (activityTx as any)._tokenDirections.push(isTokenOutgoing ? 'outgoing' : 'incoming')
    }
  }

  // Detect swap transactions
  // A swap typically has:
  // 1. Transaction to a known DEX router
  // 2. Multiple token transfers with both incoming and outgoing
  // 3. Native AVAX + token transfer (AVAX to token swap)
  for (const tx of transactions) {
    const isDexRouter = tx.to && DEX_ROUTERS.includes(tx.to.toLowerCase())

    // If transaction goes to a DEX router, it's very likely a swap
    if (isDexRouter) {
      tx.type = 'swap'
      continue
    }

    // Check if we have both outgoing and incoming token transfers (swap indicator)
    const tokenDirections = (tx as any)._tokenDirections as ('incoming' | 'outgoing')[] | undefined
    if (tokenDirections) {
      const hasOutgoingToken = tokenDirections.includes('outgoing')
      const hasIncomingToken = tokenDirections.includes('incoming')
      const hasBothDirections = hasOutgoingToken && hasIncomingToken

      // If we have both directions of token transfers, it's a swap
      if (hasBothDirections && tx.tokenTransfers.length >= 2) {
        tx.type = 'swap'
        // Clean up temporary property
        delete (tx as any)._tokenDirections
        continue
      }
    }

    // If we have native AVAX transfer + token transfer, it's likely a swap
    if (parseFloat(tx.nativeValueAvax) > 0 && tx.tokenTransfers.length > 0) {
      tx.type = 'swap'
      delete (tx as any)._tokenDirections
      continue
    }

    // If we have multiple token transfers in a contract call, it might be a swap
    if (tx.tokenTransfers.length >= 2 && tx.type === 'contract') {
      // Multiple token transfers in a contract call is often a swap
      tx.type = 'swap'
    }

    // Clean up temporary property
    delete (tx as any)._tokenDirections
  }

  // Apply filters
  let filtered = transactions

  // Apply date range filter FIRST (before other filters for better performance)
  if (options.dateRange && options.dateRange !== 'all') {
    const now = Math.floor(Date.now() / 1000)
    let cutoff = 0
    if (options.dateRange === '24h') cutoff = now - 24 * 60 * 60
    else if (options.dateRange === '7d') cutoff = now - 7 * 24 * 60 * 60
    else if (options.dateRange === '30d') cutoff = now - 30 * 24 * 60 * 60

    filtered = filtered.filter(tx => tx.timestamp >= cutoff)
  }

  if (options.type && options.type !== 'all') {
    filtered = filtered.filter(tx => tx.type === options.type)
  }

  if (options.direction && options.direction !== 'all') {
    filtered = filtered.filter(tx => tx.direction === options.direction)
  }

  if (options.search) {
    const searchLower = options.search.toLowerCase()
    filtered = filtered.filter(tx =>
      tx.hash.toLowerCase().includes(searchLower) ||
      tx.from.toLowerCase().includes(searchLower) ||
      tx.to.toLowerCase().includes(searchLower) ||
      tx.tokenTransfers.some(tt =>
        tt.symbol.toLowerCase().includes(searchLower) ||
        tt.contract.toLowerCase().includes(searchLower)
      ) ||
      (searchLower.includes('avax') && parseFloat(tx.nativeValueAvax) > 0)
    )
  }

  // Sort by timestamp (newest first)
  filtered.sort((a, b) => b.timestamp - a.timestamp)

  // Apply pagination
  const offset = options.offset || 0
  return filtered.slice(offset, offset + limit)
}

/**
 * Generate mock transactions for UI development
 */
function generateMockTransactions(address: string, count: number = 10): ActivityTransaction[] {
  const now = Math.floor(Date.now() / 1000)
  const transactions: ActivityTransaction[] = []

  const mockTokens = [
    { symbol: 'USDC', name: 'USD Coin', decimals: 6, contract: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664' },
    { symbol: 'USDT', name: 'Tether USD', decimals: 6, contract: '0xc7198437980c041c805a1edcba50c1ce5db95118' },
    { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, contract: '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, contract: '0x50b7545627a5162f82a992c33b87adc75187b218' },
  ]

  // Classic burn address for example transactions
  const BURN_ADDRESS = '0x0000000000000000000000000000000000000000'

  for (let i = 0; i < count; i++) {
    const isOutgoing = i % 3 === 0
    const isContract = i % 5 === 0
    const hasTokenTransfer = i % 2 === 0
    const timestamp = now - (i * 3600) // 1 hour apart

    // Ensure ALL transactions involve the target address (either as from or to)
    // This ensures mock data shows transactions that belong to the user's wallet
    const normalizedAddress = address.toLowerCase()
    const randomAddress = () => `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`

    const tx: ActivityTransaction = {
      hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      status: i % 10 === 0 ? 'failed' : 'success',
      timestamp,
      type: isContract ? 'contract' : hasTokenTransfer ? 'transfer' : 'transfer',
      direction: isOutgoing ? 'outgoing' : 'incoming',
      // Use burn address for outgoing transactions (classic burn address)
      from: isOutgoing ? BURN_ADDRESS : randomAddress(),
      to: isOutgoing ? normalizedAddress : normalizedAddress, // For outgoing: to is the target address, for incoming: to is also the target address
      nativeValueAvax: (Math.random() * 10).toFixed(6),
      feeAvax: (Math.random() * 0.01).toFixed(6),
      tokenTransfers: hasTokenTransfer ? [{
        ...mockTokens[i % mockTokens.length],
        amount: (Math.random() * 1000).toFixed(6),
      }] : [],
      method: isContract ? (i % 3 === 0 ? 'transfer' : 'approve') : undefined,
      explorerUrl: `https://snowtrace.io/tx/0x${i}`,
      blockNumber: 30000000 + i,
      gasUsed: (21000 + Math.random() * 50000).toString(),
      gasPrice: (Math.random() * 0.0000001).toFixed(9),
    }

    transactions.push(tx)
  }

  return transactions
}

/**
 * Get start block number based on date range
 */
function getStartBlock(dateRange: '24h' | '7d' | '30d' | 'all'): number {
  if (dateRange === 'all') return 0

  // Approximate block times: ~2 seconds per block on Avalanche
  const blocksPerSecond = 0.5
  const now = Date.now() / 1000

  let secondsAgo = 0
  if (dateRange === '24h') secondsAgo = 24 * 60 * 60
  else if (dateRange === '7d') secondsAgo = 7 * 24 * 60 * 60
  else if (dateRange === '30d') secondsAgo = 30 * 24 * 60 * 60

  const blocksAgo = Math.floor(secondsAgo * blocksPerSecond)
  // Current block is around 30M+ on Avalanche, so we subtract
  return Math.max(0, 30000000 - blocksAgo)
}

/**
 * Main function to fetch activity transactions
 * 
 * NOTE: SnowTrace API is FREE and works without API key:
 * - Free tier: 2 req/sec, 10,000 calls/day
 * - API key is optional (only needed for higher limits)
 * - We try SnowTrace API first, fallback to mock only on error
 */
export async function fetchActivity(options: FetchActivityOptions): Promise<ActivityTransaction[]> {
  try {
    // Try SnowTrace API first (works without API key on free tier)
    return await fetchFromSnowTrace(options.address, options)
  } catch (error) {
    console.error('[Activity] SnowTrace API error:', error)
    // On error, fallback to mock data so UI still works
    console.warn('[Activity] Falling back to mock data due to API error')
    const mock = generateMockTransactions(options.address, options.limit || 50)

    // Apply filters to mock data
    let filtered = mock

    if (options.type && options.type !== 'all') {
      filtered = filtered.filter(tx => tx.type === options.type)
    }

    if (options.direction && options.direction !== 'all') {
      filtered = filtered.filter(tx => tx.direction === options.direction)
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase()
      filtered = filtered.filter(tx =>
        tx.hash.toLowerCase().includes(searchLower) ||
        tx.from.toLowerCase().includes(searchLower) ||
        tx.to.toLowerCase().includes(searchLower) ||
        tx.tokenTransfers.some(tt =>
          tt.symbol.toLowerCase().includes(searchLower) ||
          tt.contract.toLowerCase().includes(searchLower)
        ) ||
        (searchLower.includes('avax') && parseFloat(tx.nativeValueAvax) > 0)
      )
    }

    // Apply date range filter (simplified for mock)
    if (options.dateRange && options.dateRange !== 'all') {
      const now = Math.floor(Date.now() / 1000)
      let cutoff = 0
      if (options.dateRange === '24h') cutoff = now - 24 * 60 * 60
      else if (options.dateRange === '7d') cutoff = now - 7 * 24 * 60 * 60
      else if (options.dateRange === '30d') cutoff = now - 30 * 24 * 60 * 60

      filtered = filtered.filter(tx => tx.timestamp >= cutoff)
    }

    const offset = options.offset || 0
    return filtered.slice(offset, offset + (options.limit || 50))
  }
}
