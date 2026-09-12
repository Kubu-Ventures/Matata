import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config, { webpack }) => {
    // @privy-io/react-auth dynamically imports this Farcaster mini-app wallet
    // connector, guarded by its own try/catch, only when running inside a
    // Farcaster mini-app (see the `document.referrer`/`window.farcaster`
    // check in its bundle). We only use Privy's email-OTP login and never
    // install this optional package, so webpack's static analysis of that
    // import() otherwise emits a "Module not found" warning on every build.
    // IgnorePlugin skips resolving it; Privy's own catch block already
    // handles the resulting rejection as "package not available".
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@farcaster\/mini-app-solana$/,
      })
    );
    return config;
  },
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