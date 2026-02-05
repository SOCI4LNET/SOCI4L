import { type Address } from 'viem'

export interface Web3SocialProfile {
    platform: 'farcaster' | 'lens'
    handle: string
    displayName?: string
    avatarUrl?: string
    bio?: string
    followerCount: number
    followingCount: number
    profileUrl: string
    isVerified: boolean // If we can actively verify it
}

export interface SocialGraphData {
    profiles: Web3SocialProfile[]
    totalFollowers: number
    primaryIdentity?: Web3SocialProfile
}

// Mock data for development - in production this would hit Airstack or Neynar API
const MOCK_PROFILES: Record<string, Web3SocialProfile[]> = {
    // Satoshi mock address
    '0x8ab0cf264df99d83525e9e11c7e4db01558ae1b1': [
        {
            platform: 'farcaster',
            handle: 'satoshi',
            displayName: 'Satoshi.avax',
            avatarUrl: 'https://github.com/shadcn.png',
            bio: 'Building the future on Avalanche.',
            followerCount: 12500,
            followingCount: 420,
            profileUrl: 'https://warpcast.com/satoshi',
            isVerified: true
        },
        {
            platform: 'lens',
            handle: 'satoshi.lens',
            displayName: 'Satoshi',
            avatarUrl: 'https://github.com/shadcn.png',
            followerCount: 5400,
            followingCount: 120,
            profileUrl: 'https://hey.xyz/u/satoshi',
            isVerified: true
        }
    ]
}

/**
 * Fetches associated Web3 social profiles for a given EVM address.
 * Currently uses mock data, will integrating Airstack/Graph in future steps.
 */
export async function getWeb3SocialProfiles(address: string): Promise<SocialGraphData> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800))

    const normalizedAddr = address.toLowerCase()
    const profiles = MOCK_PROFILES[normalizedAddr] || []

    // If no specific mock, return empty or generic placeholder if in demo mode?
    // For now just return empty if not matched

    const totalFollowers = profiles.reduce((acc, curr) => acc + curr.followerCount, 0)

    // Logic to pick primary identity (e.g. Farcaster preferred)
    const primaryIdentity = profiles.find(p => p.platform === 'farcaster') || profiles[0]

    return {
        profiles,
        totalFollowers,
        primaryIdentity
    }
}
