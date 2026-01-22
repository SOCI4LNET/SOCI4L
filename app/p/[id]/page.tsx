import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getWalletData } from '@/lib/avalanche'
import { isValidAddress, formatAddress } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
}

async function getProfile(id: string) {
  const normalizedId = id.toLowerCase()
  
  // Try to find by slug first, then by address
  let profile = await prisma.profile.findFirst({
    where: {
      OR: [
        { slug: normalizedId },
        { address: normalizedId },
      ],
    },
    include: { showcase: true },
  })

  // If not found by slug/address, check if id is a valid address
  if (!profile && isValidAddress(id)) {
    // Create a temporary profile object for unclaimed addresses
    return {
      address: normalizedId,
      slug: null,
      owner: null,
      isPublic: false,
      claimedAt: null,
      showcase: [],
    }
  }

  return profile
}

export default async function ProfilePage({ params }: PageProps) {
  const profile = await getProfile(params.id)

  if (!profile) {
    notFound()
  }

  const isClaimed = !!profile.owner
  const isPublic = profile.isPublic
  const isPrivate = isClaimed && !isPublic

  // Get wallet data
  let walletData = null
  if (!isPrivate) {
    try {
      walletData = await getWalletData(profile.address)
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-6">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Ana Sayfaya Dön
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Cüzdan Profili</CardTitle>
              <CardDescription className="mt-1">
                {formatAddress(profile.address)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!isClaimed && (
                <Badge variant="outline">Talep Edilmemiş</Badge>
              )}
              {isClaimed && isPublic && (
                <Badge variant="default">Halka Açık</Badge>
              )}
              {isPrivate && (
                <Badge variant="secondary">Özel</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isPrivate ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-lg">
                Bu profil özeldir ve varlık detayları gösterilmemektedir.
              </p>
            </div>
          ) : (
            <>
              {!isClaimed && (
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Bu profil henüz talep edilmemiş. Profili talep etmek için dashboard'a gidin.
                  </p>
                  <Link href="/dashboard">
                    <Button variant="outline">Profili Talep Et</Button>
                  </Link>
                </div>
              )}

              {walletData && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Özet</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">AVAX Bakiyesi</p>
                        <p className="text-xl font-bold">{parseFloat(walletData.nativeBalance).toFixed(4)} AVAX</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Toplam İşlem</p>
                        <p className="text-xl font-bold">{walletData.txCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Token Sayısı</p>
                        <p className="text-xl font-bold">{walletData.tokenBalances?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">NFT Sayısı</p>
                        <p className="text-xl font-bold">{walletData.nfts?.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  {isClaimed && profile.showcase && profile.showcase.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Vitrin NFT'leri</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {profile.showcase.map((item) => (
                          <Card key={item.id}>
                            <CardContent className="pt-4">
                              <p className="text-sm text-muted-foreground">Token ID</p>
                              <p className="font-mono text-sm">{item.tokenId}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatAddress(item.contractAddress)}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {walletData.tokenBalances && walletData.tokenBalances.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Token Bakiyeleri</h3>
                      <div className="space-y-2">
                        {walletData.tokenBalances.slice(0, 10).map((token: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{token.symbol}</p>
                              <p className="text-sm text-muted-foreground">{token.name}</p>
                            </div>
                            <p className="font-mono">{parseFloat(token.balance).toFixed(4)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Son İşlemler</h3>
                    <div className="space-y-2">
                      {walletData.transactions && walletData.transactions.slice(0, 5).map((tx: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-mono text-sm">{formatAddress(tx.hash)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.timestamp * 1000).toLocaleString('tr-TR')}
                            </p>
                          </div>
                          <a
                            href={`https://snowtrace.io/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
