/** @type {import('next').NextConfig} */
const nextConfig = {
  // Served under /admin so one ngrok tunnel / gateway can host the admin
  // panel alongside the storefront (see tools/ngrok-gateway.js).
  basePath: '/admin',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'source.unsplash.com' },
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
    ];
  },
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        // Friendly root redirect: localhost:3001/ → /admin/
        // The app only serves under basePath '/admin', so without this anyone
        // who forgets the prefix gets a 404 on the root. basePath: false keeps
        // these patterns relative to the raw URL (not auto-prefixed with
        // '/admin', which would create a redirect loop).
        source: '/',
        destination: '/admin',
        basePath: false,
        permanent: false,
      },
    ];
  },
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
