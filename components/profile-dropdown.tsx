'use client'

import { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatAddress } from '@/lib/utils'
import { LayoutDashboard, User, Settings, LogOut } from 'lucide-react'

export function ProfileDropdown() {
  const [mounted, setMounted] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  if (!isConnected || !address) {
    return null
  }

  const normalizedAddress = address.toLowerCase()
  
  // Generate avatar URL using effigy.im
  const avatarUrl = `https://effigy.im/a/${normalizedAddress}.svg`
  
  // Get first 2-3 characters for fallback
  const fallbackText = address.slice(2, 5).toUpperCase()

  const handleDisconnect = () => {
    disconnect()
    router.push('/')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
          <Avatar className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity">
            {!imageError && (
              <AvatarImage 
                src={avatarUrl} 
                alt={formatAddress(address)}
                onError={() => setImageError(true)}
              />
            )}
            {imageError && (
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {fallbackText}
              </AvatarFallback>
            )}
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Wallet</p>
            <p className="text-xs leading-none text-muted-foreground font-mono">
              {formatAddress(address)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/dashboard/${normalizedAddress}`)}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/p/${normalizedAddress}`)}>
          <User className="mr-2 h-4 w-4" />
          <span>Public Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/dashboard/${normalizedAddress}?tab=settings`)}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
