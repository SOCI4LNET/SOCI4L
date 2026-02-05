import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://soci4l.net'

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/docs`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ]

    // Fetch public profiles (claimed and not banned)
    try {
        const profiles = await prisma.profile.findMany({
            where: {
                slug: { not: null },
                isBanned: false,
                // Only include claimed and public profiles
                // We use ownerAddress check or status check depending on schema migration state
                // Schema shows: status defaults to "UNCLAIMED", visibility defaults to "PUBLIC"
                status: { not: 'UNCLAIMED' },
                visibility: 'PUBLIC',
            },
            select: {
                slug: true,
                updatedAt: true,
            },
            take: 1000, // Limit to prevent huge sitemaps
        })

        const profilePages: MetadataRoute.Sitemap = profiles.map((profile: { slug: string | null; updatedAt: Date }) => ({
            url: `${baseUrl}/p/${profile.slug}`,
            lastModified: profile.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))

        return [...staticPages, ...profilePages]
    } catch (error) {
        console.error('[Sitemap] Error fetching profiles:', error)
        // Return static pages only if DB query fails
        return staticPages
    }
}
