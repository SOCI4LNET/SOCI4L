/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Production build sırasında ESLint hatalarını ignore et
    ignoreDuringBuilds: true,
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
    
    return config
  },
}

module.exports = nextConfig
