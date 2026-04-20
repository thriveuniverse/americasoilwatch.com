import type { Metadata } from 'next';
import { getAllBriefings } from '@/lib/briefings';
import SubscribeCta from '@/components/SubscribeCta';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Weekly Briefings Archive | AmericasOilWatch',
  description: 'Past issues of the AmericasOilWatch weekly briefing — WTI, US stocks, producer moves, and Americas supply-route risk.',
  alternates: { canonical: 'https://americasoilwatch.com/briefings' },
};

export default function BriefingsPage() {
  const briefings = getAllBriefings();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">Weekly Briefings Archive</h1>
        <p className="mt-1 text-sm text-gray-400 max-w-2xl">
          Past issues of the AmericasOilWatch weekly briefing. Plain-English analysis of
          WTI, US petroleum stocks, producer developments, and supply-route risk.
        </p>
      </div>

      {briefings.length === 0 ? (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-8 text-center space-y-2">
          <p className="text-gray-400 text-sm">The first briefing is on its way.</p>
          <p className="text-gray-500 text-xs">Subscribe below to get it in your inbox.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {briefings.map(b => (
            <a
              key={b.slug}
              href={`/briefings/${b.slug}`}
              className="block rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4 hover:border-oil-600 hover:bg-oil-900/40 transition group"
            >
              <p className="text-[10px] font-mono text-gray-600 mb-1">
                {new Date(b.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <h2 className="text-base font-semibold text-white group-hover:text-oil-300 transition leading-snug mb-1">
                {b.subject}
              </h2>
              {b.excerpt && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{b.excerpt}</p>}
              <p className="mt-2 text-[11px] text-oil-400 group-hover:underline">Read briefing →</p>
            </a>
          ))}
        </div>
      )}

      <SubscribeCta
        headline="Get next week's briefing"
        subtitle="Weekly Americas Energy Briefing — free, no spam. Join before Friday for this week's issue."
      />
    </div>
  );
}
