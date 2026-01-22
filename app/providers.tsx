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
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
