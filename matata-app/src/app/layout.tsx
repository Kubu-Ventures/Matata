import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PrivyClientProvider } from '@/components/PrivyClientProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import OfflineBanner from '@/components/ui/OfflineBanner';
import SyncManager from '@/components/ui/SyncManager';
import OfflineDataPrefetcher from '@/components/ui/OfflineDataPrefetcher';
import InstallPrompt from '@/components/pwa/InstallPrompt';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

// Link previews (LinkedIn, WhatsApp, X) need absolute URLs. The preview image
// itself comes from app/opengraph-image.png, which Next.js turns into og:image tags.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.matatacrisis.xyz';
const SHARE_DESCRIPTION =
  'Report flood damage from any phone. No account, works offline, 10 languages. Every report is matched to a building, so responders see one map of the homes that need help.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Matata — Crisis Damage Reporting',
  description: 'Community crisis damage reporting platform. Submit damage reports with GPS location and photos to help field teams respond faster.',
  openGraph: {
    type: 'website',
    siteName: 'Matata',
    title: 'Matata — Crisis Damage Reporting',
    description: SHARE_DESCRIPTION,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Matata — Crisis Damage Reporting',
    description: SHARE_DESCRIPTION,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Matata',
  },
  icons: {
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#006EB5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <PrivyClientProvider>
          <LanguageProvider>
            <SyncManager />
            <OfflineDataPrefetcher />
            <OfflineBanner />
            <InstallPrompt />
            {children}
          </LanguageProvider>
        </PrivyClientProvider>
      </body>
    </html>
  );
}
