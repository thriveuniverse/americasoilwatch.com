import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Public API — AmericasOilWatch',
  description:
    'Free, read-only JSON API exposing the data that powers the AmericasOilWatch dashboard: WTI, Brent, US commercial crude / SPR / gasoline / distillate stocks, retail pump prices. CORS-enabled, no auth.',
  alternates: { canonical: 'https://americasoilwatch.com/api' },
};

const RESOURCES = [
  { name: 'wti',                desc: 'Current WTI crude price (Cushing, OK)',                                  source: 'Stooq cl.f → EIA daily fallback' },
  { name: 'wti-history',        desc: 'WTI price history',                                                       source: 'Stooq / EIA RWTC' },
  { name: 'brent',              desc: 'Current Brent crude price (front-month futures)',                          source: 'Stooq (cb.f)' },
  { name: 'brent-history',      desc: 'Brent price history',                                                      source: 'Stooq' },
  { name: 'brent-eia-daily',    desc: 'EIA Europe Brent Spot Price FOB daily series, since 20 May 1987',          source: 'U.S. EIA (RBRTE)' },
  { name: 'us-stocks',          desc: 'US commercial crude, gasoline, distillate, SPR stocks and production',     source: 'U.S. EIA Weekly Petroleum Status Report' },
  { name: 'us-prices',          desc: 'US weekly retail gasoline and diesel prices',                              source: 'U.S. EIA' },
  { name: 'bunker',             desc: 'Marine bunker fuel price estimates (VLSFO / MGO)',                         source: 'Derived from Brent' },
  { name: 'bunker-history',     desc: 'Rolling history of bunker fuel estimates',                                 source: 'Derived from Brent' },
  { name: 'sea-state',          desc: 'Live wave height + wind at key oil-shipping chokepoints',                  source: 'Open-Meteo Marine + Forecast' },
  { name: 'marad-advisories',   desc: 'US MARAD maritime security advisories',                                     source: 'maritime.dot.gov' },
  { name: 'centcom-advisories', desc: 'CENTCOM Middle East maritime advisories',                                   source: 'U.S. Central Command via DVIDS' },
  { name: 'crea-feed',          desc: 'Energy and clean air research feed',                                        source: 'CREA' },
  { name: 'news-feed',          desc: 'Aggregated oil and energy news headlines',                                  source: 'OilPrice.com, Rigzone, Offshore Technology RSS' },
  { name: 'opec',               desc: 'OPEC+ member production vs Declaration of Cooperation quotas',              source: 'U.S. EIA International + OPEC+ JMMC schedule' },
];

export default function ApiPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">AmericasOilWatch Public API</h1>
        <p className="mt-2 text-sm text-gray-400 max-w-2xl">
          Free, read-only JSON access to the same data that powers the dashboard. CORS-enabled, no
          authentication, no key required. Built so journalists, analysts, researchers, and LLM agents
          can cite the underlying numbers directly rather than scraping the rendered page.
        </p>
      </div>

      <section className="rounded-lg border border-oil-800 bg-oil-900/30 p-5 space-y-3">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">Quick start</h2>
        <pre className="bg-oil-950/60 border border-oil-800 rounded p-3 text-[11px] text-gray-300 overflow-x-auto"><code>{`# Current WTI crude price
curl https://americasoilwatch.com/api/v1/wti

# US weekly petroleum stocks (crude, gasoline, distillates, SPR, production)
curl https://americasoilwatch.com/api/v1/us-stocks

# Index of all available endpoints
curl https://americasoilwatch.com/api/v1`}</code></pre>
        <p className="text-xs text-gray-400">
          All responses are <code className="text-gray-300">application/json; charset=utf-8</code>.
          Cache headers are set to <code className="text-gray-300">s-maxage=300, stale-while-revalidate=3600</code>
          {' '}so the CDN serves quickly while keeping data fresh.
        </p>
      </section>

      <section className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
        <div className="px-5 py-3 border-b border-oil-800/60">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">Available endpoints</h2>
        </div>
        <div className="divide-y divide-oil-800/40">
          {RESOURCES.map(r => (
            <div key={r.name} className="px-5 py-3 hover:bg-oil-800/20 transition">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <a href={`/api/v1/${r.name}`} className="font-mono text-sm text-amber-300 hover:underline">
                  /api/v1/{r.name}
                </a>
                <span className="text-[10px] text-gray-500">Source: {r.source}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4 space-y-3">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">Usage</h2>
        <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
          <p>
            <span className="text-gray-300 font-medium">Free.</span>{' '}
            No key, no rate limits beyond reasonable use. CORS is open
            (<code className="text-gray-300">Access-Control-Allow-Origin: *</code>).
          </p>
          <p>
            <span className="text-gray-300 font-medium">Attribution requested.</span>{' '}
            Cite as <code className="text-gray-300">&quot;AmericasOilWatch&quot;</code> with a link to{' '}
            <a href="https://americasoilwatch.com" className="text-oil-400 hover:underline">americasoilwatch.com</a>.
            Every payload also includes the underlying institutional source — please also credit those
            where appropriate.
          </p>
          <p>
            <span className="text-gray-300 font-medium">No warranty.</span>{' '}
            Data is provided as-is from public official sources. We do not guarantee accuracy, completeness
            or fitness for any specific purpose. Do not use for trading or safety-critical decisions
            without independent verification.
          </p>
          <p>
            <span className="text-gray-300 font-medium">Update cadence.</span>{' '}
            Underlying data files refresh daily via automated workflow at 06:00 UTC, plus extra runs after
            the EIA weekly stocks release (Wednesdays). The API serves the latest committed file at each
            request, with CDN caching of up to 5 minutes.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-3">Also available</h2>
        <ul className="space-y-1.5 text-xs text-gray-400">
          <li>
            <a href="https://ukoilwatch.com/api" target="_blank" rel="noopener" className="text-oil-300 hover:underline">UKOilWatch API ↗</a> —
            UK DESNZ stocks, pump prices, jet/diesel divergence
          </li>
          <li>
            <a href="https://eurooilwatch.com/api" target="_blank" rel="noopener" className="text-oil-300 hover:underline">EuroOilWatch API ↗</a> —
            EU-27 country stocks, EC Oil Bulletin prices, TTF + Henry Hub gas, AGSI storage, ARA hub
          </li>
        </ul>
      </section>
    </div>
  );
}
