/**
 * chain-config.ts
 * Central chain context for SOCI4L.
 * Driven by NEXT_PUBLIC_NETWORK env var: 'fuji' | 'mainnet' (default: mainnet)
 */

import { avalanche, avalancheFuji } from 'viem/chains'

export type NetworkName = 'mainnet' | 'fuji'

export const ACTIVE_NETWORK: NetworkName =
    (process.env.NEXT_PUBLIC_NETWORK as NetworkName) === 'fuji' ? 'fuji' : 'mainnet'

export const IS_TESTNET = ACTIVE_NETWORK === 'fuji'

// ─── Chain Objects ─────────────────────────────────────────────────────────
export const activeChain = IS_TESTNET ? avalancheFuji : avalanche
export const activeChainId = IS_TESTNET ? avalancheFuji.id : avalanche.id

// ─── RPC URLs ──────────────────────────────────────────────────────────────
export const MAINNET_RPC =
    process.env.NEXT_PUBLIC_AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc'

export const FUJI_RPC =
    process.env.NEXT_PUBLIC_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc'

export const activeRpc = IS_TESTNET ? FUJI_RPC : MAINNET_RPC

// ─── Snowtrace API ─────────────────────────────────────────────────────────
export const snowtraceApiUrl = IS_TESTNET
    ? 'https://api-testnet.snowtrace.io/api'
    : 'https://api.snowtrace.io/api'

// ─── Smart Contract Addresses ──────────────────────────────────────────────

// CustomSlugRegistry
export const MAINNET_SLUG_REGISTRY = '0xC894a2677C7E619E9692E3bF4AFF58bE53173aA1'
export const FUJI_SLUG_REGISTRY = process.env.FUJI_SLUG_REGISTRY_ADDRESS || ''
export const activeSlugRegistry = IS_TESTNET ? FUJI_SLUG_REGISTRY : MAINNET_SLUG_REGISTRY

// PremiumPayment
export const MAINNET_PREMIUM_PAYMENT = '0x9bA02537447E6DcdeF72D0e98a4C82E6B73E3cCC'
export const FUJI_PREMIUM_PAYMENT = process.env.FUJI_PREMIUM_PAYMENT_ADDRESS || ''
export const activePremiumPayment = IS_TESTNET ? FUJI_PREMIUM_PAYMENT : MAINNET_PREMIUM_PAYMENT

// DonatePayment
export const MAINNET_DONATE_PAYMENT = '0x863deaF39D816fBA5D10E3e846a2D953Aa9aEca5'
export const FUJI_DONATE_PAYMENT = process.env.FUJI_DONATE_PAYMENT_ADDRESS || ''
export const activeDonatePayment = IS_TESTNET ? FUJI_DONATE_PAYMENT : MAINNET_DONATE_PAYMENT

// ─── Block Explorer ─────────────────────────────────────────────────────────
export const blockExplorerUrl = IS_TESTNET
    ? 'https://testnet.snowtrace.io'
    : 'https://snowtrace.io'

export function getTxUrl(txHash: string): string {
    return `${blockExplorerUrl}/tx/${txHash}`
}
