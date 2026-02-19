/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
})

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  // Enable standalone output for optimized production builds
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Explicitly expose environment variables to the client bundle
  env: {
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
  },

  // Modular imports for tree-shaking (reduces bundle size)
  modularizeImports: {
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
  },

  // Generate stable build ID using git SHA for CDN cache efficiency
  generateBuildId: async () => {
    if (process.env.NODE_ENV === 'development') {
      return `dev-${Date.now()}`
    }
    try {
      const { execSync } = require('child_process')
      return execSync('git rev-parse HEAD').toString().trim()
    } catch {
      return `build-${Date.now()}`
    }
  },

  // Simplified dev indicators to reduce resource conflicts
  devIndicators: {
    buildActivity: false,
  },
  
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mobelo-products.s3.eu-west-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mobelo-products.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Enable experimental features with stability focus
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // Webpack configuration with production optimizations
  webpack: (config, { dev, isServer, buildId }) => {
    const isProd = process.env.NODE_ENV === 'production'
    // React Native Web configuration
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web',
      'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter$': 'react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter',
      'react-native/Libraries/vendor/emitter/EventEmitter$': 'react-native-web/dist/vendor/react-native/emitter/EventEmitter',
      'react-native/Libraries/EventEmitter/NativeEventEmitter$': 'react-native-web/dist/vendor/react-native/NativeEventEmitter',
    }

    config.resolve.extensions = [
      '.web.js',
      '.web.ts',
      '.web.tsx',
      ...config.resolve.extensions,
    ]

    // Improve development stability with proper cache busting
    if (dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }

      // Configure output for better cache busting in development
      config.output = {
        ...config.output,
        // Use content hash for chunks to ensure browser gets fresh code
        chunkFilename: dev
          ? `static/chunks/[name].[contenthash].js`
          : `static/chunks/[name].[contenthash].js`,
        // Clear cache on build ID change
        hashFunction: 'xxhash64',
      }

      // Optimize for development stability with cache management
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
        // Enable module IDs based on content for consistent builds
        moduleIds: 'deterministic',
      }

      // Configure caching to clear on buildId change
      if (config.cache && config.cache.type === 'filesystem') {
        config.cache.version = buildId
      }
    }

    // Production-specific webpack optimizations
    if (isProd && !isServer) {
      config.optimization = {
        ...config.optimization,
        // Enable aggressive code splitting
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for react/react-dom
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Separate chunk for large libraries
            lib: {
              test(module) {
                return (
                  module.size() > 160000 &&
                  /node_modules[/\\]/.test(module.identifier())
                )
              },
              name(module) {
                const hash = require('crypto').createHash('sha1')
                hash.update(module.identifier())
                return hash.digest('hex').substring(0, 8)
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // Common shared chunks
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
          },
          maxInitialRequests: 25,
          minSize: 20000,
        },
        // Minimize bundle size
        minimize: true,
      }
    }

    return config
  },
  // Add headers for better resource loading
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // JavaScript chunks - Different caching for dev vs production
      {
        source: '/(.*)\\.(js)',
        headers: [
          {
            key: 'Cache-Control',
            // In dev: no cache to ensure fresh code
            // In prod: long-term cache with immutable
            value: isDev
              ? 'no-cache, no-store, must-revalidate'
              : 'public, max-age=31536000, immutable',
          },
        ],
      },
      // CSS and other static assets
      {
        source: '/(.*)\\.(css|png|jpg|jpeg|gif|ico|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev
              ? 'no-cache, must-revalidate'
              : 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache fonts (can be cached even in dev)
      {
        source: '/(.*)\\.(woff|woff2|eot|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)