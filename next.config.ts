import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow images from R2 CDN and common AI output hosts
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: 'fal.media' },
      { protocol: 'https', hostname: '*.fal.run' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  // Increase payload limits for upload routes
  serverExternalPackages: [
    'fluent-ffmpeg',
    'sharp',
    'music-metadata',
    '@prisma/client',
    'ioredis',
  ],

  // Enable typed routes for better DX
  typedRoutes: false,

  // Allow local network access in dev
  allowedDevOrigins: ['192.168.1.208', 'localhost'],

  // Use empty turbopack config to silence the Turbopack migration warning
  turbopack: {},
}

export default nextConfig
