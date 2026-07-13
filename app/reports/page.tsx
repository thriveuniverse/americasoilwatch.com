import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Reports — Independent Systems Risk Analysis | AmericasOilWatch',
  description:
    'Long-form independent systems risk reports from AmericasOilWatch: compound-cascade models of structural fragility, from the global fertilizer disruption to UK structural decline.',
  alternates: { canonical: 'https://americasoilwatch.com/reports' },
  openGraph: {
    title: 'Reports — Independent Systems Risk Analysis',
    description:
      'Long-form compound-cascade risk models from AmericasOilWatch.',
    url: 'https://americasoilwatch.com/reports',
    siteName: 'AmericasOilWatch',
    type: 'website',
  },
};

const REPORTS = [
  {
    slug: 'from-hormuz-to-hunger',
    label: 'Systems Risk Analysis',
    title: 'From Hormuz to Hunger',
    excerpt:
      'How a Strait of Hormuz blockade propagates into a global fertilizer and food-security crisis — the gas-to-ammonia-to-grain chain traced as a single interacting system.',
  },
  {
    slug: 'the-fall-of-the-uk',
    label: 'Compound Cascade Risk Model',
    title: 'The Fall of the United Kingdom?',
    excerpt:
      '18 structural decline vectors, 100 interactions and 9 self-reinforcing feedback loops modelled as one system — a 40–70% probability of Accelerated Decline or worse by 2035, against 10–20% under additive assessment.',
  },
];

export default function ReportsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">Reports</h1>
        <p className="mt-1 text-sm text-gray-400 max-w-2xl">
          Long-form independent systems risk analysis — structural fragility modelled as interacting systems
          rather than isolated risks. Built on the Compound Cascade framework.
        </p>
      </div>

      <div className="space-y-3">
        {REPORTS.map(r => (
          <a
            key={r.slug}
            href={`/reports/${r.slug}`}
            className="block rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4 hover:border-oil-600 hover:bg-oil-900/40 transition group"
          >
            <div className="mb-2 text-[10px] font-mono font-semibold tracking-widest text-red-400 uppercase">
              {r.label}
            </div>
            <h2 className="text-base font-semibold text-white group-hover:text-oil-300 transition leading-snug mb-1">
              {r.title}
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">{r.excerpt}</p>
            <p className="mt-2 text-[11px] text-oil-400 group-hover:underline">Read the report →</p>
          </a>
        ))}
      </div>
    </div>
  );
}
