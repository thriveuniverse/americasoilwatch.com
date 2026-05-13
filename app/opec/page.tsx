import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import OpecPlusTracker, { type OpecData } from '@/components/OpecPlusTracker';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'OPEC+ Production Tracker — AmericasOilWatch',
  description:
    'OPEC+ member production from EIA international data, set against the Declaration of Cooperation quota schedule. Updated monthly. Includes structural context for the Hormuz war period (3-month EIA publication lag disclosed).',
  alternates: { canonical: 'https://americasoilwatch.com/opec' },
};

function loadJson<T>(filename: string): T | null {
  const p = path.join(process.cwd(), 'data', filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as T; } catch { return null; }
}

export default function OpecPage() {
  const data = loadJson<OpecData>('opec.json');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">OPEC+ Production Tracker</h1>
        <p className="mt-2 text-sm text-gray-400 max-w-2xl">
          Monthly crude-and-condensate production for the 18 OPEC and Declaration of Cooperation
          partner countries, set against the published quota schedule. The single most important
          variable for WTI–Brent dynamics, US shale economics, and the post-Russia European diversification.
        </p>
      </div>

      {data ? (
        <OpecPlusTracker data={data} />
      ) : (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-8 text-center">
          <p className="text-sm text-gray-400">OPEC data not yet populated.</p>
          <p className="text-xs text-gray-600 mt-1">The page will refresh once <code>npm run fetch:opec</code> next runs.</p>
        </div>
      )}

      {/* Why this matters */}
      <section className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4 space-y-3">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          Why OPEC+ matters for Americas
        </h2>
        <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
          <p>
            <span className="text-gray-300 font-medium">US shale–OPEC+ dynamic.</span>{' '}
            For most of the 2010s, OPEC&apos;s production decisions were the dominant variable for
            global oil prices, and US shale was the price-taker. Since 2020 that relationship has
            inverted into a balance: US production hit record highs (currently around 13.5 mbpd),
            making the US the world&apos;s largest crude producer and a meaningful constraint on what
            OPEC+ can achieve through supply discipline alone.
          </p>
          <p>
            <span className="text-gray-300 font-medium">Compliance is structurally imperfect.</span>{' '}
            Member quotas in the Declaration of Cooperation are routinely missed at the country
            level — typically with persistent over-production from Iraq, the UAE, Kazakhstan, and
            historically Russia, balanced by Saudi Arabia absorbing the discipline. Iran, Venezuela
            and Libya have exempt status due to sanctions or instability and their production swings
            on geopolitics rather than quota.
          </p>
          <p>
            <span className="text-gray-300 font-medium">JMMC meetings move markets.</span>{' '}
            The Joint Ministerial Monitoring Committee meets approximately every two months. Its
            statements (extension, deepening, or unwinding of voluntary cuts) are the primary
            calendar event for crude markets in normal conditions.
          </p>
          <p>
            <span className="text-gray-300 font-medium">Post-war context.</span>{' '}
            In the current Hormuz scenario, OPEC+ Gulf production is physically stranded rather than
            quota-constrained — Saudi, UAE, Kuwaiti and Iraqi barrels are produced but cannot ship.
            That makes the historic compliance frame less useful; the relevant metric becomes
            <em> capacity stranded by the strait closure</em>, not <em>quota cheating</em>. See the
            <a href="/insights/iran-blockade-two-stories" className="text-oil-400 hover:underline">{' '}Iran-blockade analysis</a> for the full picture.
          </p>
        </div>
      </section>

      {/* Sister sites */}
      <section className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-3">Also relevant</h2>
        <ul className="space-y-1.5 text-xs text-gray-400">
          <li>
            <a href="/insights/wti-brent-spread-americas-exports" className="text-oil-300 hover:underline">Why the WTI–Brent Spread Matters for Americas Exports</a>{' '}
            — companion piece on how the spread responds to OPEC+ moves.
          </li>
          <li>
            <a href="https://eurooilwatch.com/gas" target="_blank" rel="noopener" className="text-oil-300 hover:underline">EuroOilWatch Gas Tracker ↗</a>{' '}
            — Europe&apos;s post-Russia diversification picture, the natural-gas counterpart to OPEC+ for European energy security.
          </li>
        </ul>
      </section>
    </div>
  );
}
