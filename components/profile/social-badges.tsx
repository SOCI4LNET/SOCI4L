'use client'

import { useEffect, useState } from 'react'
import { getWeb3SocialProfiles, type Web3SocialProfile } from '@/lib/web3-social'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'

// Simple icons for platforms (SVG)
const FarcasterIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
        <path d="M12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24ZM12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM16.25 10.75C16.9404 10.75 17.5 10.1904 17.5 9.5C17.5 8.80964 16.9404 8.25 16.25 8.25C15.5596 8.25 15 8.80964 15 9.5C15 10.1904 15.5596 10.75 16.25 10.75ZM7.75 10.75C8.44036 10.75 9 10.1904 9 9.5C9 8.80964 8.44036 8.25 7.75 8.25C7.05964 8.25 6.5 8.80964 6.5 9.5C6.5 10.1904 7.05964 10.75 7.75 10.75ZM12 17C14.7614 17 17 14.7614 17 12H7C7 14.7614 9.23858 17 12 17Z" />
    </svg>
)

const LensIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.6c-5.302 0-9.6-4.298-9.6-9.6s4.298-9.6 9.6-9.6 9.6 4.298 9.6 9.6-4.298 9.6-9.6 9.6zm4.8-12c0 1.325-1.075 2.4-2.4 2.4-1.325 0-2.4-1.075-2.4-2.4 0-1.325 1.075-2.4 2.4-2.4 1.325 0 2.4 1.075 2.4 2.4zm-9.6 0c0 1.325 1.075 2.4 2.4 2.4 1.325 0 2.4-1.075 2.4-2.4 0-1.325-1.075-2.4-2.4-2.4-1.325 0-2.4 1.075-2.4 2.4z" />
    </svg>
)

interface SocialBadgesProps {
    address: string
}

export function SocialBadges({ address }: SocialBadgesProps) {
    const [profiles, setProfiles] = useState<Web3SocialProfile[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!address) return

        const fetchData = async () => {
            try {
                const data = await getWeb3SocialProfiles(address)
                setProfiles(data.profiles)
            } catch (error) {
                console.error('Failed to fetch social profiles', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [address])

    if (loading || profiles.length === 0) return null

    return (
        <div className="flex items-center gap-2 mt-1 mb-3">
            <TooltipProvider>
                {profiles.map((profile) => (
                    <Tooltip key={profile.platform}>
                        <TooltipTrigger asChild>
                            <a
                                href={profile.profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="no-underline"
                            >
                                <Badge variant="secondary" className="gap-1.5 px-2 py-0.5 h-6 cursor-pointer hover:bg-secondary/80 transition-colors">
                                    {profile.platform === 'farcaster' ? <FarcasterIcon /> : <LensIcon />}
                                    <span className="font-medium">{profile.handle}</span>
                                    {profile.isVerified && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    )}
                                </Badge>
                            </a>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="flex flex-col gap-1 text-xs">
                                <span className="font-bold">{profile.displayName}</span>
                                <span>{profile.followerCount.toLocaleString()} followers</span>
                                <div className="flex items-center gap-1 text-muted-foreground pt-1">
                                    View on {profile.platform === 'farcaster' ? 'Warpcast' : 'Hey'} <ExternalLink className="w-3 h-3" />
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
        </div>
    )
}
