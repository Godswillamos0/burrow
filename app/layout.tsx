import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BURROW_CONFIG } from '@/lib/config';
import { Providers } from './providers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const shareTitle = 'Burrow — 2,500 workers. Free mint on Robinhood Chain.';
const shareDescription = 'Dig through the mines. 2,500 workers. Free mint on Robinhood Chain. Join the waitlist.';

// OG/Twitter images come from app/opengraph-image.tsx; the favicon from app/icon.svg
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Burrow — Dig Through the Mines | 2,500 Workers Free Mint',
  description:
    'Underground Hill Climb–style driving game with 2,500 pixel miner NFTs and a free mint on Robinhood Chain. Join the waitlist to secure your allowlist spot.',
  keywords: ['Burrow', 'Robinhood Chain', 'Free Mint', 'Pixel Art', 'NFT', 'Driving Game', 'Allowlist', 'EVM'],
  authors: [{ name: 'Burrow' }],
  openGraph: {
    title: shareTitle,
    description: shareDescription,
    type: 'website',
    url: '/',
    siteName: 'Burrow',
  },
  twitter: {
    card: 'summary_large_image',
    title: shareTitle,
    description: shareDescription,
    site: BURROW_CONFIG.handle,
    creator: BURROW_CONFIG.handle,
  },
};

export const viewport: Viewport = {
  themeColor: '#10081c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-burrow-darkest text-burrow-cream antialiased selection:bg-amber-400 selection:text-black">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
