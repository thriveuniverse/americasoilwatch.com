'use client';

import { useState, useMemo } from 'react';

interface Article {
  title: string;
  link: string;
  date: string;
  source: string;
  description: string;
  category: string;
}

interface Props {
  articles: Article[];
  summary: string | null;
  lastUpdated: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  Geopolitics:    'bg-red-900/40 text-red-300 border-red-800/60',
  Prices:         'bg-yellow-900/40 text-yellow-300 border-yellow-800/60',
  Refinery:       'bg-blue-900/40 text-blue-300 border-blue-800/60',
  Policy:         'bg-purple-900/40 text-purple-300 border-purple-800/60',
  'Supply Routes':'bg-teal-900/40 text-teal-300 border-teal-800/60',
  Production:     'bg-orange-900/40 text-orange-300 border-orange-800/60',
  General:        'bg-oil-900/40 text-oil-300 border-oil-800/60',
};

const ALL_CATEGORIES = ['All', 'Geopolitics', 'Prices', 'Production', 'Refinery', 'Supply Routes', 'Policy', 'General'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isWithin7Days(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 7 * 24 * 60 * 60 * 1000;
}

export default function NewsClient({ articles, summary, lastUpdated }: Props) {
  const [timeFilter, setTimeFilter]     = useState<'all' | '7d'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filtered = useMemo(() => {
    return articles.filter(a => {
      if (timeFilter === '7d' && !isWithin7Days(a.date)) return false;
      if (categoryFilter !== 'All' && a.category !== categoryFilter) return false;
      return true;
    });
  }, [articles, timeFilter, categoryFilter]);

  const categoryColor = (cat: string) =>
    CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['General'];

  return (
    <div className="space-y-6">

      {/* AI summary */}
      {summary && (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4">
          <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider mb-3">
            This week&apos;s top supply-risk themes
          </p>
          <ul className="space-y-2">
            {summary.split('\n').filter(l => l.trim().startsWith('•')).map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-oil-400 flex-shrink-0 mt-0.5">›</span>
                {line.replace(/^•\s*/, '')}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] text-gray-600">
            From AI analysis of latest news feeds
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Time filter */}
        <div className="flex rounded border border-oil-800 overflow-hidden text-xs">
          {(['all', '7d'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`px-3 py-1.5 transition ${
                timeFilter === t
                  ? 'bg-oil-400 text-white font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-oil-900/60'
              }`}
            >
              {t === 'all' ? 'All time' : 'Last 7 days'}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded text-xs border transition ${
                categoryFilter === cat
                  ? 'bg-oil-400 text-white border-oil-400 font-semibold'
                  : 'text-gray-400 border-oil-800 hover:text-white hover:border-oil-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Count */}
        <span className="ml-auto text-xs text-gray-600 flex-shrink-0">
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Article list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-8 text-center">
          <p className="text-gray-500 text-sm">No articles match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((article, i) => (
            <a
              key={i}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4 hover:border-oil-600 hover:bg-oil-900/40 transition group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${categoryColor(article.category)}`}>
                  {article.category}
                </span>
                <span className="text-[11px] text-gray-500">{article.source}</span>
                <span className="text-[11px] text-gray-600 ml-auto flex-shrink-0">{formatDate(article.date)}</span>
              </div>
              <p className="text-sm font-medium text-white group-hover:text-oil-300 transition leading-snug mb-1">
                {article.title}
              </p>
              {article.description && (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {article.description}
                </p>
              )}
              <p className="mt-2 text-[11px] text-oil-400 group-hover:underline">
                Read full article →
              </p>
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      {lastUpdated && (
        <p className="text-center text-[10px] text-gray-700">
          Feed last updated {new Date(lastUpdated).toLocaleString('en-US')} ·{' '}
          Sources: OilPrice.com, EIA, Rigzone, CREA
        </p>
      )}
    </div>
  );
}
