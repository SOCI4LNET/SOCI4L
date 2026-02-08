'use client'

import { PrivyProvider } from '@privy-io/react-auth'

export default function PrivyProviderWrapper({
    children,
}: {
    children: React.ReactNode
}) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''

    if (!appId) {
        console.warn('Privy App ID is missing. Verification features will be disabled.')
        return <>{children}</>
    }

    return (
        <PrivyProvider
            appId={appId}
            config={{
                loginMethods: ['email', 'wallet', 'google', 'twitter', 'github', 'discord'],
                appearance: {
                    theme: 'light',
                    accentColor: '#676FFF',
                    logo: 'https://soci4l.net/icon.svg',
                },
                embeddedWallets: {
                    createOnLogin: 'off',
                },
            }}
        >
            {children}
        </PrivyProvider>
    )
}
