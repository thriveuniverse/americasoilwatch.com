import type { Metadata } from 'next';
import { getAllInsights } from '@/lib/insights';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Insights | AmericasOilWatch',
  description: 'In-depth analysis of Americas oil markets, supply routes, and producer dynamics from AmericasOilWatch editorial.',
  alternates: { canonical: 'https://americasoilwatch.com/insights' },
};

export default function InsightsPage() {
  const insights = getAllInsights();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">Insights</h1>
        <p className="mt-1 text-sm text-gray-400 max-w-2xl">
          In-depth analysis of Americas oil markets — spreads, supply routes, producer dynamics, and policy.
          Written for readers who already know the basics.
        </p>
      </div>

      {insights.length === 0 ? (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-8 text-center">
          <p className="text-gray-500 text-sm">No insights published yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map(i => (
            <a
              key={i.slug}
              href={`/insights/${i.slug}`}
              className="block rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4 hover:border-oil-600 hover:bg-oil-900/40 transition group"
            >
              <div className="flex items-center gap-2 mb-2 text-[10px] font-mono text-gray-600">
                <span>{new Date(i.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>·</span>
                <span>{i.readingMinutes} min read</span>
                {i.tags.slice(0, 3).map(t => (
                  <span key={t} className="px-1.5 py-0.5 rounded bg-oil-800/60 text-oil-300 border border-oil-700/50 ml-auto">{t}</span>
                ))}
              </div>
              <h2 className="text-base font-semibold text-white group-hover:text-oil-300 transition leading-snug mb-1">
                {i.title}
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">{i.excerpt}</p>
              <p className="mt-2 text-[11px] text-oil-400 group-hover:underline">Read full analysis →</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
