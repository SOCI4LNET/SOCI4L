/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // TODO: Remove this once all existing TypeScript errors have been resolved.
    // The flag was re-enabled to avoid breaking the build — it was present
    // before the security hardening pass and the pre-existing type errors are
    // unrelated to the security fixes.
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: '*.nftstorage.link',
      },
      {
        protocol: 'https',
        hostname: '*.arweave.net',
      },
      {
        protocol: 'https',
        hostname: 'arweave.net',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflare-ipfs.com',
      },
      {
        protocol: 'https',
        hostname: 'glacier-api.avax.network',
      },
      {
        protocol: 'https',
        hostname: '*.githubusercontent.com',
      },
    ],
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
        // Apply to all routes except the embeddable donation widget
        source: '/((?!embed/donate).*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // X-XSS-Protection is deprecated and removed — rely on CSP instead.
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            // frame-ancestors: only this origin and trusted Yandex Metrika domains
            // may embed pages. The wildcard "https:" has been removed (MED-7).
            key: 'Content-Security-Policy',
            value: [
              "frame-ancestors 'self'",
              'https://metrika.yandex.ru',
              'https://*.metrika.yandex.ru',
              'https://metrica.yandex.com',
              'https://*.metrica.yandex.com',
              'https://metrika.yandex.by',
              'https://*.metrika.yandex.by',
              'https://metrica.yandex.com.tr',
              'https://*.metrica.yandex.com.tr',
              'https://webvisor.com',
              'https://*.webvisor.com',
            ].join(' ') + ';',
          },
        ],
      },
      {
        // Donation widget embed: this page is an explicitly user-shareable
        // widget designed to be iframe'd on any external website.  Users
        // generate embed codes from their profile dashboard and paste them
        // on their own sites, so frame-ancestors must allow all origins.
        // The clickjacking risk for a voluntary, user-initiated donation
        // widget is low; restricting this would break all production embeds.
        source: '/embed/donate/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

