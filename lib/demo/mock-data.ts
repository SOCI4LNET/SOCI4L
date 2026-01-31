import { DemoProfile, DemoWalletData } from './types'

const MOCK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' // Vitalik's address as placeholder

export const DATASETS: Record<string, { profile: DemoProfile; walletData: DemoWalletData }> = {
  builder: {
    profile: {
      id: 'demo-builder',
      address: MOCK_ADDRESS,
      slug: 'builder-demo',
      ownerAddress: MOCK_ADDRESS,
      status: 'CLAIMED',
      visibility: 'PUBLIC',
      claimedAt: new Date().toISOString(),
      displayName: 'Avalanche Builder',
      bio: 'Building the future of subnets. Core contributor. Rust & Solidity.',
      primaryRole: 'Builder',
      secondaryRoles: ['Engineer', 'Contributor'],
      statusMessage: 'Shipping v2 soon 🚢',
      socialLinks: [
        { id: '1', platform: 'twitter', url: 'https://twitter.com/avalancheavax', label: '@avalancheavax', category: 'Social' },
        { id: '2', platform: 'github', url: 'https://github.com/ava-labs', label: 'ava-labs', category: 'Portfolio' },
        { id: '3', platform: 'website', url: 'https://avax.network', label: 'avax.network', category: 'Social' },
      ],
      customLinks: [
        { id: '1', title: 'My Portfolio', url: 'https://myportfolio.com', enabled: true, categoryId: 'cat-1', order: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', title: 'Latest Project', url: 'https://github.com/my-project', enabled: true, categoryId: 'cat-1', order: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '3', title: 'Schedule a Call', url: 'https://calendly.com/me', enabled: true, categoryId: 'cat-2', order: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
      linkCategories: [
        { id: 'cat-1', name: 'Projects', slug: 'projects', order: 0, isVisible: true, isDefault: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'cat-2', name: 'Contact', slug: 'contact', order: 1, isVisible: true, isDefault: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'default', name: 'General', slug: 'general', order: 2, isVisible: true, isDefault: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
    },
    walletData: {
      address: MOCK_ADDRESS,
      nativeBalance: '145.20',
      tokenBalances: [
        { contractAddress: '0x1', name: 'Wrapped AVAX', symbol: 'WAVAX', balance: '500.00', decimals: 18 },
        { contractAddress: '0x2', name: 'USDC', symbol: 'USDC', balance: '2500.00', decimals: 6 },
        { contractAddress: '0x3', name: 'JOE', symbol: 'JOE', balance: '1200.00', decimals: 18 },
      ],
      nfts: [
        { contractAddress: '0x4', tokenId: '1', name: 'Avax Build #42', collectionName: 'Build Hq' },
        { contractAddress: '0x5', tokenId: '101', name: 'Summit 2024 POAP', collectionName: 'POAP' },
      ],
      transactions: Array(15).fill(null).map((_, i) => ({
        hash: `0x${Math.random().toString(16).slice(2)}`,
        from: MOCK_ADDRESS,
        to: `0x${Math.random().toString(16).slice(2)}`,
        value: (Math.random() * 10).toFixed(2),
        timestamp: Math.floor(Date.now() / 1000) - (i * 43200), // ~12 hours apart
        blockNumber: 12345678 - i,
        type: i % 3 === 0 ? 'contract_interaction' : i % 2 === 0 ? 'send' : 'receive',
      })),
      txCount: 142,
      firstSeen: Math.floor(Date.now() / 1000) - (365 * 86400),
      lastSeen: Math.floor(Date.now() / 1000),
    },
  },

  creator: {
    profile: {
      id: 'demo-creator',
      address: MOCK_ADDRESS,
      slug: 'creator-demo',
      ownerAddress: MOCK_ADDRESS,
      status: 'CLAIMED',
      visibility: 'PUBLIC',
      claimedAt: new Date().toISOString(),
      displayName: 'Digital Artist',
      bio: 'Exploring the intersection of art and code. 3D Generative Art on Avalanche.',
      primaryRole: 'Creator',
      secondaryRoles: ['Artist', 'Designer'],
      statusMessage: 'New drop live! 🎨',
      socialLinks: [
        { id: '1', platform: 'instagram', url: 'https://instagram.com/avalanche', label: 'IG', category: 'Social' },
        { id: '2', platform: 'website', url: 'https://artblocks.io', label: 'Portfolio', category: 'Portfolio' },
      ],
    },
    walletData: {
      address: MOCK_ADDRESS,
      nativeBalance: '45.50',
      tokenBalances: [
        { contractAddress: '0x1', name: 'Wrapped AVAX', symbol: 'WAVAX', balance: '120.00', decimals: 18 },
      ],
      nfts: [
        { contractAddress: '0x6', tokenId: '88', name: 'Gen Art #88', collectionName: 'Gen Art Collection', image: 'https://placehold.co/400x400/purple/white?text=NFT' },
        { contractAddress: '0x6', tokenId: '89', name: 'Gen Art #89', collectionName: 'Gen Art Collection', image: 'https://placehold.co/400x400/blue/white?text=NFT' },
        { contractAddress: '0x6', tokenId: '90', name: 'Gen Art #90', collectionName: 'Gen Art Collection', image: 'https://placehold.co/400x400/pink/white?text=NFT' },
        { contractAddress: '0x7', tokenId: '12', name: 'Community Pass', collectionName: 'Access' },
      ],
      transactions: Array(8).fill(null).map((_, i) => ({
        hash: `0x${Math.random().toString(16).slice(2)}`,
        from: MOCK_ADDRESS,
        to: `0x${Math.random().toString(16).slice(2)}`,
        value: '0',
        timestamp: Math.floor(Date.now() / 1000) - (i * 172800), // ~2 days apart
        blockNumber: 12345678 - i * 100,
        type: 'mint',
      })),
      txCount: 45,
      firstSeen: Math.floor(Date.now() / 1000) - (180 * 86400),
      lastSeen: Math.floor(Date.now() / 1000),
    },
  },

  collector: {
    profile: {
      id: 'demo-collector',
      address: MOCK_ADDRESS,
      slug: 'collector-demo',
      ownerAddress: MOCK_ADDRESS,
      status: 'CLAIMED',
      visibility: 'PUBLIC',
      claimedAt: new Date().toISOString(),
      displayName: 'NFT Vault',
      bio: 'Collecting rare historical NFTs on C-Chain. WAGMI.',
      primaryRole: 'Collector',
      secondaryRoles: ['Investor', 'Whale'],
      statusMessage: 'Looking for OGs',
      socialLinks: [],
    },
    walletData: {
      address: MOCK_ADDRESS,
      nativeBalance: '9500.00',
      tokenBalances: [],
      nfts: Array(12).fill(null).map((_, i) => ({
        contractAddress: `0x${i}`,
        tokenId: `${i}`,
        name: `Blue Chip #${i}`,
        collectionName: 'Blue Chip Collection',
        image: `https://placehold.co/400x400/orange/white?text=Rare+${i}`
      })),
      transactions: Array(20).fill(null).map((_, i) => ({
        hash: `0x${Math.random().toString(16).slice(2)}`,
        from: MOCK_ADDRESS,
        to: `0x${Math.random().toString(16).slice(2)}`,
        value: (Math.random() * 50).toFixed(2),
        timestamp: Math.floor(Date.now() / 1000) - (i * 86400), // 1 day apart
        blockNumber: 12345678 - i * 50,
        type: 'contract_interaction',
      })),
      txCount: 350,
      firstSeen: Math.floor(Date.now() / 1000) - (700 * 86400),
      lastSeen: Math.floor(Date.now() / 1000),
    },
  },

  trader: {
    profile: {
      id: 'demo-trader',
      address: MOCK_ADDRESS,
      slug: 'trader-demo',
      ownerAddress: MOCK_ADDRESS,
      status: 'CLAIMED',
      visibility: 'PUBLIC',
      claimedAt: new Date().toISOString(),
      displayName: 'DeFi Degen',
      bio: 'Farming yields across the ecosystem. If it’s not APY > 100%, I sleep.',
      primaryRole: 'Trader',
      secondaryRoles: ['Farmer', 'Speculator'],
      statusMessage: 'Watching GMX',
      socialLinks: [
        { id: '1', platform: 'telegram', url: 'https://t.me/avalanche', label: 'Alpha Group', category: 'Social' },
      ],
    },
    walletData: {
      address: MOCK_ADDRESS,
      nativeBalance: '25.00',
      tokenBalances: [
        { contractAddress: '0x2', name: 'USDC', symbol: 'USDC', balance: '54000.00', decimals: 6 },
        { contractAddress: '0x3', name: 'GMX', symbol: 'GMX', balance: '250.00', decimals: 18 },
        { contractAddress: '0x4', name: 'BTC.b', symbol: 'BTC.b', balance: '0.45', decimals: 8 },
      ],
      nfts: [],
      transactions: Array(50).fill(null).map((_, i) => ({
        hash: `0x${Math.random().toString(16).slice(2)}`,
        from: MOCK_ADDRESS,
        to: `0x${Math.random().toString(16).slice(2)}`,
        value: (Math.random() * 100).toFixed(2),
        timestamp: Math.floor(Date.now() / 1000) - (i * 3600), // 1 hour apart
        blockNumber: 12345678 - i * 10,
        type: 'contract_interaction',
      })),
      txCount: 1250,
      firstSeen: Math.floor(Date.now() / 1000) - (100 * 86400),
      lastSeen: Math.floor(Date.now() / 1000),
    },
  },
}

export const DEFAULT_DATASET = 'builder'

export function getCanonicalData(dataset: string = DEFAULT_DATASET) {
  return DATASETS[dataset] || DATASETS[DEFAULT_DATASET]
}
