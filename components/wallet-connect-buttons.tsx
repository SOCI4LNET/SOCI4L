'use client'

import { useState, useEffect } from 'react'
import { useConnect } from 'wagmi'
import { toast } from 'sonner'

import { Wallet, Loader2, QrCode, Plug } from 'lucide-react'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface WalletConnectButtonsProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function WalletConnectButtons({ 
  variant = 'default', 
  size = 'sm',
  className = ''
}: WalletConnectButtonsProps) {
  const { connect, connectors, isPending: isConnecting, error } = useConnect()
  
  // Handle connection errors
  useEffect(() => {
    if (error) {
      if (error.message?.includes('expired') || error.message?.includes('Proposal expired')) {
        toast.error('Connection expired. Please try again.', {
          description: 'You need to scan the QR code and approve within 5 minutes.',
        })
      } else if (error.message?.includes('User rejected')) {
        toast.error('Connection rejected')
      } else {
        console.error('Wallet connection error:', error)
        toast.error('Connection error', {
          description: error.message || 'An error occurred while connecting wallet.',
        })
      }
    }
  }, [error])

  const [mounted, setMounted] = useState(false)
  const [hasInjectedWallets, setHasInjectedWallets] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if any injected wallets are available
    if (typeof window !== 'undefined') {
      const hasEthereum = !!window.ethereum
      const hasAvalanche = !!(window as any).avalanche
      setHasInjectedWallets(hasEthereum || hasAvalanche)
    }
  }, [])

  // Find connectors
  const walletConnectConnector = connectors.find(c => c.id === 'walletConnect' || c.name === 'WalletConnect')
  // Injected connector typically has id 'injected' or name 'Injected'
  // If WalletConnect exists, the other connector is likely injected
  const injectedConnector = connectors.find(c => 
    c.id === 'injected' || 
    c.name === 'Injected' ||
    (walletConnectConnector && c.id !== walletConnectConnector.id)
  )

  if (!mounted) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    )
  }

  // If only WalletConnect is available
  if (walletConnectConnector && !hasInjectedWallets) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => connect({ connector: walletConnectConnector })}
        disabled={isConnecting}
        className={className}
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    )
  }

  // If only injected wallets are available
  if (!walletConnectConnector && injectedConnector) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => connect({ connector: injectedConnector })}
        disabled={isConnecting}
        className={className}
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          'Connect Wallet'
        )}
      </Button>
    )
  }

  // If both are available, show dropdown with options
  if (walletConnectConnector && injectedConnector) {
    // Determine order: if extension detected, show Installed Wallet first
    const showInstalledFirst = hasInjectedWallets
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={isConnecting}
            className={className}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Wallet'
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {showInstalledFirst ? (
            <>
              {/* Installed Wallet - shown first when detected */}
              <DropdownMenuItem
                onClick={() => connect({ connector: injectedConnector })}
                disabled={isConnecting}
                className="flex-col items-start gap-1.5 py-2.5"
              >
                {/* Top row: Icon + Title | Detected badge */}
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plug className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">Installed Wallet</span>
                  </div>
                  {hasInjectedWallets && (
                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-muted-foreground/20 bg-transparent">
                      Detected
                    </Badge>
                  )}
                </div>
                {/* Second row: Extension label */}
                <span className="ml-6 text-xs text-muted-foreground">Extension</span>
              </DropdownMenuItem>
              
              {/* WalletConnect - shown second when extension detected */}
              <DropdownMenuItem
                onClick={() => connect({ connector: walletConnectConnector })}
                disabled={isConnecting}
                className="flex-col items-start gap-0.5 py-2.5"
              >
                <div className="flex w-full items-center gap-2">
                  <QrCode className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">WalletConnect</span>
                </div>
                <span className="ml-6 text-xs text-muted-foreground">QR / Mobile</span>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              {/* WalletConnect - shown first when no extension detected */}
              <DropdownMenuItem
                onClick={() => connect({ connector: walletConnectConnector })}
                disabled={isConnecting}
                className="flex-col items-start gap-0.5 py-2.5"
              >
                <div className="flex w-full items-center gap-2">
                  <QrCode className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">WalletConnect</span>
                </div>
                <span className="ml-6 text-xs text-muted-foreground">QR / Mobile</span>
              </DropdownMenuItem>
              
              {/* Installed Wallet - shown second when no extension detected */}
              <DropdownMenuItem
                onClick={() => connect({ connector: injectedConnector })}
                disabled={isConnecting}
                className="flex-col items-start gap-1.5 py-2.5"
              >
                {/* Top row: Icon + Title */}
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plug className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">Installed Wallet</span>
                  </div>
                </div>
                {/* Second row: Extension label */}
                <span className="ml-6 text-xs text-muted-foreground">Extension</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Fallback: use first available connector
  const fallbackConnector = connectors[0]
  if (!fallbackConnector) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => connect({ connector: fallbackConnector })}
      disabled={isConnecting}
      className={className}
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isConnecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        'Connect Wallet'
      )}
    </Button>
  )
}
