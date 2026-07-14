import type { Metadata } from 'next';
import FreshnessGuard from '@/components/FreshnessGuard';
import fs from 'fs';
import path from 'path';
import JsonLd from '@/components/JsonLd';
import SeaStatePanel, { type SeaStateData } from '@/components/SeaStatePanel';
import ChokepointsMap from '@/components/ChokepointsMap';
import ChokepointTransitPanel, { type PortwatchData } from '@/components/ChokepointTransitPanel';
import HormuzThroughputPanel from '@/components/HormuzThroughputPanel';
import HormuzPosturePanel from '@/components/HormuzPosturePanel';
import PortFlowPanel, { type PortFlowData } from '@/components/PortFlowPanel';
import PanamaCanalWatch from '@/components/PanamaCanalWatch';
import RefineryHealthPanel from '@/components/RefineryHealthPanel';
import { getFIRMSDetections } from '@/lib/firms';
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
    riskLabel: 'Critical — open on paper, restricted in practice',
    dailyFlow: '~17m bpd (21% of global oil)',
    relevance: 'US Gulf Coast and East Coast refineries import significant volumes of Gulf crude. Constrained transit forces rerouting via Cape of Good Hope, adding 2-3 weeks.',
    coords: '26.5°N 56.4°E',
    summary: 'The Strait of Hormuz remains the master variable for global oil. After the conflict that began in late February 2026 effectively closed it, the EIA assumed Hormuz stayed shut into late May, with traffic only beginning to pick up in June. Iran now says it will reopen only under new conditions — including possible Oman-set transit fees, which Washington opposes. All major Gulf producers export through this single chokepoint; in practice only a handful of crude, product and LNG vessels have exited recently — often with AIS gaps or under heightened risk — while overall Gulf flows stay far below normal. Open on paper, restricted in practice.',
    impact: 'US Gulf and East Coast refineries that process Gulf sour crude face spot-market tightness. The WTI-Brent spread has moved as Gulf crude stays hard to source globally, and Atlantic-basin producers (US shale, Brazil, Guyana) are the substitution pool. Saudi Arabia cut July official selling prices to Asia by $6/bbl, signalling demand destruction. SPR drawdown contingencies remain in play.',
    context: 'Hormuz is Washington\'s top priority and Tehran\'s main leverage in unresolved US–Iran talks. The early-June Israeli strike on Iran\'s Mahshahr petrochemical complex — the first hit on Iranian energy infrastructure since the April ceasefire — put a direct energy-asset risk premium back on. Even after a reopening, recovery is slow: Kuwait says it could restore ~70% of output within 6–8 weeks, the rest taking roughly another month.',
    lastReviewed: '2026-06-08',
    sources: [
      { label: 'EIA Strait of Hormuz', url: 'https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints' },
      { label: 'MARAD advisories', url: 'https://www.maritime.dot.gov/msci-advisories' },
    ],
  },
  {
    id: 'panama',
    name: 'Panama Canal',
    region: 'Central America',
    risk: 'normal',
    riskLabel: 'Normal transits, rising water risk — precautionary draft cuts as a strong El Niño builds',
    dailyFlow: '~820,000 bpd oil equivalent (5% of global seaborne trade)',
    relevance: 'Critical for US Gulf Coast petroleum exports to Asia. Also carries Alaska North Slope crude south and LNG movements. Supertankers cannot transit — limited to Panamax/Neo-Panamax.',
    coords: '9.1°N 79.4°W',
    summary: 'The Panama Canal handles roughly 5% of global seaborne trade and is the only non-Cape route between the Atlantic and Pacific in the Americas. Severe drought in 2023-2024 forced transits down to 24/day (from 36) with 10+ day waits. Transits are currently robust — running above the 2023 norm — but the Canal Authority is again trimming the maximum Neopanamax draft (49.5 ft on 3 Jul → 49.0 ft on 24 Jul → 48.5 ft on 15 Aug), this time preemptively, to bank Gatún Lake water ahead of a dry season NOAA now expects to fall under a very strong El Niño (81% odds for Oct–Dec). The cuts are mild so far — about a foot and a half of draft, not the transit-slashing of 2023-24 — marking the start of the risk window, not an active disruption.',
    impact: 'Panama chiefly carries US Gulf Coast LPG, LNG and refined-product exports to the Pacific and Asia (crude largely cannot fit the locks). A draft cut trims how deep each product tanker can load rather than halting transits; the 2023-24 restrictions, by contrast, diverted LNG/LPG cargoes around Cape Horn and added an estimated $300-500M in annual shipping costs. The escalation path to watch: a very strong El Niño deepening the Dec–Apr dry season toward 2023-24 severity.',
    context: 'Canal expansion completed 2016 allows Neo-Panamax vessels up to 14,000 TEU, but Gatún Lake water levels remain the binding constraint. The Authority\'s structural fix — the proposed Río Indio reservoir — is still years from delivery, leaving draft-and-slot management as the near-term lever. Alternative routing: Cape Horn adds ~8,000 nautical miles.',
    lastReviewed: '2026-07-13',
    sources: [
      { label: 'Panama Canal Authority', url: 'https://www.pancanal.com/eng/' },
      { label: 'NOAA CPC ENSO Discussion', url: 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml' },
      { label: 'Maritime Executive — Neopanamax draft cuts', url: 'https://maritime-executive.com/article/panama-canal-plans-two-more-decreases-in-neopanamax-draft-levels' },
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
    summary: 'Houthi forces in Yemen have attacked over 100 commercial vessels since November 2023, effectively closing the Red Sea route to most shipping. Combined with the still-constrained Hormuz corridor, both primary Gulf export corridors remain under simultaneous pressure — an unprecedented compound event, with renewed Houthi threats an active watch-item.',
    impact: 'The Cape of Good Hope reroute adds 10-14 days each way and increases shipping costs significantly. For Americas-bound Gulf crude, this compounds with the constrained Hormuz corridor to force spot-market substitution from Atlantic Basin producers (US shale, Brazil, Guyana).',
    context: 'US and allied naval operations (Operation Prosperity Guardian) have not deterred attacks. Most major shipping lines continue to avoid the route. Insurance premiums for Red Sea transits remain at crisis levels.',
    lastReviewed: '2026-06-08',
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

// Live transit override — derive a tracked chokepoint's risk badge from IMF PortWatch
// tanker tonnage vs the 2023 norm, so the status auto-updates with the data (the
// editorial summary/impact/context still provide the "why"). MARAD security advisories
// are layered on top and can escalate further.
function portwatchOverrideFor(
  id: string,
  pw: PortwatchData | null,
): { risk: RiskLevel; riskLabel: string; asOf: string } | null {
  const cp = pw?.chokepoints?.find((k) => k.key === id);
  if (!cp || cp.pctTankerTonnage == null) return null;
  const p = cp.pctTankerTonnage;
  let risk: RiskLevel, phrase: string;
  if (p < 25) { risk = 'critical'; phrase = `at ${p}% of the 2023 norm`; }
  else if (p < 60) { risk = 'high'; phrase = `down to ${p}% of the 2023 norm`; }
  else if (p < 85) { risk = 'elevated'; phrase = `at ${p}% of the 2023 norm`; }
  else { risk = 'normal'; phrase = `near the 2023 norm (${p}%)`; }
  const cap = risk[0].toUpperCase() + risk.slice(1);
  return { risk, riskLabel: `${cap} — tanker tonnage ${phrase} (live · IMF PortWatch)`, asOf: cp.latestDate };
}

export default async function SupplyPage() {
  const supplyNoteAsOf = '2026-07-14'; // single source: the dateline + the FreshnessGuard below
  const marad = readMarad();
  const crea  = readCrea();

  const chokepoints: Chokepoint[] = (() => {
    const pwPath = path.join(process.cwd(), 'data', 'portwatch-chokepoints.json');
    let pw: PortwatchData | null = null;
    if (fs.existsSync(pwPath)) { try { pw = JSON.parse(fs.readFileSync(pwPath, 'utf-8')); } catch { pw = null; } }
    return CHOKEPOINTS.map(c => {
      let cc = c;
      // 1. live transit (IMF PortWatch) drives the badge from current flow
      const live = portwatchOverrideFor(c.id, pw);
      if (live) cc = { ...cc, risk: live.risk, riskLabel: live.riskLabel, lastReviewed: live.asOf };
      // 2. MARAD security advisories layered on top — can escalate further
      const ovr = marad ? maradOverrideFor(cc.id, marad.advisories, marad.lastUpdated, cc.risk) : null;
      return ovr ? { ...cc, risk: ovr.risk, riskLabel: ovr.riskLabel, lastReviewed: ovr.lastReviewed } : cc;
    });
  })();

  const critical = chokepoints.filter(c => c.risk === 'critical');
  const high     = chokepoints.filter(c => c.risk === 'high');
  const elevated = chokepoints.filter(c => c.risk === 'elevated');
  const normal   = chokepoints.filter(c => c.risk === 'normal');

  const seaState = (() => {
    const p = path.join(process.cwd(), 'data', 'sea-state.json');
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as SeaStateData; } catch { return null; }
  })();

  const portwatch = (() => {
    const p = path.join(process.cwd(), 'data', 'portwatch-chokepoints.json');
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as PortwatchData; } catch { return null; }
  })();

  const portFlows = (() => {
    const p = path.join(process.cwd(), 'data', 'port-flows.json');
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as PortFlowData; } catch { return null; }
  })();

  const firmsResult = await getFIRMSDetections();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <JsonLd type="supply" />

      {/* Header */}
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">Americas Oil Supply Routes</h1>
        <p className="mt-2 text-sm text-gray-400 max-w-2xl">
          Status of the critical maritime chokepoints and infrastructure affecting Western Hemisphere fuel supply.
          The transit, port-flow and sea-state panels below refresh daily from satellite-AIS and weather feeds; the
          chokepoint risk assessments further down are maintained editorially.
        </p>
        <p className="mt-3 text-sm">
          <a href="/hormuz-timeline" className="text-oil-300 hover:text-white underline underline-offset-2">
            → Strait of Hormuz crisis timeline
          </a>
          <span className="text-gray-500"> — a sourced, filterable chronology of the 2026 crisis.</span>
        </p>
      </div>

      {/* Chokepoints overview map */}
      <ChokepointsMap />

      {/* 13 July 2026 — Iran declares Hormuz closed */}
      <div className="rounded-lg border border-red-800/50 bg-red-950/20 px-5 py-4">
        <p className="text-[10px] font-mono font-semibold tracking-widest text-red-300/90 uppercase">
          {new Date(supplyNoteAsOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} — Both powers claim Hormuz: Iran declares it closed; the US drops its 20% toll but tightens a full Iran blockade
        </p>
        <FreshnessGuard lastUpdated={supplyNoteAsOf} maxAgeDays={5} label="This note" className="mt-2" />
        <p className="mt-2 text-xs text-gray-300 leading-relaxed">
          The US–Iran conflict has escalated sharply since the July ceasefire collapsed. Over the weekend Iran&rsquo;s IRGC declared the Strait of Hormuz <strong className="text-white">closed &ldquo;until further notice&rdquo;</strong> — after its forces struck the Cyprus-flagged container ship <strong className="text-white">GFS Galaxy</strong> (engine-room fire, crew evacuated to a lifeboat, one crew member missing; CENTCOM). The US answered with further rounds of strikes, the latest on Sunday using one-way attack sea drones for the first time, and Iran retaliated across Kuwait, Jordan, Qatar, Bahrain and Oman — including the <strong className="text-white">first strike on Gulf oil infrastructure in weeks</strong>, a Kuwaiti drilling facility. Oil jumped at Monday&rsquo;s open, Brent trading above <strong className="text-white">$79</strong> and WTI near $74; by Tuesday Brent had pushed above <strong className="text-white">$85</strong>, a four-week high, as the war premium returned in force.
        </p>
        <p className="mt-2 text-xs text-gray-300 leading-relaxed">
          On Monday the <strong className="text-white">US hardened its claim over the strait</strong>: in a Truth Social post President Trump declared Hormuz &ldquo;OPEN&hellip; with or without Iran,&rdquo; reinstated a US <strong className="text-white">blockade of Iranian ships and customers</strong>, styled the United States the &ldquo;<strong className="text-white">Guardian of the Hormuz Strait</strong>,&rdquo; and proposed a <strong className="text-white">20% fee on all cargo</strong> transiting the waterway, the process to &ldquo;begin immediately.&rdquo; Iran&rsquo;s Persian Gulf Strait Authority countered that passage was <strong className="text-white">&ldquo;currently unfeasible&rdquo;</strong> and suspended transit permits. Both powers now assert a right to control &mdash; and charge for &mdash; the chokepoint, days after the <strong className="text-white">IMO Council</strong> ruled that transit through international straits <strong className="text-white">may not be tolled</strong>. On Tuesday, after backlash from shippers and the IMO ruling, Trump abandoned the 20% fee &mdash; replacing it with a push for Gulf trade and investment deals &mdash; while keeping a full blockade on Iran-linked shipping (vessels to or from Iranian ports, or carrying Iranian cargo), which CENTCOM began enforcing that afternoon.
        </p>
        <p className="mt-2 text-xs text-gray-300 leading-relaxed">
          Iranian officials say a US projectile hit the <strong className="text-white">perimeter area</strong> of the
          Bushehr nuclear power plant, and Reuters has carried the perimeter claim — but there is{' '}
          <strong className="text-white">no independent confirmation that the reactor itself was hit</strong>. Earlier
          IAEA and Reuters reporting on previous Bushehr incidents found no reactor damage or radiological release; no
          fresh IAEA confirmation has yet been seen for this latest strike.
        </p>
        <p className="mt-2 text-xs text-gray-300 leading-relaxed">
          Reuters ship-tracking found <strong className="text-white">at least four oil and gas tankers reversed
          course</strong> near the strait; others continued to transit. The strait&rsquo;s status is now <strong className="text-white">openly contested</strong> — Iran declares it closed while the US and CENTCOM insist it stays open to lawful transit, and the JMIC says the Oman-coordinated southern lane remains available. The US Navy-led Joint Maritime Information Center has raised the transit threat to{' '}
          <strong className="text-red-300">&ldquo;severe&rdquo;</strong> — up from &ldquo;substantial,&rdquo; its
          highest since mid-June — and the <strong className="text-white">IMO Secretary-General</strong> has urged
          shipowners not to expose crews to unnecessary danger by transiting while safety cannot be assured. Brent spiked about <strong className="text-white">6% to near $80</strong> as the fighting resumed, round-tripped to about <strong className="text-white">$76</strong> by Friday, then jumped back above <strong className="text-white">$79</strong> at Monday&rsquo;s open and above <strong className="text-white">$85</strong> by Tuesday.
        </p>
        <p className="mt-2 text-xs text-gray-300 leading-relaxed">
          A fresh <strong className="text-white">JMIC advisory (013-26, 10 July)</strong> keeps the threat level at{' '}
          <strong className="text-red-300">&ldquo;severe&rdquo;</strong> but stresses the strait stays open: the
          southern transit route has been <strong className="text-white">expanded and remains available to all
          traffic</strong>, coordination with NAVCENT&rsquo;s NCAGS is offered but not mandatory, and — pointedly —{' '}
          <strong className="text-white">&ldquo;there is no controlling authority regulating passage or fee required
          for any route.&rdquo;</strong> US NAVCENT added that <strong className="text-white">&ldquo;no nation has the
          authority to close or control the Strait of Hormuz,&rdquo;</strong> with US forces prepared to defend
          freedom of navigation. Mariners are warned of a mine-danger area in the traditional traffic-separation
          scheme and to expect VHF hailing from naval forces.
        </p>
        <p className="mt-2 text-xs text-gray-300 leading-relaxed">
          War-risk insurance underlines the caution. Marsh, the world&rsquo;s largest marine broker, says premiums to
          transit Hormuz now run <strong className="text-white">2–6% of a vessel&rsquo;s value</strong> — up from a
          fraction of a percent before the war, having peaked near <strong className="text-white">10%</strong> at the
          height of the fighting (large no-claim discounts often trim the headline rate). Brokers report{' '}
          <strong className="text-white">fewer requests for quotes</strong> since the ceasefire frayed this week,
          though cover remains available (Bloomberg, 9 Jul). The Lloyd&rsquo;s Joint War Committee has listed the
          whole Gulf as high-risk since March — a listing that adds cost and a notification duty but does not bar
          transit.
        </p>
        <p className="mt-2 text-xs text-gray-300 leading-relaxed">
          On a second front, Ukraine&rsquo;s drone campaign in the Sea of Azov has escalated sharply. Its Unmanned
          Systems Forces say they have struck Russian shadow-fleet shipping &mdash; the tankers that move sanctioned
          oil and products &mdash; across a nine-day operation, with Kyiv now putting the total at <strong className="text-white">116 vessels</strong>
          (an unverified claim; <strong className="text-white">~76</strong>, including 21 tankers, was the earlier
          multi-sourced count). In response Russia <strong className="text-white">suspended shipping through the Kerch
          Strait and the Don&ndash;Azov Canal</strong> (FSB Border Service, from 10 July) and says it may divert to
          Black Sea and Baltic ports &mdash; a self-imposed chokepoint closure that cut Azov AIS traffic roughly
          <strong className="text-white">55%</strong> (Starboard Maritime). With up to a quarter of Russian wheat
          exports transiting the Azov, Euronext wheat jumped about 4% to a six-week high. The <strong className="text-white">IMO
          Secretary-General</strong> condemned the Azov and Black Sea attacks, warning the focus on Hormuz should not
          overshadow threats elsewhere; Russia&rsquo;s Lavrov called them &ldquo;terrorism,&rdquo; while Kyiv says it
          strikes only military or war-supporting assets. Neither side&rsquo;s figures are independently verified
          (Reuters, TWZ, gCaptain).
        </p>
        <p className="mt-2 text-[10px] text-gray-500 leading-relaxed">
          Sources: Reuters, WSJ, Bloomberg, JMIC 013-26, NAVCENT/NCAGS, Lloyd&rsquo;s JWC, IMO, CENTCOM, UKMTO. Available footage and Tier-1 reporting attribute the
          &ldquo;cancer&rdquo; remark to Iran&rsquo;s government and leadership — not the Iranian people, and not a
          call for their eradication.
        </p>
      </div>

      {/* Hormuz recovery tracker — dedicated view of the flagship chokepoint */}
      {portwatch && <HormuzThroughputPanel data={portwatch} />}

      {/* Hormuz force posture — sourced US/Iran order of battle (reported, not live positions) */}
      <HormuzPosturePanel />

      {/* Live chokepoint transit monitor — IMF PortWatch daily transits vs baseline */}
      {portwatch && <ChokepointTransitPanel data={portwatch} />}

      {/* Panama Canal Watch — the Americas' key chokepoint (locator + live transit) */}
      {portwatch && <PanamaCanalWatch data={portwatch} />}

      {/* Port oil-flow monitor — IMF PortWatch daily tanker volumes vs baseline */}
      {portFlows && <PortFlowPanel data={portFlows} site="americas" />}

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

      {/* Refinery Health Watch — full panel */}
      <RefineryHealthPanel
        data={firmsResult}
        mode="full"
        anchorId="refinery-health"
        regionLabel="major US Gulf, US East/West Coast, Caribbean and Latin American refineries"
      />

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
