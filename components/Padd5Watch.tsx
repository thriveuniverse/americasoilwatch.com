// West Coast (PADD 5) product-stock watch.
//
// The West Coast is a near-island fuel market — no major product pipelines
// cross the Rockies and the Jones Act throttles domestic waterborne resupply,
// so it leans on Asian imports. National stock totals (dominated by the Gulf
// Coast) routinely mask PADD 5 tightness, so each fuel here is scored against
// its OWN 5-year seasonal band rather than a raw barrel count.

interface Product {
  current: number;
  period: string;
  wowChange: number | null;
  fiveYrMin?: number;
  fiveYrMax?: number;
  fiveYrAvg?: number;
  pctOfRange?: number | null;
  vsAvgPct?: number | null;
  sampleN?: number;
  status?: 'critical' | 'warning' | 'normal' | 'ample';
}

interface Padd5Data {
  weekEnding: string;
  region: string;
  products: Partial<Record<'distillate' | 'jet' | 'gasoline', Product>>;
  dataSource: string;
}

const FUELS: { key: 'distillate' | 'jet' | 'gasoline'; label: string; sub: string }[] = [
  { key: 'distillate', label: 'Diesel / Distillate', sub: 'trucking, rail, Central Valley ag' },
  { key: 'jet',        label: 'Jet Fuel',            sub: 'LAX · SFO · SEA' },
  { key: 'gasoline',   label: 'Gasoline',            sub: 'CARB-spec retail' },
];

const STATUS = {
  critical: { dot: 'bg-red-500',     text: 'text-red-400',     bar: 'bg-red-500',     word: 'Very low for season' },
  warning:  { dot: 'bg-amber-500',   text: 'text-amber-400',   bar: 'bg-amber-500',   word: 'Low for season' },
  normal:   { dot: 'bg-gray-500',    text: 'text-gray-400',    bar: 'bg-gray-500',    word: 'Normal for season' },
  ample:    { dot: 'bg-emerald-500', text: 'text-emerald-400', bar: 'bg-emerald-500', word: 'Ample for season' },
} as const;

function toMb(kb: number) {
  return (kb / 1000).toFixed(1);
}

function FuelRow({ label, sub, p }: { label: string; sub: string; p: Product }) {
  const status = p.status ?? 'normal';
  const s = STATUS[status];
  const pct = p.pctOfRange != null ? Math.round(p.pctOfRange * 100) : null;

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
            <span className="text-sm text-gray-200">{label}</span>
          </div>
          <div className="text-[10px] text-gray-600 ml-3.5">{sub}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-mono font-semibold text-white">
            {toMb(p.current)} <span className="text-xs text-gray-500">MB</span>
          </div>
          {p.wowChange != null && p.wowChange !== 0 && (
            <div className={`text-[10px] font-mono ${p.wowChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {p.wowChange > 0 ? '▲' : '▼'} {Math.abs(p.wowChange / 1000).toFixed(2)} MB w/w
            </div>
          )}
        </div>
      </div>

      {/* Position within the 5-year seasonal range */}
      {pct != null && p.fiveYrMin != null && p.fiveYrMax != null ? (
        <>
          <div className="relative h-1.5 rounded-full bg-oil-800 overflow-hidden">
            <div className={`absolute inset-y-0 left-0 ${s.bar} opacity-80`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] text-gray-600 font-mono">{toMb(p.fiveYrMin)} MB</span>
            <span className={`text-[10px] font-medium ${s.text}`}>
              {s.word}
              {p.vsAvgPct != null && (
                <span className="text-gray-500 font-mono">
                  {' '}· {p.vsAvgPct > 0 ? '+' : ''}{p.vsAvgPct}% vs 5-yr avg
                </span>
              )}
            </span>
            <span className="text-[9px] text-gray-600 font-mono">{toMb(p.fiveYrMax)} MB</span>
          </div>
        </>
      ) : (
        <div className="text-[10px] text-gray-600">Seasonal band unavailable.</div>
      )}
    </div>
  );
}

export default function Padd5Watch({ data }: { data: Padd5Data | null }) {
  if (!data || !data.products || Object.keys(data.products).length === 0) return null;

  const rows = FUELS
    .map(f => ({ ...f, p: data.products[f.key] }))
    .filter((f): f is typeof f & { p: Product } => !!f.p);
  if (rows.length === 0) return null;

  return (
    <section
      aria-label="West Coast PADD 5 product stock watch"
      className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">🌉</span>
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-400 uppercase truncate">
            West Coast (PADD 5) Fuel Watch
          </h2>
        </div>
        <span className="text-[10px] text-gray-600 flex-shrink-0">Week ending {data.weekEnding}</span>
      </div>

      <div className="divide-y divide-oil-800/40">
        {rows.map(r => <FuelRow key={r.key} label={r.label} sub={r.sub} p={r.p} />)}
      </div>

      <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-950/30">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          The West Coast is a near-island market — no major product pipelines cross the Rockies and
          Jones Act rules limit domestic resupply, so it leans on Asian imports. Each fuel is scored
          against its own 5-year range for this week of the year; the bar shows where current stocks sit
          between the 5-year seasonal low and high. National totals can look comfortable while PADD 5 is tight.
          Source: EIA Weekly Petroleum Status Report.
        </p>
      </div>
    </section>
  );
}
