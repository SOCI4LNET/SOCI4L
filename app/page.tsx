'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { isValidAddress, formatAddress } from '@/lib/utils'
import { Search } from 'lucide-react'

export default function HomePage() {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletData, setWalletData] = useState<any>(null)
  const [profileStatus, setProfileStatus] = useState<'UNCLAIMED' | 'CLAIMED+PUBLIC' | 'CLAIMED+PRIVATE' | null>(null)
  const router = useRouter()

  const handleSearch = async () => {
    if (!isValidAddress(address)) {
      setError('Geçersiz cüzdan adresi')
      return
    }

    setLoading(true)
    setError(null)
    setWalletData(null)
    setProfileStatus(null)

    try {
      // Fetch wallet data
      const data = await fetch(`/api/wallet?address=${address}`)
      const result = await data.json()
      
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setWalletData(result.walletData)
      setProfileStatus(result.profileStatus)
    } catch (err) {
      setError('Cüzdan verileri alınırken bir hata oluştu')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewProfile = () => {
    if (walletData) {
      router.push(`/p/${address}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Avalanche Wallet Profile Hub</h1>
        <p className="text-muted-foreground">Herhangi bir Avalanche cüzdan adresini arayın ve profil sayfasını görüntüleyin</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cüzdan Adresi Ara</CardTitle>
          <CardDescription>Avalanche C-Chain cüzdan adresini girin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Aranıyor...' : 'Ara'}
            </Button>
          </div>
          {error && (
            <p className="text-destructive text-sm mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      )}

      {walletData && !loading && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cüzdan Özeti</CardTitle>
              <div className="flex gap-2">
                {profileStatus === 'UNCLAIMED' && (
                  <Badge variant="outline">Talep Edilmemiş</Badge>
                )}
                {profileStatus === 'CLAIMED+PUBLIC' && (
                  <Badge variant="default">Talep Edilmiş - Halka Açık</Badge>
                )}
                {profileStatus === 'CLAIMED+PRIVATE' && (
                  <Badge variant="secondary">Talep Edilmiş - Özel</Badge>
                )}
              </div>
            </div>
            <CardDescription>{formatAddress(walletData.address)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">AVAX Bakiyesi</p>
                <p className="text-2xl font-bold">{parseFloat(walletData.nativeBalance).toFixed(4)} AVAX</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam İşlem</p>
                <p className="text-2xl font-bold">{walletData.txCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Token Sayısı</p>
                <p className="text-2xl font-bold">{walletData.tokenBalances?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NFT Sayısı</p>
                <p className="text-2xl font-bold">{walletData.nfts?.length || 0}</p>
              </div>
            </div>
            <Button onClick={handleViewProfile} className="w-full">
              Profili Görüntüle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
