import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/dashboard/*/builder',
                    '/dashboard/*/settings',
                ],
            },
        ],
        sitemap: 'https://soci4l.net/sitemap.xml',
    }
}
