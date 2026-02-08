/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Production build sırasında ESLint hatalarını ignore et
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Production build sırasında TypeScript hatalarını ignore et
    // ⚠️ Bu geçici bir çözüm - ileride düzeltilmeli
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Suppress warnings for optional dependencies that are not needed in web environment
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // MetaMask SDK optional React Native dependency (not needed for web)
      '@react-native-async-storage/async-storage': false,
      // WalletConnect logger optional dependency (not needed for production)
      'pino-pretty': false,
    }

    // Prevent indexedDB from being used in SSR
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'idb': false,
        'idb-keyval': false,
      }
    }

    // Force unique instances for Context providers to avoid duplication issues
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tanstack/react-query': require('path').resolve(__dirname, 'node_modules/@tanstack/react-query'),
      'wagmi': require('path').resolve(__dirname, 'node_modules/wagmi'),
      'viem': require('path').resolve(__dirname, 'node_modules/viem'),
    }

    // Enable WebAssembly support for libraries like secp256k1
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    return config
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },
}

module.exports = nextConfig
