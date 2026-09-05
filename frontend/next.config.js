// Load the single project-wide .env at the repo root so the frontend shares
// ONE config file with the backend. NEXT_PUBLIC_* values from it are inlined
// into the browser bundle at build time.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      // Dev server (backend on localhost:5000)
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      // Stock/placeholder images
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'source.unsplash.com' },
      // Google Shopping images
      { protocol: 'https', hostname: 'encrypted-tbn*.gstatic.com' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      { protocol: 'https', hostname: 'encrypted-tbn1.gstatic.com' },
      { protocol: 'https', hostname: 'encrypted-tbn2.gstatic.com' },
      { protocol: 'https', hostname: 'encrypted-tbn3.gstatic.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // Cache static assets aggressively (production only — Next.js manages this in dev)
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              source: '/_next/static/(.*)',
              headers: [
                { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
              ],
            },
          ]
        : []),
      // Cache static images in /public
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      // Cache fonts
      {
        source: '/fonts/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Proxy admin-uploaded product images from the backend
      {
        source: '/uploads/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/:path*`,
      },
    ];
  },
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  experimental: {
    prerenderEarlyExit: false,
    staticGenerationRetryCount: 3,
  },
};

module.exports = nextConfig;
