'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { isValidAddress } from '@/lib/utils'
import { toast } from 'sonner'

export default function HomePage() {
  const [address, setAddress] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    if (!address.trim()) return
    
    const trimmedAddress = address.trim()
    if (isValidAddress(trimmedAddress)) {
      // Normalize address to lowercase
      const normalizedAddress = trimmedAddress.toLowerCase()
      router.push(`/p/${normalizedAddress}`)
    } else {
      toast.error('Geçersiz cüzdan adresi')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Avalanche Profile Hub</h1>
        <p className="text-muted-foreground">
          Search and view Avalanche wallet profiles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Wallet Address</CardTitle>
          <CardDescription>
            Enter an Avalanche C-Chain wallet address to view its profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={handleSearch} size="sm">Search</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Summary</CardTitle>
            <CardDescription>Wallet overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Status</CardTitle>
            <CardDescription>Claim information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
