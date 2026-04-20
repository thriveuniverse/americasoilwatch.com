import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import NewsClient from '@/components/NewsClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'News | AmericasOilWatch',
  description: 'Latest Americas oil, fuel, and energy supply news aggregated from OilPrice.com, EIA, Rigzone, and CREA.',
  alternates: { canonical: 'https://americasoilwatch.com/news' },
};

export default function NewsPage() {
  const p = path.join(process.cwd(), 'data', 'news-feed.json');
  const feed = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">Americas Energy News</h1>
        <p className="mt-1 text-sm text-gray-400">
          Latest oil &amp; fuel supply news from leading energy sources.
        </p>
      </div>

      {feed ? (
        <NewsClient
          articles={feed.articles ?? []}
          summary={feed.summary ?? null}
          lastUpdated={feed.lastUpdated ?? null}
        />
      ) : (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-8 text-center space-y-2">
          <p className="text-gray-500 text-sm">News feed not yet fetched.</p>
          <p className="text-gray-600 text-xs">
            Run: <code className="font-mono">npm run fetch:news</code>
          </p>
        </div>
      )}
    </div>
  );
}
