'use client'

import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http, cookieStorage, createStorage, type Config } from 'wagmi'
import { walletConnect, injected } from 'wagmi/connectors'
import { avalanche, avalancheFuji } from 'viem/chains'
import { activeChain } from '@/lib/chain-config'

import { TransactionProvider } from '@/components/providers/transaction-provider'
import PrivyProviderWrapper from '@/components/providers/privy-provider'

// WalletConnect v2 Project ID
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

// Singleton config to prevent WalletConnect from being initialized multiple times
let wagmiConfig: ReturnType<typeof createConfig> | null = null

export function getConfig() {
  // Return cached config if it exists (prevents WalletConnect re-initialization)
  if (wagmiConfig) {
    return wagmiConfig
  }

  const connectors = [
    injected({ shimDisconnect: true }),
    ...(walletConnectProjectId ? [walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: 'SOCI4L',
        description: 'Avalanche Wallet Profile Hub',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://soci4l.net',
        icons: [],
      },
    })] : []),
  ]

  wagmiConfig = createConfig({
    chains: [activeChain, activeChain.id === avalancheFuji.id ? avalanche : avalancheFuji],
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
      key: 'soci4l-wagmi',
    }),
    connectors,
    transports: {
      [avalanche.id]: http(),
      [avalancheFuji.id]: http(),
    },
  })

  return wagmiConfig
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  }))

  const [config] = useState(() => getConfig())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <PrivyProviderWrapper>
          <TransactionProvider>
            {children}
          </TransactionProvider>
        </PrivyProviderWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
