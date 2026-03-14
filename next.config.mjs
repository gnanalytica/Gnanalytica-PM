/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,

  // PWA and mobile optimizations
  headers: async () => [
    {
      source: '/service-worker.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate'
        }
      ]
    },
    {
      source: '/manifest.json',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/manifest+json'
        }
      ]
    }
  ],

  // Optimize images for mobile
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp']
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['motion', 'recharts', '@dnd-kit/core', '@dnd-kit/sortable', 'cmdk', 'fuse.js'],
  },
};

export default nextConfig;
