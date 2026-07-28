import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  extendDefaultRuntimeCaching: true,
  fallbacks: {
    document: '/~offline',
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === 'navigate', // now inferred correctly
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages',
          expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
    ],
  },
})(nextConfig);