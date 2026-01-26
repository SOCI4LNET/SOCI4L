'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http, injected } from 'wagmi'
import { walletConnect } from 'wagmi/connectors'
import { avalanche } from 'viem/chains'
import { useState } from 'react'

// WalletConnect v2 Project ID - required for WalletConnect connector
// This enables: WalletConnect QR (mobile wallets), Ledger Live, Rainbow, Trust, Coinbase Wallet
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

// Separate connectors configuration:
// 1. injectedConnector - MetaMask, Core, Phantom and other browser extension wallets (EIP-1193 compatible)
// 2. walletConnectConnector - WalletConnect v2 connector ONLY for QR/mobile/Ledger Live
//    - Does NOT fall back to injected providers
//    - Opens WalletConnect modal with QR code first
// 
// Note: Ledger support comes implicitly via WalletConnect - no separate SDK needed.
// Users can connect Ledger Live by scanning the WalletConnect QR code.

// Injected connector for browser extension wallets (MetaMask, Core, Phantom, etc.)
const injectedConnector = injected()

// WalletConnect connector - ONLY for WalletConnect flows (QR/mobile/Ledger Live)
// Configured to NOT fall back to injected providers
// disableProviderPing: prevents automatic provider detection that could trigger injected wallet chooser
const walletConnectConnector = walletConnectProjectId
  ? walletConnect({
      projectId: walletConnectProjectId,
      disableProviderPing: true, // Prevents automatic injected provider detection
      metadata: {
        name: 'SOCI4L',
        description: 'Avalanche Wallet Profile Hub',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://soci4l.com',
        icons: [],
      },
    })
  : null

// Combined connectors array - WalletConnect first (for primary "Connect Wallet" button)
// Injected second (for explicit browser wallet buttons)
const connectors = [
  ...(walletConnectConnector ? [walletConnectConnector] : []),
  injectedConnector,
].filter(Boolean)

const config = createConfig({
  chains: [avalanche],
  connectors,
  transports: {
    [avalanche.id]: http(),
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 30 seconds (prevents unnecessary refetches)
        staleTime: 30 * 1000, // 30 seconds
        // Cache data for 5 minutes after component unmounts
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
        // Refetch on window focus only if data is stale
        refetchOnWindowFocus: true,
        // Don't refetch on mount if data is fresh
        refetchOnMount: false,
        // Retry failed requests once
        retry: 1,
        // Retry delay of 1 second
        retryDelay: 1000,
      },
    },
  }))

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
