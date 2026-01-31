export type DemoMode = 'public' | 'sandbox' | 'investor'

export interface DemoProfile {
    id: string
    address: string
    slug: string | null
    ownerAddress: string | null
    status: 'CLAIMED' | 'UNCLAIMED'
    visibility: 'PUBLIC' | 'PRIVATE'
    claimedAt: string | null
    displayName?: string | null
    bio?: string | null
    primaryRole?: string | null
    secondaryRoles?: string[]
    statusMessage?: string | null
    socialLinks?: Array<{ id: string; platform: string; url: string; label?: string; category?: 'Social' | 'Portfolio' | 'Contact' | 'Other' }> | null
    theme?: string
    showcase?: Array<{ contractAddress: string; tokenId: string }>
    customLinks?: Array<{
        id: string
        title: string
        url: string
        enabled: boolean
        categoryId?: string | null
        order?: number
        createdAt: string
        updatedAt: string
    }> | null
    linkCategories?: Array<{
        id: string
        name: string
        slug: string
        description?: string | null
        order: number
        isVisible: boolean
        isDefault: boolean
        linkCount?: number
        createdAt: string
        updatedAt: string
    }> | null
}

export interface DemoWalletData {
    address: string
    nativeBalance: string
    tokenBalances: Array<{
        contractAddress: string
        name: string
        symbol: string
        balance: string
        decimals: number
        logoUrl?: string
    }>
    nfts: Array<{
        contractAddress: string
        tokenId: string
        name?: string
        image?: string
        collectionName?: string
    }>
    transactions: Array<{
        hash: string
        from: string
        to: string
        value: string
        timestamp: number
        blockNumber: number
        type: 'send' | 'receive' | 'mint' | 'contract_interaction'
    }>
    txCount: number
    firstSeen?: number
    lastSeen?: number
}

export interface DemoSession {
    id: string
    mode: DemoMode
    createdAt: number
    profileOverrides: Partial<DemoProfile>
    walletOverrides: Partial<DemoWalletData> // Usually empty, but allowed
    statsOverrides?: {
        followers?: number
        following?: number
        views7d?: number
    }
    selectedDataset: 'builder' | 'creator' | 'collector' | 'trader'
}

export interface DemoContextType {
    mode: DemoMode
    session: DemoSession | null
    profile: DemoProfile
    walletData: DemoWalletData
    isLoading: boolean
    startSandbox: () => void
    resetDemo: () => void
    updateProfile: (overrides: Partial<DemoProfile>) => void
    setDataset: (dataset: DemoSession['selectedDataset']) => void
    simulateAction: (action: string, payload?: any) => void
    isDemo: boolean
}
