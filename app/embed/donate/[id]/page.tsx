import React from 'react'
import { DonateEmbedWidget } from '@/components/donate/donate-embed-widget'
import { isValidAddress } from '@/lib/utils'

interface PageProps {
    params: {
        id: string
    }
}

async function getProfileData(id: string) {
    const isAddress = id.startsWith('0x') && isValidAddress(id)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const queryParam = isAddress ? `address=${id}` : `slug=${id}`

    try {
        const response = await fetch(`${baseUrl}/api/wallet?${queryParam}`, {
            cache: 'no-store',
        })

        if (!response.ok) {
            return null
        }

        const data = await response.json()
        if (!data.profile) {
            // If no profile but it's a valid address, we can still show a basic widget
            if (isAddress) {
                return {
                    address: id,
                    slug: null,
                    displayName: null,
                }
            }
            return null
        }

        return {
            address: data.profile.address,
            slug: data.profile.slug,
            displayName: data.profile.displayName,
        }
    } catch (error) {
        console.error('[EmbedPage] Error fetching profile:', error)
        return null
    }
}

export default async function DonateEmbedPage({ params }: PageProps) {
    const profile = await getProfileData(params.id)

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-transparent p-4">
                <p className="text-xs text-muted-foreground">Profile not found</p>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-transparent p-2">
            <DonateEmbedWidget profile={profile} />
        </div>
    )
}
