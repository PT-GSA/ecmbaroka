import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Supabase storage public URLs (adjust host to your project)
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return []
  },
  async rewrites() {
    return [
      // Proxy Supabase self-host endpoints through the app domain (production safety)
      { source: '/auth/v1/:path*', destination: 'https://baroka.csmigroup.id/auth/v1/:path*' },
      { source: '/rest/v1/:path*', destination: 'https://baroka.csmigroup.id/rest/v1/:path*' },
      { source: '/storage/v1/:path*', destination: 'https://baroka.csmigroup.id/storage/v1/:path*' },
      { source: '/realtime/v1/:path*', destination: 'https://baroka.csmigroup.id/realtime/v1/:path*' },
    ]
  },
  // Vercel optimizations
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Enable compression
  compress: true,
  // Power by header
  poweredByHeader: false,
  // Generate static pages
  // output: 'standalone', // Disabled for Vercel deployment
}

export default nextConfig
