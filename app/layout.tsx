import type { Metadata } from 'next';
import './globals.css';
import MobileNav from '@/components/MobileNav';

export const metadata: Metadata = {
  metadataBase: new URL('https://americasoilwatch.com'),
  title: {
    default: 'AmericasOilWatch — Western Hemisphere Oil & Fuel Intelligence',
    template: '%s | AmericasOilWatch',
  },
  description:
    'Track oil production, WTI crude prices, US petroleum stocks, and supply route risk across the Americas — from Canada to Patagonia. EIA data, AI analysis, daily updates.',
  keywords: [
    'Americas oil markets', 'WTI crude price', 'US petroleum stocks', 'EIA data',
    'oil production Americas', 'Panama Canal oil', 'Guyana oil', 'Brazil Petrobras',
    'Canadian oil sands', 'Venezuela crude', 'Americas energy security',
    'fuel prices Americas', 'oil watch Americas', 'Western Hemisphere energy',
  ],
  authors: [{ name: 'AmericasOilWatch' }],
  creator: 'AmericasOilWatch',
  publisher: 'AmericasOilWatch',
  openGraph: {
    title: 'AmericasOilWatch — Western Hemisphere Oil & Fuel Intelligence',
    description: 'WTI price, US petroleum stocks, producer snapshots, and supply route risk — Canada to Patagonia.',
    url: 'https://americasoilwatch.com',
    siteName: 'AmericasOilWatch',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AmericasOilWatch — Americas oil intelligence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AmericasOilWatch — Western Hemisphere Oil Intelligence',
    description: 'WTI price, US petroleum stocks, and Americas producer data — updated daily.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: 'https://americasoilwatch.com' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#06111f" />
      </head>
      <body className="min-h-screen bg-oil-950 text-gray-200 antialiased">
        <header className="border-b border-oil-800 bg-oil-950/80 backdrop-blur sticky top-0 z-50">
          <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2" aria-label="AmericasOilWatch home">
              <span className="text-2xl" role="img" aria-label="Oil barrel">🛢️</span>
              <div>
                <span className="font-bold text-lg tracking-tight text-white">
                  Americas<span className="text-oil-400">Oil</span>Watch
                </span>
                <span className="hidden sm:inline text-xs text-gray-500 ml-2">
                  Fuel security intelligence for the Western Hemisphere
                </span>
              </div>
            </a>
            <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-400" aria-label="Main navigation">
              <a href="/" className="hover:text-white transition">Dashboard</a>
              <a href="/supply" className="hover:text-white transition">Supply Routes</a>
              <a href="/prices" className="hover:text-white transition">Prices</a>
              <a href="/analysis" className="hover:text-white transition">Analysis</a>
              <a href="/news" className="hover:text-white transition">News</a>
              <a href="/methodology" className="hover:text-white transition">Methodology</a>
              <a href="/about" className="hover:text-white transition">About</a>
            </nav>
            <MobileNav />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6" role="main">{children}</main>

        <footer className="border-t border-oil-800 mt-12" role="contentinfo">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="text-xs text-gray-500 max-w-lg">
                <p>
                  AmericasOilWatch monitors oil production, prices, and supply routes across
                  the Western Hemisphere using EIA, Petrobras, and other public data sources.
                  Independent. Not affiliated with any government or energy company.
                  Nothing on this site constitutes financial advice.
                </p>
              </div>
              <div className="flex flex-col sm:items-end gap-1 text-xs text-gray-500">
                <div className="flex gap-4">
                  <a href="/" className="hover:text-gray-300">Dashboard</a>
                  <a href="/supply" className="hover:text-gray-300">Supply Routes</a>
                  <a href="/methodology" className="hover:text-gray-300">Methodology</a>
                  <a href="/about" className="hover:text-gray-300">About</a>
                </div>
                <div className="flex gap-4">
                  <a href="https://eurooilwatch.com" className="hover:text-gray-300">EU Data →</a>
                  <a href="https://ukoilwatch.com" className="hover:text-gray-300">UK Data →</a>
                  <a href="mailto:jon@americasoilwatch.com" className="hover:text-gray-300">Contact</a>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-gray-600">
              © {new Date().getFullYear()} AmericasOilWatch ·{' '}
              <a href="mailto:jon@americasoilwatch.com" className="hover:text-gray-400">jon@americasoilwatch.com</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
