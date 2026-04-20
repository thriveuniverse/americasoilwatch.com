import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBriefing, getAllBriefings } from '@/lib/briefings';
import SubscribeCta from '@/components/SubscribeCta';

export const revalidate = 3600;

export function generateStaticParams() {
  return getAllBriefings().map(b => ({ slug: b.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const b = getBriefing(params.slug);
  if (!b) return { title: 'Not found' };
  return {
    title: `${b.subject} | AmericasOilWatch`,
    description: b.excerpt,
    alternates: { canonical: `https://americasoilwatch.com/briefings/${params.slug}` },
  };
}

export default function BriefingPage({ params }: { params: { slug: string } }) {
  const b = getBriefing(params.slug);
  if (!b) notFound();

  return (
    <article className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/briefings" className="text-xs text-oil-400 hover:underline">← All briefings</a>
        <p className="mt-2 text-[10px] font-mono text-gray-600 mb-2">
          {new Date(b.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} · Weekly Briefing
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{b.subject}</h1>
      </div>

      <div
        className="prose-article text-sm text-gray-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: b.html }}
      />

      <SubscribeCta
        variant="compact"
        headline="Get next week's briefing"
        subtitle="Americas energy intelligence, weekly, in your inbox. Free."
      />
    </article>
  );
}
