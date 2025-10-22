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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://baroka.csmigroup.id https://shop.susubaroka.com https://analytics.ahrefs.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com https://stats.g.doubleclick.net wss://baroka.csmigroup.id; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
        ],
      },
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
