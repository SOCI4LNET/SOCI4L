'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http, injected } from 'wagmi'
import { avalanche } from 'viem/chains'
import { useState } from 'react'

// For now, use only injected connector which works out of the box
// MetaMask and WalletConnect can be added later if needed
const connectors = [
  injected(),
]

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
