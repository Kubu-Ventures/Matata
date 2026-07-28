import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import OfflineBanner from '@/components/ui/OfflineBanner';
import SyncManager from '@/components/ui/SyncManager';
import InstallPrompt from '@/components/pwa/InstallPrompt';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Matata — Crisis Damage Reporting',
  description: 'Community crisis damage reporting platform. Submit damage reports with GPS location and photos to help field teams respond faster.',
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
        <LanguageProvider>
          <SyncManager />
          <OfflineBanner />
          <InstallPrompt />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
