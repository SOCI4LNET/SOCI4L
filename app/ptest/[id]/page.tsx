'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { formatAddress, isValidAddress } from '@/lib/utils'
import { ChevronDown, ExternalLink, ShieldAlert, Sparkles, Wallet } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/lib/avatar'
import { Badge } from '@/components/ui/badge'

interface PageProps {
    params: {
        id: string
    }
}

export default function PremiumTestProfile({ params }: PageProps) {
    const [walletData, setWalletData] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [expandedAssets, setExpandedAssets] = useState(false)

    useEffect(() => {
        // Force dark mode for this test page to ensure the premium look
        document.documentElement.classList.add('dark')

        const fetchData = async () => {
            setLoading(true)
            try {
                const isAddress = params.id.startsWith('0x') && isValidAddress(params.id)
                const endpoint = isAddress ?\`/api/wallet?address=\${params.id.toLowerCase()}\` : \`/api/wallet?slug=\${params.id}\`
        
        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json()
          setWalletData(data.walletData)
          setProfile(data.profile)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-white/5" />
          <div className="h-4 w-24 bg-white/5 rounded-full" />
        </div>
      </div>
    )
  }

  // Combine native AVAX + Tokens + top NFTs into a unified "Assets" list for this concept
  const allAssets = []
  
  if (walletData?.nativeBalance && parseFloat(walletData.nativeBalance) > 0) {
    allAssets.push({
      type: 'native',
      name: 'Avalanche',
      symbol: 'AVAX',
      balance: parseFloat(walletData.nativeBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
      icon: '🔺'
    })
  }

  if (walletData?.tokenBalances) {
    walletData.tokenBalances.forEach((token: any) => {
      allAssets.push({
        type: 'token',
        name: token.name,
        symbol: token.symbol,
        balance: parseFloat(token.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
        icon: '🪙'
      })
    })
  }

  if (walletData?.nfts) {
    walletData.nfts.slice(0, 5).forEach((nft: any) => {
      allAssets.push({
        type: 'nft',
        name: nft.name || 'Unnamed NFT',
        symbol: \`#\${nft.tokenId}\`,
        balance: '1',
        image: nft.image || null
      })
    })
  }

  // Determine how many items to show initially
  const INITIAL_COUNT = 4
  const visibleAssets = expandedAssets ? allAssets : allAssets.slice(0, INITIAL_COUNT)
  const hasMoreAssets = allAssets.length > INITIAL_COUNT

  const displayName = profile?.displayName || (profile?.slug) || formatAddress(profile?.address || params.id)
  const avatarUrl = getAvatarUrl(profile?.address || params.id, 128)

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] font-sans selection:bg-white/20 pb-24">
      
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[hsl(230,69%,50%)]/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] bg-[hsl(280,69%,50%)]/5 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <main className="relative z-10 max-w-xl mx-auto px-4 pt-16 sm:pt-24 flex flex-col items-center">
        
        {/* Premium Header */}
        <div className="flex flex-col items-center text-center space-y-5 mb-12">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-white/20 to-white/0 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-700"></div>
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border border-white/10 shadow-2xl relative">
              <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
              <AvatarFallback className="bg-white/5 text-xl">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            {profile?.isVerified && (
              <div className="absolute bottom-1 right-1 bg-[#050505] rounded-full p-1 border border-white/10">
                <Sparkles className="h-4 w-4 text-blue-400" />
              </div>
            )}
          </div>
          
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white flex items-center justify-center gap-2">
              {displayName}
            </h1>
            {profile?.address && (
              <p className="text-sm font-mono text-white/40 tracking-wider">
                {formatAddress(profile.address, 4)}
              </p>
            )}
          </div>

          {profile?.bio && (
            <p className="text-base text-white/60 max-w-md leading-relaxed">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button className="px-6 py-2.5 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Follow
            </button>
            <button className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white font-medium text-sm hover:bg-white/10 transition-all active:scale-95 backdrop-blur-md">
              Donate
            </button>
          </div>
        </div>

        {/* Modules Layout (The Modular Structure) */}
        <div className="w-full flex justify-center mt-4">
          
          {/* ASSETS MODULE */}
          <div className="w-full relative rounded-3xl overflow-hidden bg-white/[0.02] border border-white/5 shadow-2xl backdrop-blur-xl transition-all duration-500">
            
            {/* Module Header header */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/5">
                  <Wallet className="h-4 w-4 text-white/70" />
                </div>
                <h3 className="font-medium text-sm tracking-wide text-white/80">Assets</h3>
              </div>
              <span className="text-xs font-mono text-white/30">{allAssets.length} Total</span>
            </div>

            {/* Assets List */}
            <div className="p-2">
              <div className="flex flex-col">
                {visibleAssets.map((asset, idx) => (
                  <div key={idx} className="group flex items-center justify-between p-3 sm:p-4 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      {asset.type === 'nft' && asset.image ? (
                        <div className="h-10 w-10 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-white/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={asset.image} alt="NFT" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center flex-shrink-0 text-lg">
                          {asset.icon || '🪙'}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-white/90 truncate">{asset.name}</span>
                        <span className="text-xs text-white/40 uppercase tracking-wider mt-0.5">{asset.symbol}</span>
                      </div>
                    </div>
                    {asset.type !== 'nft' && (
                      <div className="text-right pl-4">
                        <span className="text-sm font-mono text-white/80">{asset.balance}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Gaussian Blur Expand Button Area */}
            {!expandedAssets && hasMoreAssets && (
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#090909] via-[#090909]/80 to-transparent flex items-end justify-center pb-5 pointer-events-none">
                {/* We use a pseudo-backdrop blur to make the fade look extremely smooth */}
                <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black,transparent)]" />
                
                <button 
                  onClick={() => setExpandedAssets(true)}
                  className="pointer-events-auto relative z-10 flex items-center gap-2 text-xs font-medium text-white/70 hover:text-white transition-colors bg-white/5 hover:bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-lg active:scale-95 duration-200"
                >
                  View All Assets
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </button>
              </div>
            )}
            
            {/* Collapse button when expanded */}
            {expandedAssets && hasMoreAssets && (
              <div className="p-4 flex justify-center border-t border-white/5">
                <button 
                  onClick={() => setExpandedAssets(false)}
                  className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white/80 transition-colors py-2 active:scale-95 duration-200"
                >
                  Show Less
                  <ChevronDown className="h-3.5 w-3.5 rotate-180 opacity-70" />
                </button>
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  )
}
