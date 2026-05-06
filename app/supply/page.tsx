import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import JsonLd from '@/components/JsonLd';
import SeaStatePanel, { type SeaStateData } from '@/components/SeaStatePanel';
import { maradOverrideFor } from '@/lib/marad-risk';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Americas Oil Supply Routes | AmericasOilWatch',
  description:
    'Status of the critical oil and fuel supply chokepoints affecting the Western Hemisphere — Panama Canal, Gulf of Mexico, Straits of Florida, Magellan Strait, and Caribbean routes.',
  alternates: { canonical: 'https://americasoilwatch.com/supply' },
};

type RiskLevel = 'normal' | 'elevated' | 'high' | 'critical';

interface Chokepoint {
  id: string;
  name: string;
  region: string;
  risk: RiskLevel;
  riskLabel: string;
  dailyFlow: string;
  relevance: string;
  coords: string;
  summary: string;
  impact: string;
  context: string;
  lastReviewed: string;
  sources: { label: string; url: string }[];
}

const CHOKEPOINTS: Chokepoint[] = [
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    region: 'Persian Gulf / Gulf of Oman',
    risk: 'critical',
    riskLabel: 'Critical — reclosed 18 April, US-Iran dispute',
    dailyFlow: '~17m bpd (21% of global oil)',
    relevance: 'US Gulf Coast and East Coast refineries import significant volumes of Gulf crude. Closure forces rerouting via Cape of Good Hope, adding 2-3 weeks transit.',
    coords: '26.5°N 56.4°E',
    summary: 'Iran shut the Strait of Hormuz again on 18 April 2026, citing US naval blockade on Iranian ports. All major Gulf producers — Saudi Arabia, UAE, Kuwait, Iraq — export through this single chokepoint. Two simultaneous closures (Hormuz + Bab-el-Mandeb) are unprecedented.',
    impact: 'US East Coast refineries that process Gulf sour crude face spot market tightness. WTI-Brent spread has narrowed as Gulf crude becomes harder to source globally. US SPR drawdown contingency plans activated.',
    context: 'The US maintains the largest strategic petroleum reserve globally at ~370m barrels — approximately 40 days of import cover. Previous Hormuz tensions in 2019 and 2020 resolved within weeks. Iran relies on Hormuz for its own oil exports.',
    lastReviewed: '2026-04-18',
    sources: [
      { label: 'EIA Strait of Hormuz', url: 'https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints' },
      { label: 'MARAD advisories', url: 'https://www.maritime.dot.gov/msci-advisories' },
    ],
  },
  {
    id: 'panama',
    name: 'Panama Canal',
    region: 'Central America',
    risk: 'elevated',
    riskLabel: 'Elevated — drought restrictions eased, monitoring water levels',
    dailyFlow: '~820,000 bpd oil equivalent (5% of global seaborne trade)',
    relevance: 'Critical for US Gulf Coast petroleum exports to Asia. Also carries Alaska North Slope crude south and LNG movements. Supertankers cannot transit — limited to Panamax/Neo-Panamax.',
    coords: '9.1°N 79.4°W',
    summary: 'The Panama Canal handles roughly 5% of global seaborne trade and is the only non-Cape route between the Atlantic and Pacific in the Americas. Severe drought in 2023-2024 forced vessel restrictions to 24/day (down from 36), causing major disruption and wait times of 10+ days.',
    impact: 'Drought-linked restrictions in 2023-24 added $300-500M in annual shipping costs. US LNG exporters diverted cargoes around Cape Horn. Alaska crude exports to Gulf Coast refineries delayed. El Niño patterns drive multi-year drought cycles.',
    context: 'Canal expansion completed 2016 allows Neo-Panamax vessels up to 14,000 TEU. However, Gatun Lake water levels remain the binding constraint. Climate change projections suggest increasing drought frequency. Alternative: Cape Horn route adds ~8,000 nautical miles.',
    lastReviewed: '2026-04-19',
    sources: [
      { label: 'Panama Canal Authority', url: 'https://www.pancanal.com/eng/' },
      { label: 'EIA Canal analysis', url: 'https://www.eia.gov/todayinenergy/' },
    ],
  },
  {
    id: 'bab-el-mandeb',
    name: 'Bab-el-Mandeb Strait',
    region: 'Red Sea / Gulf of Aden',
    risk: 'critical',
    riskLabel: 'Critical — Houthi attacks ongoing, commercial avoidance',
    dailyFlow: '~8.8m bpd (9% of global oil)',
    relevance: 'Key route for Gulf crude heading to Europe and eastern US refineries via Suez. Sustained Houthi attacks since late 2023 have made most commercial tankers avoid the strait.',
    coords: '12.6°N 43.3°E',
    summary: 'Houthi forces in Yemen have attacked over 100 commercial vessels since November 2023, effectively closing the Red Sea route to most shipping. Combined with the Hormuz reclosure, both primary Gulf export corridors are simultaneously disrupted — an unprecedented compound event.',
    impact: 'The Cape of Good Hope reroute adds 10-14 days each way and increases shipping costs significantly. For Americas-bound Gulf crude, this compounds with Hormuz closure to force spot market substitution from Atlantic Basin producers (US shale, Brazil, Guyana).',
    context: 'US and allied naval operations (Operation Prosperity Guardian) have not deterred attacks. Most major shipping lines continue to avoid the route. Insurance premiums for Red Sea transits remain at crisis levels.',
    lastReviewed: '2026-04-18',
    sources: [
      { label: 'MARAD advisories', url: 'https://www.maritime.dot.gov/msci-advisories' },
      { label: 'UKMTO', url: 'https://www.ukmto.org' },
    ],
  },
  {
    id: 'florida-straits',
    name: 'Straits of Florida',
    region: 'Caribbean / Southeast US',
    risk: 'normal',
    riskLabel: 'Normal — open, routine monitoring',
    dailyFlow: '~2.5m bpd (Caribbean + Gulf refined products)',
    relevance: 'Primary route for refined products from Caribbean refineries to US East Coast. Also carries crude from South America to Gulf Coast refineries. Closure would disrupt US East Coast fuel supply.',
    coords: '24.5°N 80.2°W',
    summary: 'The Straits of Florida (between Cuba and the Florida Keys) carry significant volumes of refined petroleum products northward to US East Coast markets, and crude southward. Major US refineries in the Gulf Coast export through this route.',
    impact: 'No current disruption risk. The strait is under US Coast Guard jurisdiction and routinely monitored. Any disruption would force rerouting around Cuba, adding 2-3 days transit.',
    context: 'US-Cuba relations and Cuban political stability are the primary geopolitical risk factors. Cuba\'s deteriorating economy and fuel shortages occasionally affect shipping logistics.',
    lastReviewed: '2026-04-19',
    sources: [
      { label: 'USCG Maritime', url: 'https://www.uscg.mil' },
      { label: 'EIA Chokepoints', url: 'https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints' },
    ],
  },
  {
    id: 'gulf-mexico',
    name: 'Gulf of Mexico',
    region: 'Southern US / Mexico',
    risk: 'normal',
    riskLabel: 'Normal — hurricane season monitoring begins June',
    dailyFlow: '~2m bpd US offshore production + major pipeline hub',
    relevance: 'US Gulf of Mexico produces ~1.8m bpd offshore. Gulf Coast hosts ~50% of US refining capacity. Hurricane disruptions can simultaneously knock out production, refining, and port operations.',
    coords: '25°N 90°W',
    summary: 'The Gulf of Mexico is both a major producing basin and the hub of US petroleum logistics. Eight of the top US refineries by capacity are on the Gulf Coast. Hurricane season (June-November) is the primary annual risk — major storms like Katrina (2005) and Ida (2021) caused significant and lasting supply disruptions.',
    impact: 'A major hurricane strike on the Houston Ship Channel or Port Arthur refining complex would be a national supply emergency. US EIA monitors GoM production weekly. The 2024 hurricane season was above average but major refineries were spared.',
    context: 'Offshore platforms are increasingly hurricane-hardened, but evacuation protocols still shut production for days to weeks per major storm. Pipeline infrastructure is the most vulnerable single-point-of-failure.',
    lastReviewed: '2026-04-19',
    sources: [
      { label: 'NOAA Hurricane Center', url: 'https://www.nhc.noaa.gov' },
      { label: 'EIA GoM production', url: 'https://www.eia.gov/petroleum/production/' },
    ],
  },
  {
    id: 'magellan',
    name: 'Strait of Magellan',
    region: 'Southern Chile / Argentina',
    risk: 'normal',
    riskLabel: 'Normal — alternative Cape route open',
    dailyFlow: 'Minor — primarily used when Panama Canal restricted',
    relevance: 'Alternative passage between Atlantic and Pacific when Panama Canal is restricted. Used by smaller vessels and as emergency bypass. Drake Passage (south of Cape Horn) available for all vessel sizes.',
    coords: '54°S 70°W',
    summary: 'The Strait of Magellan and Drake Passage (around Cape Horn) provide the only alternatives to the Panama Canal for Pacific-Atlantic transit in the Western Hemisphere. The Magellan Strait is restricted to vessels under 280m length and 11.5m draught.',
    impact: 'During 2023-24 Panama Canal drought restrictions, some vessels rerouted via Cape Horn, adding ~8,000 nautical miles. Not economically viable for routine trade but important as overflow capacity.',
    context: 'Extreme weather in the Drake Passage makes it dangerous for smaller vessels. The Magellan Strait requires pilot compulsion for commercial vessels. Argentina and Chile maintain the route.',
    lastReviewed: '2026-04-19',
    sources: [
      { label: 'Chilean Navy Maritime', url: 'https://www.directemar.cl' },
    ],
  },
];

const RISK_STYLES: Record<RiskLevel, { badge: string; dot: string; border: string }> = {
  critical: { badge: 'bg-red-950/60 border-red-800/60 text-red-300', dot: 'bg-red-500', border: 'border-red-800/60' },
  high:     { badge: 'bg-orange-950/60 border-orange-800/60 text-orange-300', dot: 'bg-orange-500', border: 'border-orange-800/60' },
  elevated: { badge: 'bg-amber-950/60 border-amber-800/60 text-amber-300', dot: 'bg-amber-500', border: 'border-amber-800/60' },
  normal:   { badge: 'bg-green-950/60 border-green-800/60 text-green-300', dot: 'bg-green-500', border: 'border-green-800/60' },
};

function ChokepointCard({ cp }: { cp: Chokepoint }) {
  const s = RISK_STYLES[cp.risk];
  return (
    <div id={cp.id} className={`rounded-xl border bg-oil-900/30 overflow-hidden ${s.border}`}>
      <div className="px-5 py-4 border-b border-oil-800/40">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h3 className="text-base font-bold text-white">{cp.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{cp.region} · {cp.coords}</p>
          </div>
          <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg border ${s.badge}`}>
            {cp.risk.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-gray-400">{cp.riskLabel}</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-500 font-medium">Daily flow: </span>
            <span className="text-gray-300">{cp.dailyFlow}</span>
          </div>
          <div>
            <span className="text-gray-500 font-medium">Americas relevance: </span>
            <span className="text-gray-300">{cp.relevance}</span>
          </div>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{cp.summary}</p>
        <div className="bg-oil-900/50 rounded-lg px-4 py-3 border border-oil-800/40">
          <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Americas Impact</p>
          <p className="text-xs text-gray-400 leading-relaxed">{cp.impact}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Context</p>
          <p className="text-xs text-gray-500 leading-relaxed">{cp.context}</p>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {cp.sources.map(src => (
            <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-oil-400 hover:text-white transition border border-oil-700/50 px-2 py-1 rounded">
              {src.label} ↗
            </a>
          ))}
        </div>
        <p className="text-[10px] text-gray-600">Last reviewed: {cp.lastReviewed}</p>
      </div>
    </div>
  );
}

interface MaradAdvisory {
  id: string;
  type: 'advisory' | 'alert';
  title: string;
  region: string;
  incident: string;
  severity: 'critical' | 'high' | 'elevated' | 'normal';
  year: number;
  num: number;
  url: string;
}

function readMarad(): { lastUpdated: string; advisories: MaradAdvisory[] } | null {
  const p = path.join(process.cwd(), 'data', 'marad-advisories.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

interface CreaArticle {
  title: string;
  date: string;
  link: string;
  categories: string[];
  tag: string;
}

function readCrea(): { lastUpdated: string; articles: CreaArticle[] } | null {
  const p = path.join(process.cwd(), 'data', 'crea-feed.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

export default async function SupplyPage() {
  const marad = readMarad();
  const crea  = readCrea();

  const chokepoints: Chokepoint[] = CHOKEPOINTS.map(c => {
    const ovr = marad ? maradOverrideFor(c.id, marad.advisories, marad.lastUpdated) : null;
    return ovr ? { ...c, risk: ovr.risk, riskLabel: ovr.riskLabel, lastReviewed: ovr.lastReviewed } : c;
  });

  const critical = chokepoints.filter(c => c.risk === 'critical');
  const high     = chokepoints.filter(c => c.risk === 'high');
  const elevated = chokepoints.filter(c => c.risk === 'elevated');
  const normal   = chokepoints.filter(c => c.risk === 'normal');

  const seaState = (() => {
    const p = path.join(process.cwd(), 'data', 'sea-state.json');
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as SeaStateData; } catch { return null; }
  })();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <JsonLd type="supply" />

      {/* Header */}
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">Americas Oil Supply Routes</h1>
        <p className="mt-2 text-sm text-gray-400 max-w-2xl">
          Status of the critical maritime chokepoints and infrastructure affecting Western Hemisphere fuel supply.
          Updated editorially — not a live tracker.
        </p>
      </div>

      {/* Live sea-state panel — chokepoint conditions from Open-Meteo */}
      {seaState && (
        <SeaStatePanel
          data={seaState}
          only={['hormuz','bab-el-mandeb','panama-caribbean','strait-of-florida']}
        />
      )}

      {/* Status bar */}
      <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-3">
          Current Route Status
        </h2>
        <div className="flex flex-wrap gap-3">
          {chokepoints.map(c => {
            const s = RISK_STYLES[c.risk];
            return (
              <a key={c.id} href={`#${c.id}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition hover:opacity-80 ${s.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                {c.name}
              </a>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-gray-600">
          Risk levels: <span className="text-green-400">Normal</span> · <span className="text-yellow-400">Elevated</span> · <span className="text-orange-400">High</span> · <span className="text-red-400">Critical</span>
        </p>
      </div>

      {/* MARAD advisories */}
      {marad && marad.advisories.length > 0 && (() => {
        const severityStyles = {
          critical: { bar: 'bg-red-500',    badge: 'bg-red-900/50 border-red-700/50 text-red-300' },
          high:     { bar: 'bg-orange-500', badge: 'bg-orange-900/50 border-orange-700/50 text-orange-300' },
          elevated: { bar: 'bg-amber-500',  badge: 'bg-amber-900/50 border-amber-700/50 text-amber-300' },
          normal:   { bar: 'bg-gray-500',   badge: 'bg-gray-800/50 border-gray-600/50 text-gray-400' },
        };
        const current = marad.advisories.filter(a => a.year >= 2026);
        const older   = marad.advisories.filter(a => a.year < 2026);
        return (
          <div className="rounded-xl border border-oil-700 bg-oil-900/40 overflow-hidden">
            <div className="px-5 py-4 border-b border-oil-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">US Maritime Security Advisories</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  MARAD active advisories relevant to Americas supply routes · Updated {new Date(marad.lastUpdated).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <a href="https://www.maritime.dot.gov/msci-advisories" target="_blank" rel="noopener noreferrer"
                className="text-xs text-oil-400 hover:text-white transition flex-shrink-0 ml-4">
                All advisories →
              </a>
            </div>
            <div className="divide-y divide-oil-800/40">
              {[...current, ...older].map(a => {
                const s = severityStyles[a.severity];
                return (
                  <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-oil-800/30 transition group">
                    <div className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${s.bar}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${s.badge}`}>
                          {a.severity.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono text-gray-600">{a.id}</span>
                        {a.year >= 2026 && (
                          <span className="text-[10px] bg-oil-800 text-oil-300 px-1.5 py-0.5 rounded border border-oil-700">ACTIVE</span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-200 group-hover:text-white transition truncate">{a.region}</p>
                      <p className="text-xs text-gray-500 truncate">{a.incident}</p>
                    </div>
                    <span className="text-gray-600 group-hover:text-gray-400 text-xs flex-shrink-0 mt-1">↗</span>
                  </a>
                );
              })}
            </div>
            <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-900/20">
              <p className="text-[10px] text-gray-600">
                Source: <a href="https://www.maritime.dot.gov/msci-advisories" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">US Maritime Administration (MARAD)</a>.
                Full advisory text on MARAD site.
              </p>
            </div>
          </div>
        );
      })()}

      {/* CREA research */}
      {crea && crea.articles.length > 0 && (
        <div className="rounded-xl border border-oil-700 bg-oil-900/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-oil-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Energy Research — CREA</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Russian fossil fuel exports, Hormuz impacts &amp; Americas supply analysis · Updated {new Date(crea.lastUpdated).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <a href="https://energyandcleanair.org" target="_blank" rel="noopener noreferrer"
              className="text-xs text-oil-400 hover:text-white transition flex-shrink-0 ml-4">
              All research →
            </a>
          </div>
          <div className="divide-y divide-oil-800/40">
            {crea.articles.map((a, i) => {
              const tagStyles: Record<string, string> = {
                'Hormuz':          'bg-red-900/50 border-red-700/50 text-red-300',
                'Russian Exports': 'bg-orange-900/50 border-orange-700/50 text-orange-300',
                'Sanctions':       'bg-purple-900/50 border-purple-700/50 text-purple-300',
                'LNG':             'bg-blue-900/50 border-blue-700/50 text-blue-300',
                'Analysis':        'bg-oil-800/60 border-oil-600/50 text-gray-400',
              };
              const tagStyle = tagStyles[a.tag] ?? tagStyles['Analysis'];
              return (
                <a key={i} href={a.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-oil-800/30 transition group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${tagStyle}`}>{a.tag}</span>
                      <span className="text-[10px] text-gray-600">
                        {new Date(a.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-200 group-hover:text-white transition leading-snug">{a.title}</p>
                  </div>
                  <span className="text-gray-600 group-hover:text-gray-400 text-xs flex-shrink-0 mt-1">↗</span>
                </a>
              );
            })}
          </div>
          <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-900/20">
            <p className="text-[10px] text-gray-600">
              Source: <a href="https://energyandcleanair.org" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">Centre for Research on Energy and Clean Air (CREA)</a>.
            </p>
          </div>
        </div>
      )}

      {/* Chokepoint cards */}
      {critical.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">Active Disruption Risk</h2>
          {critical.map(c => <ChokepointCard key={c.id} cp={c} />)}
        </div>
      )}
      {(high.length > 0 || elevated.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">Elevated — Worth Monitoring</h2>
          {[...high, ...elevated].map(c => <ChokepointCard key={c.id} cp={c} />)}
        </div>
      )}
      {normal.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">Normal Conditions</h2>
          {normal.map(c => <ChokepointCard key={c.id} cp={c} />)}
        </div>
      )}

    </div>
  );
}
