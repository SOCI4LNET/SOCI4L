'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http, injected, type Config } from 'wagmi'
import { walletConnect } from 'wagmi/connectors'
import { avalanche } from 'viem/chains'
import { useState, useMemo } from 'react'
import { TransactionProvider } from '@/components/providers/transaction-provider'

// WalletConnect v2 Project ID - required for WalletConnect connector
// This enables: WalletConnect QR (mobile wallets), Ledger Live, Rainbow, Trust, Coinbase Wallet
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

// Lazy initialization of Wagmi config to avoid SSR issues with indexedDB
function createWagmiConfig(): Config {
  // Only create connectors on client-side to avoid indexedDB access during SSR
  if (typeof window === 'undefined') {
    // Return a minimal config for SSR (will be replaced on client)
    return createConfig({
      chains: [avalanche],
      connectors: [],
      transports: {
        [avalanche.id]: http(),
      },
    })
  }

  // Injected connector for browser extension wallets (MetaMask, Core, Phantom, etc.)
  const injectedConnector = injected()

  // WalletConnect connector - ONLY for WalletConnect flows (QR/mobile/Ledger Live)
  const walletConnectConnector = walletConnectProjectId
    ? walletConnect({
      projectId: walletConnectProjectId,
      disableProviderPing: true,
      metadata: {
        name: 'SOCI4L',
        description: 'Avalanche Wallet Profile Hub',
        url: window.location.origin,
        icons: [],
      },
    })
    : null

  // Combined connectors array
  const connectors = [
    ...(walletConnectConnector ? [walletConnectConnector] : []),
    injectedConnector,
  ].filter(Boolean)

  return createConfig({
    chains: [avalanche],
    connectors,
    transports: {
      [avalanche.id]: http(),
    },
  })
}

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

  // Lazy initialize Wagmi config to avoid SSR indexedDB issues
  const config = useMemo(() => createWagmiConfig(), [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TransactionProvider>
          {children}
        </TransactionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
