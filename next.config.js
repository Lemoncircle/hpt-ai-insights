/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build configuration
  eslint: {
    // Don't run ESLint during production builds
    ignoreDuringBuilds: true,
    dirs: ['src'], // Only lint the src directory
  },

  typescript: {
    // Don't run type checking during production builds
    ignoreBuildErrors: true,
  },

  // Performance optimizations
  experimental: {
    optimizeCss: {
      cssModules: true,
      // Add critters configuration
      critters: {
        preload: 'media',
        pruneSource: true,
      },
    },
    optimizePackageImports: ['firebase', '@firebase/firestore'],
  },

  // Output configuration
  output: 'standalone',

  // Security headers
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
            value: 'max-age=31536000; includeSubDomains'
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
          },
        ],
      },
    ]
  },

  // Other configurations
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,

  // Image optimization
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true,
  },
}

module.exports = nextConfig 