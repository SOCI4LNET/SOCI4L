import Script from 'next/script'

interface StructuredDataProps {
    type: 'Organization' | 'Person' | 'Article'
    data: any
}

export function StructuredData({ type, data }: StructuredDataProps) {
    let structuredData: any = {}

    switch (type) {
        case 'Organization':
            structuredData = {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'SOCI4L',
                url: 'https://soci4l.net',
                logo: 'https://soci4l.net/logos/icon.png',
                description: 'Web3 Profile & Link Hub - Turn your wallet into a measurable, privacy-first public profile',
                sameAs: [
                    // Add social media links here if available
                ],
            }
            break

        case 'Person':
            structuredData = {
                '@context': 'https://schema.org',
                '@type': 'Person',
                name: data.displayName || 'SOCI4L User',
                url: `https://soci4l.net/p/${data.slug}`,
                description: data.bio || '',
                identifier: data.address,
                ...(data.avatar && { image: data.avatar }),
            }
            break

        case 'Article':
            structuredData = {
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: data.title,
                description: data.description || '',
                author: {
                    '@type': 'Organization',
                    name: 'SOCI4L',
                },
                publisher: {
                    '@type': 'Organization',
                    name: 'SOCI4L',
                    logo: {
                        '@type': 'ImageObject',
                        url: 'https://soci4l.net/logos/icon.png',
                    },
                },
                datePublished: data.publishedAt || new Date().toISOString(),
                dateModified: data.updatedAt || new Date().toISOString(),
            }
            break
    }

    return (
        <Script
            id={`structured-data-${type.toLowerCase()}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    )
}
