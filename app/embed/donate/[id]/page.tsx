import React from 'react'
import { isValidAddress } from '@/lib/utils'
import { getProfileByAddress, getProfileBySlug } from '@/lib/db'
import { normalizeSlug } from '@/lib/utils/slug'

import { DonateEmbedWidget } from '@/components/donate/donate-embed-widget'

interface PageProps {
    params: {
        id: string
    }
}

async function getProfileData(id: string) {
    const isAddress = id.startsWith('0x') && isValidAddress(id)

    try {
        let profileData = null
        if (isAddress) {
            profileData = await getProfileByAddress(id)
        } else {
            profileData = await getProfileBySlug(normalizeSlug(id))
        }

        if (!profileData) {
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
            address: profileData.address,
            slug: profileData.slug,
            displayName: profileData.displayName || null,
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
