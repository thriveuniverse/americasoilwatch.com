import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { PRODUCERS } from '@/lib/countries';
import { getAllInsights } from '@/lib/insights';
import JsonLd from '@/components/JsonLd';
import WtiTrendChart from '@/components/WtiTrendChart';
import SubscribeCta from '@/components/SubscribeCta';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'AmericasOilWatch — Western Hemisphere Oil & Fuel Intelligence',
  alternates: { canonical: 'https://americasoilwatch.com' },
};

function loadJSON<T>(filename: string): T | null {
  const p = path.join(process.cwd(), 'data', filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

function PriceChange({ val, unit = '' }: { val: number | null; unit?: string }) {
  if (val === null || val === 0) return null;
  const up = val > 0;
  return (
    <span className={`text-xs font-mono ml-1.5 ${up ? 'text-red-400' : 'text-emerald-400'}`}>
      {up ? '▲' : '▼'} {Math.abs(val).toFixed(2)}{unit}
    </span>
  );
}

function StatCard({ label, value, sub, change, changeUnit, accent }:
  { label: string; value: string; sub?: string; change?: number | null; changeUnit?: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
      <div className="text-[10px] font-mono font-semibold tracking-widest text-gray-500 uppercase mb-1">{label}</div>
      <div className={`text-2xl font-bold font-mono ${accent ?? 'text-white'}`}>{value}</div>
      {change !== undefined && <PriceChange val={change ?? null} unit={changeUnit} />}
      {sub && <div className="text-[10px] text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

const TREND_ICONS = { rising: '↑', stable: '→', falling: '↓' };
const TREND_COLORS = { rising: 'text-emerald-400', stable: 'text-gray-400', falling: 'text-red-400' };
const REGION_ORDER = ['north', 'central', 'caribbean', 'south'] as const;
const REGION_LABELS: Record<string, string> = {
  north: 'North America',
  central: 'Central America & Mexico',
  caribbean: 'Caribbean',
  south: 'South America',
};

export default async function HomePage() {
  const wti          = loadJSON<any>('wti.json');
  const brent        = loadJSON<any>('brent.json');
  const usStocks     = loadJSON<any>('us-stocks.json');
  const usPrices     = loadJSON<any>('us-prices.json');
  const analysis     = loadJSON<any>('analysis.json');
  const marad        = loadJSON<any>('marad-advisories.json');
  const crea         = loadJSON<any>('crea-feed.json');
  const wtiHistory   = loadJSON<{ entries: { date: string; priceUsd: number }[] }>('wti-history.json');
  const insights     = getAllInsights().slice(0, 3);

  const wtiSpread = (wti && brent) ? +(wti.priceUsd - brent.priceUsd).toFixed(2) : null;

  const byRegion = REGION_ORDER.map(r => ({
    region: r,
    label: REGION_LABELS[r],
    producers: PRODUCERS.filter(p => p.region === r),
  })).filter(r => r.producers.length > 0);

  return (
    <div className="space-y-8">
      <JsonLd type="home" />

      {/* Header */}
      <div>
        {analysis?.statusLine && (
          <div className="inline-flex items-center gap-2 rounded border border-oil-700 bg-oil-900/60 px-3 py-1 mb-3">
            <span className={`w-1.5 h-1.5 rounded-full ${
              analysis.overallStatus === 'critical' ? 'bg-red-500' :
              analysis.overallStatus === 'warning'  ? 'bg-orange-500' :
              analysis.overallStatus === 'watch'    ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
            <span className="text-[10px] font-mono font-semibold tracking-widest text-gray-400 uppercase">
              Status: {analysis.overallStatus ?? 'watch'}
            </span>
            <span className="text-xs text-gray-300">· {analysis.statusLine}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Americas Oil &amp; Fuel Intelligence
        </h1>
        <p className="mt-2 text-sm text-gray-400 max-w-2xl">
          Independent daily intelligence on Western Hemisphere oil markets —
          WTI crude, US petroleum stocks, producer data, and supply-route risk from Canada to Patagonia.
        </p>
        <p className="mt-1 text-xs text-gray-500 max-w-2xl">
          Built for fleet operators, energy traders, procurement teams, and journalists tracking Americas fuel supply.
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="WTI Crude"
          value={wti ? `$${wti.priceUsd}` : '—'}
          sub={wti ? `Week ending ${wti.weekEnding}` : 'No data yet'}
          change={wti?.changePct}
          changeUnit="%"
          accent="text-oil-300"
        />
        <StatCard
          label="Brent Crude"
          value={brent ? `$${brent.priceUsd}` : '—'}
          sub={wtiSpread !== null ? `WTI spread: ${wtiSpread > 0 ? '+' : ''}$${wtiSpread}` : undefined}
          change={brent?.changePct}
          changeUnit="%"
        />
        <StatCard
          label="US Gasoline"
          value={usPrices ? `$${usPrices.gasolineUsdGal}` : '—'}
          sub="National avg, per US gallon"
          change={usPrices?.gasolineChangeUsdGal}
          changeUnit="/gal"
        />
        <StatCard
          label="US Diesel"
          value={usPrices ? `$${usPrices.dieselUsdGal}` : '—'}
          sub="National avg, per US gallon"
          change={usPrices?.dieselChangeUsdGal}
          changeUnit="/gal"
        />
      </div>

      {/* US Petroleum Stocks — with days-of-supply */}
      {usStocks && (() => {
        // Approximate US demand (thousand barrels / day) — stable enough for days-of-supply gauge
        const DEMAND_KBD = { crude: 16000, gasoline: 9000, distillate: 4000, sprImports: 6000 };
        const toMb    = (kb: number) => (kb / 1000).toFixed(1);
        const toMbChg = (kb: number) => (kb / 1000).toFixed(2);
        const days    = (kb: number, dKbd: number) => Math.round(kb / dKbd);
        const statusColor = (d: number, min: number) =>
          d < min * 0.6 ? 'text-red-400' : d < min ? 'text-amber-400' : 'text-emerald-400';

        const stocks = [
          { label: 'Commercial Crude', val: usStocks.crudeMb,      change: usStocks.crudeMbChange,      days: days(usStocks.crudeMb, DEMAND_KBD.crude),       min: 25, daysLabel: 'days of refinery input' },
          { label: 'Gasoline',         val: usStocks.gasolineMb,   change: usStocks.gasolineMbChange,   days: days(usStocks.gasolineMb, DEMAND_KBD.gasoline), min: 25, daysLabel: 'days of demand' },
          { label: 'Distillates',      val: usStocks.distillateMb, change: usStocks.distillateMbChange, days: days(usStocks.distillateMb, DEMAND_KBD.distillate), min: 30, daysLabel: 'days of demand' },
          { label: 'SPR',              val: usStocks.sprMb,        change: null,                        days: days(usStocks.sprMb, DEMAND_KBD.sprImports), min: 30, daysLabel: 'days of import cover' },
        ];

        return (
          <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
            <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between">
              <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
                US Petroleum Stocks — EIA Weekly
              </h2>
              <span className="text-[10px] text-gray-600">Week ending {usStocks.weekEnding}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-oil-800/40">
              {stocks.map(s => (
                <div key={s.label} className="px-4 py-3">
                  <div className="text-[10px] text-gray-500 mb-1">{s.label}</div>
                  <div className="text-lg font-mono font-semibold text-white">
                    {toMb(s.val)} <span className="text-xs text-gray-500">MB</span>
                  </div>
                  {s.change !== null && s.change !== undefined && (
                    <div className={`text-[10px] font-mono mt-0.5 ${s.change > 0 ? 'text-emerald-400' : s.change < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                      {s.change > 0 ? '▲' : '▼'} {Math.abs(+toMbChg(s.change))} MB
                    </div>
                  )}
                  <div className="mt-2 pt-2 border-t border-oil-800/40">
                    <div className={`text-sm font-mono font-semibold ${statusColor(s.days, s.min)}`}>
                      ~{s.days} days
                    </div>
                    <div className="text-[9px] text-gray-600 leading-tight">{s.daysLabel}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-2 border-t border-oil-800/40 bg-oil-900/20 flex items-center justify-between flex-wrap gap-2">
              <p className="text-[10px] text-gray-600">
                MB = million barrels. Days-of-supply estimated from EIA demand benchmarks. Source: EIA Weekly Petroleum Status Report.
              </p>
              {usStocks.productionKbpd && (
                <p className="text-[10px] text-gray-500 font-mono">
                  US production: <span className="text-white">{usStocks.productionKbpd.toLocaleString()}</span> kb/d
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* WTI 18-month trend */}
      {wtiHistory?.entries && wtiHistory.entries.length > 0 && (
        <WtiTrendChart entries={wtiHistory.entries} />
      )}

      {/* Latest insights */}
      {insights.length > 0 && (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
              Latest Insights
            </h2>
            <a href="/insights" className="text-xs text-oil-400 hover:text-white transition">All insights →</a>
          </div>
          <div className="divide-y divide-oil-800/30">
            {insights.map(i => (
              <a key={i.slug} href={`/insights/${i.slug}`}
                className="block px-5 py-3 hover:bg-oil-800/30 transition group">
                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600 mb-1">
                  <span>{new Date(i.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                  <span>·</span>
                  <span>{i.readingMinutes} min</span>
                  {i.tags[0] && <span className="ml-1 text-oil-400">{i.tags[0]}</span>}
                </div>
                <p className="text-sm font-medium text-white group-hover:text-oil-300 transition leading-snug">
                  {i.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{i.excerpt}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {analysis && (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-oil-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-oil-500" />
              </span>
              <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-400 uppercase">AI Analysis</h2>
            </div>
            <span className="text-[10px] text-gray-600">
              {analysis.generatedAt ? new Date(analysis.generatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            </span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm font-semibold text-white">{analysis.statusLine}</p>
            {analysis.keyPoints?.length > 0 && (
              <ul className="space-y-1.5">
                {analysis.keyPoints.map((pt: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="text-oil-400 flex-shrink-0 mt-0.5">›</span>
                    {pt}
                  </li>
                ))}
              </ul>
            )}
            {analysis.fullAnalysis && (
              <div className="pt-2 border-t border-oil-800/40">
                {analysis.fullAnalysis.split('\n\n').map((para: string, i: number) => (
                  <p key={i} className="text-xs text-gray-400 leading-relaxed mb-2">{para}</p>
                ))}
              </div>
            )}
          </div>
          <div className="px-5 py-2 border-t border-oil-800/40 bg-oil-900/20">
            <p className="text-[10px] text-gray-600">Generated by {analysis.model} · Based on EIA data + MARAD advisories</p>
          </div>
        </div>
      )}

      {/* Subscribe CTA */}
      <SubscribeCta />

      {/* Producer grid by region */}
      <div>
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-4">
          Western Hemisphere — Key Producers
        </h2>
        <div className="space-y-6">
          {byRegion.map(({ region, label, producers }) => (
            <div key={region}>
              <h3 className="text-[10px] font-mono font-semibold tracking-widest text-gray-600 uppercase mb-2 pl-1">
                {label}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {producers.map(p => (
                  <div key={p.code} className="rounded-lg border border-oil-800 bg-oil-900/20 px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{p.flag}</span>
                        <div>
                          <div className="text-sm font-semibold text-white">{p.name}</div>
                          <div className="text-[10px] font-mono text-gray-500">{p.code}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-mono font-bold text-white">
                          {p.productionKbpd >= 1000
                            ? `${(p.productionKbpd / 1000).toFixed(1)}m`
                            : `${p.productionKbpd}k`}
                        </div>
                        <div className="text-[10px] text-gray-500">bpd</div>
                        <div className={`text-xs font-mono ${TREND_COLORS[p.productionTrend]}`}>
                          {TREND_ICONS[p.productionTrend]}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {p.keyGrades.slice(0, 2).map(g => (
                        <span key={g} className="text-[10px] bg-oil-800/60 text-gray-400 px-1.5 py-0.5 rounded border border-oil-700/50">
                          {g}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">{p.note}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MARAD snapshot */}
      {marad?.advisories?.length > 0 && (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
              Maritime Advisory Snapshot
            </h2>
            <a href="/supply" className="text-xs text-oil-400 hover:text-white transition">Full supply page →</a>
          </div>
          <div className="divide-y divide-oil-800/30">
            {marad.advisories.slice(0, 4).map((a: any) => {
              const dot = { critical: 'bg-red-500', high: 'bg-orange-500', elevated: 'bg-amber-500', normal: 'bg-gray-500' }[a.severity as string] ?? 'bg-gray-500';
              return (
                <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-2.5 hover:bg-oil-800/30 transition group">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                  <span className="text-xs text-gray-300 group-hover:text-white transition flex-1 truncate">{a.region}: {a.incident}</span>
                  <span className="text-[10px] text-gray-600 flex-shrink-0">{a.id}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* CREA snapshot */}
      {crea?.articles?.length > 0 && (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
              Energy Research — CREA
            </h2>
            <a href="https://energyandcleanair.org" target="_blank" rel="noopener noreferrer"
              className="text-xs text-oil-400 hover:text-white transition">All research →</a>
          </div>
          <div className="divide-y divide-oil-800/30">
            {crea.articles.slice(0, 3).map((a: any, i: number) => (
              <a key={i} href={a.link} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-oil-800/30 transition group">
                <span className="text-[10px] text-oil-400 flex-shrink-0 font-mono">{a.tag}</span>
                <span className="text-xs text-gray-300 group-hover:text-white transition flex-1 truncate">{a.title}</span>
                <span className="text-gray-600 text-xs flex-shrink-0">↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon — PRO tier */}
      <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-semibold tracking-widest text-oil-300 uppercase px-2 py-0.5 rounded border border-oil-700 bg-oil-900/60">
            Coming Soon
          </span>
          <h2 className="text-sm font-semibold text-white">AmericasOilWatch PRO</h2>
        </div>
        <p className="text-xs text-gray-400 mb-3 max-w-2xl">
          Professional-tier tools for traders, fleet operators, and procurement teams.
          Launching mid-2026.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { t: 'Price alerts',      d: 'WTI, Brent, WCS thresholds by email or webhook' },
            { t: 'Historical exports',d: 'CSV downloads of all pricing and stock series' },
            { t: 'Custom watchlists', d: 'Track chokepoints and producers relevant to your flows' },
            { t: 'Monthly intel brief', d: 'In-depth quarterly Americas supply outlook' },
          ].map(f => (
            <div key={f.t} className="rounded border border-oil-800/60 bg-oil-900/40 px-3 py-2">
              <p className="text-oil-300 font-semibold mb-0.5">{f.t}</p>
              <p className="text-[10px] text-gray-500 leading-snug">{f.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-gray-600">
          Interested in early access or founding-partner sponsorship?{' '}
          <a href="mailto:jon@americasoilwatch.com" className="text-oil-400 hover:underline">
            Get in touch
          </a>
        </p>
      </div>

      {/* Editorial byline */}
      <div className="rounded-lg border border-oil-800/60 bg-oil-900/10 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-oil-800 flex items-center justify-center text-lg flex-shrink-0">
            ✍️
          </div>
          <div>
            <p className="text-[10px] font-mono font-semibold tracking-widest text-gray-500 uppercase mb-0.5">
              Editorial
            </p>
            <p className="text-sm text-gray-300">
              Written and edited by Jon Kelly, founder of the OilWatch network.
            </p>
            <p className="text-xs text-gray-500">
              Also publishing at{' '}
              <a href="https://eurooilwatch.com" className="text-oil-400 hover:underline">EuroOilWatch</a> and{' '}
              <a href="https://ukoilwatch.com" className="text-oil-400 hover:underline">UKOilWatch</a>.
            </p>
          </div>
        </div>
        <div className="sm:ml-auto text-xs">
          <a href="mailto:jon@americasoilwatch.com" className="text-oil-400 hover:underline">
            jon@americasoilwatch.com
          </a>
        </div>
      </div>

    </div>
  );
}
