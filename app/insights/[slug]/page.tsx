import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getInsight, getAllInsights } from '@/lib/insights';
import SubscribeCta from '@/components/SubscribeCta';

export const revalidate = 3600;

export function generateStaticParams() {
  return getAllInsights().map(i => ({ slug: i.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const insight = getInsight(params.slug);
  if (!insight) return { title: 'Not found' };
  return {
    title: `${insight.title} | AmericasOilWatch`,
    description: insight.excerpt,
    alternates: { canonical: `https://americasoilwatch.com/insights/${params.slug}` },
    openGraph: {
      title: insight.title,
      description: insight.excerpt,
      type: 'article',
      publishedTime: insight.date,
      authors: [insight.author],
    },
  };
}

export default function InsightPage({ params }: { params: { slug: string } }) {
  const insight = getInsight(params.slug);
  if (!insight) notFound();

  return (
    <article className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/insights" className="text-xs text-oil-400 hover:underline">← All insights</a>
        <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-gray-600 mb-3">
          <span>{new Date(insight.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span>·</span>
          <span>{insight.author}</span>
          <span>·</span>
          <span>{insight.readingMinutes} min read</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{insight.title}</h1>
        <p className="mt-3 text-base text-gray-400 leading-relaxed">{insight.excerpt}</p>
        {insight.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {insight.tags.map(t => (
              <span key={t} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-oil-900/60 text-oil-300 border border-oil-800">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        className="prose-article text-sm text-gray-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: insight.html }}
      />

      <SubscribeCta
        variant="compact"
        headline="Get analysis like this in your inbox"
        subtitle="Weekly Americas Energy Briefing — supply, prices, geopolitics. Free, no spam."
      />

      <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4 text-xs text-gray-500">
        <p>
          Written by AmericasOilWatch editorial. For corrections or story tips,
          email <a href="mailto:jon@americasoilwatch.com" className="text-oil-400 hover:underline">jon@americasoilwatch.com</a>.
        </p>
      </div>
    </article>
  );
}
