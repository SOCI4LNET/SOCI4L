'use client'

import { useEffect, useState } from 'react'
import { useAccount, useSignMessage, useConnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAddress } from '@/lib/utils'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

interface Profile {
  id: string
  address: string
  slug: string | null
  isPublic: boolean
  claimedAt: string | null
  showcase: Array<{
    id: string
    tokenId: string
    contractAddress: string
  }>
}

interface WalletData {
  address: string
  nativeBalance: string
  tokenBalances: Array<{
    contractAddress: string
    name: string
    symbol: string
    balance: string
    decimals: number
  }>
  nfts: Array<{
    contractAddress: string
    tokenId: string
    name?: string
    image?: string
  }>
  transactions: Array<{
    hash: string
    from: string
    to: string
    value: string
    timestamp: number
    blockNumber: number
  }>
  txCount: number
  firstSeen?: number
  lastSeen?: number
}

export default function DashboardPage() {
  const { address: connectedAddress, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [slug, setSlug] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [selectedNFTs, setSelectedNFTs] = useState<Set<string>>(new Set())

  const { signMessageAsync } = useSignMessage()

  useEffect(() => {
    if (isConnected && connectedAddress) {
      loadProfile()
    } else {
      setLoading(false)
    }
  }, [isConnected, connectedAddress])

  const loadProfile = async () => {
    if (!connectedAddress) return

    setLoading(true)
    try {
      const response = await fetch(`/api/profile?address=${connectedAddress}`)
      const data = await response.json()

      if (data.profile) {
        setProfile(data.profile)
        setSlug(data.profile.slug || '')
        setIsPublic(data.profile.isPublic)
        setSelectedNFTs(new Set(data.profile.showcase.map((item: any) => `${item.contractAddress}:${item.tokenId}`)))
      }

      // Load wallet data
      const walletResponse = await fetch(`/api/wallet?address=${connectedAddress}`)
      const walletResult = await walletResponse.json()
      if (walletResult.walletData) {
        setWalletData(walletResult.walletData)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async () => {
    if (!connectedAddress) return

    setClaiming(true)
    try {
      // Generate nonce
      const nonceResponse = await fetch('/api/claim/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: connectedAddress }),
      })
      const { nonce } = await nonceResponse.json()

      // Sign message
      const message = `Claim profile for ${connectedAddress}\n\nNonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      // Claim profile
      const claimResponse = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: connectedAddress,
          nonce,
          signature,
        }),
      })

      const result = await claimResponse.json()
      if (result.error) {
        alert(result.error)
      } else {
        await loadProfile()
      }
    } catch (error) {
      console.error('Error claiming profile:', error)
      alert('Profil talep edilirken bir hata oluştu')
    } finally {
      setClaiming(false)
    }
  }

  const handleUpdateSettings = async () => {
    if (!profile) return

    setUpdating(true)
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: connectedAddress,
          slug: slug || null,
          isPublic,
          showcase: Array.from(selectedNFTs).map((item) => {
            const [contractAddress, tokenId] = item.split(':')
            return { contractAddress, tokenId }
          }),
        }),
      })

      const result = await response.json()
      if (result.error) {
        alert(result.error)
      } else {
        await loadProfile()
        alert('Ayarlar güncellendi')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Ayarlar güncellenirken bir hata oluştu')
    } finally {
      setUpdating(false)
    }
  }

  const toggleNFT = (contractAddress: string, tokenId: string) => {
    const key = `${contractAddress}:${tokenId}`
    const newSet = new Set(selectedNFTs)
    if (newSet.has(key)) {
      newSet.delete(key)
    } else {
      newSet.add(key)
    }
    setSelectedNFTs(newSet)
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-6">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            ← Ana Sayfaya Dön
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Cüzdan bağlantısı gereklidir</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Dashboard'u kullanmak için cüzdanınızı bağlamanız gerekiyor.
              </p>
              <div className="flex flex-col gap-2">
                {connectors.map((connector) => (
                  <Button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    variant="outline"
                    className="w-full"
                  >
                    {connector.name} ile Bağlan
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const isClaimed = !!profile

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-6">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Ana Sayfaya Dön
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            {connectedAddress && formatAddress(connectedAddress)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isClaimed ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Bu cüzdan için henüz bir profil talep edilmemiş.
              </p>
              <Button onClick={handleClaim} disabled={claiming}>
                {claiming ? 'Talep Ediliyor...' : 'Profili Talep Et'}
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                <TabsTrigger value="assets">Varlıklar</TabsTrigger>
                <TabsTrigger value="activity">Aktivite</TabsTrigger>
                <TabsTrigger value="settings">Ayarlar</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {walletData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">AVAX Bakiyesi</p>
                        <p className="text-2xl font-bold">{parseFloat(walletData.nativeBalance).toFixed(4)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Toplam İşlem</p>
                        <p className="text-2xl font-bold">{walletData.txCount}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Token Sayısı</p>
                        <p className="text-2xl font-bold">{walletData.tokenBalances?.length || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">NFT Sayısı</p>
                        <p className="text-2xl font-bold">{walletData.nfts?.length || 0}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {profile && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Profil Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Durum</p>
                          <Badge variant={profile.isPublic ? 'default' : 'secondary'}>
                            {profile.isPublic ? 'Halka Açık' : 'Özel'}
                          </Badge>
                        </div>
                        {profile.slug && (
                          <div>
                            <p className="text-sm text-muted-foreground">Slug</p>
                            <p className="font-mono">{profile.slug}</p>
                          </div>
                        )}
                        {profile.claimedAt && (
                          <div>
                            <p className="text-sm text-muted-foreground">Talep Tarihi</p>
                            <p>{new Date(profile.claimedAt).toLocaleString('tr-TR')}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Profil Linki</p>
                          <Link
                            href={`/p/${profile.slug || profile.address}`}
                            className="text-primary hover:underline"
                          >
                            /p/{profile.slug || profile.address}
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="assets" className="space-y-4 mt-4">
                {walletData && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Token Bakiyeleri</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Token</TableHead>
                              <TableHead>Sembol</TableHead>
                              <TableHead className="text-right">Bakiye</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {walletData.tokenBalances?.map((token, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{token.name}</TableCell>
                                <TableCell>{token.symbol}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {parseFloat(token.balance).toFixed(4)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>NFT'ler</CardTitle>
                        <CardDescription>Vitrin için seçmek üzere işaretleyin</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {walletData.nfts?.map((nft, idx) => {
                            const key = `${nft.contractAddress}:${nft.tokenId}`
                            const isSelected = selectedNFTs.has(key)
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleNFT(nft.contractAddress, nft.tokenId)}
                                  />
                                  <div>
                                    <p className="font-medium">{nft.name || 'Unnamed NFT'}</p>
                                    <p className="text-sm text-muted-foreground font-mono">
                                      {formatAddress(nft.contractAddress)} #{nft.tokenId}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                          {(!walletData.nfts || walletData.nfts.length === 0) && (
                            <p className="text-muted-foreground text-center py-4">
                              NFT bulunamadı
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="activity" className="space-y-4 mt-4">
                {walletData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Son İşlemler</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Hash</TableHead>
                            <TableHead>Değer</TableHead>
                            <TableHead>Tarih</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {walletData.transactions?.slice(0, 20).map((tx, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-sm">
                                {formatAddress(tx.hash)}
                              </TableCell>
                              <TableCell>{parseFloat(tx.value).toFixed(4)} AVAX</TableCell>
                              <TableCell>
                                {new Date(tx.timestamp * 1000).toLocaleString('tr-TR')}
                              </TableCell>
                              <TableCell>
                                <a
                                  href={`https://snowtrace.io/tx/${tx.hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Profil Ayarları</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="slug">Özel Slug (Opsiyonel)</Label>
                      <Input
                        id="slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="my-profile"
                      />
                      <p className="text-xs text-muted-foreground">
                        Profil URL'iniz: /p/{slug || profile?.address}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPublic"
                        checked={isPublic}
                        onCheckedChange={(checked) => setIsPublic(checked === true)}
                      />
                      <Label htmlFor="isPublic" className="cursor-pointer">
                        Profili halka açık yap
                      </Label>
                    </div>

                    <Button onClick={handleUpdateSettings} disabled={updating}>
                      {updating ? 'Güncelleniyor...' : 'Ayarları Kaydet'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
