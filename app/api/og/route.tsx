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
                        backgroundColor: '#000',
                        backgroundImage: 'radial-gradient(circle at 25px 25px, #333 2%, transparent 0%), radial-gradient(circle at 75px 75px, #333 2%, transparent 0%)',
                        backgroundSize: '100px 100px',
                    }}
                >
                    {/* Logo/Brand */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 40,
                            left: 40,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 32,
                                fontWeight: 700,
                                color: '#fff',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            SOCI4L
                        </div>
                    </div>

                    {/* Main Content */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 80px',
                            textAlign: 'center',
                        }}
                    >
                        {/* Display Name */}
                        <div
                            style={{
                                fontSize: 72,
                                fontWeight: 700,
                                color: '#fff',
                                marginBottom: 24,
                                maxWidth: '900px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {displayName}
                        </div>

                        {/* Bio */}
                        {bio && (
                            <div
                                style={{
                                    fontSize: 32,
                                    color: '#999',
                                    maxWidth: '800px',
                                    lineHeight: 1.4,
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
                                    marginTop: 32,
                                }}
                            >
                                soci4l.com/p/{slug}
                            </div>
                        )}
                    </div>

                    {/* Footer Badge */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 40,
                            right: 40,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '12px 24px',
                            backgroundColor: '#111',
                            borderRadius: 999,
                            border: '1px solid #333',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 20,
                                color: '#999',
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
