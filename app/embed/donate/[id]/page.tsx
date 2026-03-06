import React from 'react'
import { isValidAddress } from '@/lib/utils'
import { getProfileByAddress, getProfileBySlug } from '@/lib/db'
import { normalizeSlug } from '@/lib/utils/slug'

import { DonateEmbedWidget } from '@/components/donate/donate-embed-widget'

interface PageProps {
    params: Promise<{
        id: string
    }>
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
    const { id } = await params
    const profile = await getProfileData(id)

    if (!profile) {
        return (
            <div className="flex items-center justify-center w-screen h-screen bg-transparent m-0 p-0 overflow-hidden">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    body, html, body > div {
                        background-color: transparent !important;
                        background: transparent !important;
                    }
                `}} />
                <p className="text-xs text-muted-foreground">Profile not found</p>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center w-screen h-screen bg-transparent m-0 p-0 overflow-hidden">
            <style dangerouslySetInnerHTML={{
                __html: `
                body, html, body > div {
                    background-color: transparent !important;
                    background: transparent !important;
                }
            `}} />
            <script dangerouslySetInnerHTML={{
                __html: `document.documentElement.classList.add('iframe-mode');`
            }} />
            <DonateEmbedWidget profile={profile} />
        </div>
    )
}
