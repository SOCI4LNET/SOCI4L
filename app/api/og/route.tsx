import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        // Get parameters from URL
        const displayName = searchParams.get('displayName') || 'SOCI4L User'
        const bio = searchParams.get('bio') || 'Web3 Profile & Link Hub'
        const slug = searchParams.get('slug') || ''

        // Fetch background image
        const backgroundImage = await fetch(
            new URL('/og-background.png', request.url)
        ).then((res) => res.arrayBuffer())

        // Fetch logo
        const logoImage = await fetch(
            new URL('/logos/soci4l-logo.png', request.url)
        ).then((res) => res.arrayBuffer())

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                    }}
                >
                    {/* Background Image */}
                    <img
                        // @ts-ignore
                        src={backgroundImage}
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />

                    {/* Logo - Top Left */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 60,
                            left: 60,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <img
                            // @ts-ignore
                            src={logoImage}
                            width={180}
                            height={60}
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </div>

                    {/* Main Content - Center */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 120px',
                            textAlign: 'center',
                            zIndex: 10,
                        }}
                    >
                        {/* Display Name */}
                        <div
                            style={{
                                fontSize: 80,
                                fontWeight: 600,
                                color: '#fff',
                                marginBottom: 24,
                                maxWidth: '900px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontFamily: 'Geist Mono, monospace',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {displayName}
                        </div>

                        {/* Bio */}
                        {bio && (
                            <div
                                style={{
                                    fontSize: 32,
                                    color: '#a0a0a0',
                                    maxWidth: '800px',
                                    lineHeight: 1.4,
                                    fontFamily: 'Geist Mono, monospace',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {bio}
                            </div>
                        )}

                        {/* Slug */}
                        {slug && (
                            <div
                                style={{
                                    fontSize: 28,
                                    color: '#666',
                                    marginTop: 40,
                                    fontFamily: 'Geist Mono, monospace',
                                }}
                            >
                                soci4l.com/p/{slug}
                            </div>
                        )}
                    </div>

                    {/* Bottom Right Badge */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 50,
                            right: 60,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '16px 32px',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: 999,
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 20,
                                color: '#999',
                                fontFamily: 'Geist Mono, monospace',
                            }}
                        >
                            Web3 Profile
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        )
    } catch (e: any) {
        console.error('[OG Image] Error:', e.message)
        return new Response(`Failed to generate image`, {
            status: 500,
        })
    }
}
