import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
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
}

export default nextConfig
