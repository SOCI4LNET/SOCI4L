import { toast } from 'sonner'
import { getPublicProfileHref } from '@/lib/routing'
import { formatAddress } from '@/lib/utils'

interface UseProfileShareProps {
    address: string
    isOwnProfile: boolean
    profileData?: {
        profile?: {
            slug?: string | null
            displayName?: string | null
        }
    }
}

export function useProfileShare({ address, isOwnProfile, profileData }: UseProfileShareProps) {
    const getShareUrl = (): string => {
        if (typeof window === 'undefined') {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
            const profilePath = getPublicProfileHref(address, profileData?.profile?.slug)
            return `${appUrl}${profilePath}`
        }
        const baseUrl = window.location.origin
        const profilePath = getPublicProfileHref(address, profileData?.profile?.slug)
        return `${baseUrl}${profilePath}`
    }

    const handleCopyLink = async () => {
        const url = getShareUrl()
        try {
            await navigator.clipboard.writeText(url)
            toast.success('Profile link copied')
        } catch {
            toast.error('Failed to copy')
        }
    }

    const handleShareTwitter = () => {
        const url = getShareUrl()
        let shareText: string
        if (isOwnProfile) {
            shareText = 'Just claimed my SOCI4L profile on Avalanche.\n\nTrack my on-chain identity and links in one place.\n\n' + url
        } else {
            const profileName = profileData?.profile?.displayName || formatAddress(address, 4)
            shareText = `Check out this SOCI4L profile on Avalanche: ${profileName}\n\nTrack on-chain identity and links in one place.\n\n` + url
        }
        const text = encodeURIComponent(shareText)
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener')
    }

    const handleShareNative = async () => {
        const url = getShareUrl()
        if (navigator.share) {
            try {
                let shareTitle: string
                let shareText: string
                if (isOwnProfile) {
                    shareTitle = 'My Avalanche Profile'
                    shareText = 'Check out my SOCI4L profile on Avalanche. Track my on-chain identity and links in one place.'
                } else {
                    const profileName = profileData?.profile?.displayName || formatAddress(address, 4)
                    shareTitle = 'Avalanche Profile'
                    shareText = `Check out this SOCI4L profile on Avalanche: ${profileName}. Track on-chain identity and links in one place.`
                }
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: url,
                })
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error('Share failed:', error)
                    handleCopyLink()
                }
            }
        } else {
            handleCopyLink()
        }
    }

    return { handleCopyLink, handleShareTwitter, handleShareNative }
}
