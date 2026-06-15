// Panama Canal Watch (AmericasOilWatch) — the Western Hemisphere's key chokepoint.
// Lightweight SVG locator + live transit from IMF PortWatch (chokepoint2) vs 2023.
import type { PortwatchData } from './ChokepointTransitPanel';

function sev(pct: number | null) {
  if (pct == null) return { txt: 'text-gray-400', bar: '#6b7280', label: 'no baseline' };
  if (pct < 50) return { txt: 'text-red-400', bar: '#f87171', label: 'severely restricted' };
  if (pct < 85) return { txt: 'text-orange-300', bar: '#fdba74', label: 'reduced transits' };
  if (pct <= 115) return { txt: 'text-emerald-300', bar: '#6ee7b7', label: 'near normal' };
  return { txt: 'text-sky-300', bar: '#7dd3fc', label: 'above 2023' };
}

function Spark({ pts, color }: { pts: number[]; color: string }) {
  if (pts.length < 2) return null;
  const w = 150, h = 30, max = Math.max(...pts, 1), min = Math.min(...pts), rng = max - min || 1;
  const path = pts.map((v, i) => `${((i / (pts.length - 1)) * w).toFixed(1)},${(h - ((v - min) / rng) * (h - 3) - 1.5).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full" aria-hidden="true">
      <polyline points={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Stylised locator: Caribbean (top) ↔ canal ↔ Pacific (bottom) across the isthmus.
function Locator({ tint }: { tint: string }) {
  return (
    <svg viewBox="0 0 300 170" className="w-full h-auto rounded-md border border-oil-800" role="img" aria-label="Panama Canal locator: Caribbean Sea to the Pacific Ocean across the isthmus">
      <rect x="0" y="0" width="300" height="170" fill="#0a1f2e" />
      {/* Caribbean / Atlantic (top) */}
      <rect x="0" y="0" width="300" height="70" fill="#0e2c3f" />
      {/* Pacific (bottom) */}
      <rect x="0" y="104" width="300" height="66" fill="#0c2433" />
      {/* isthmus land band */}
      <path d="M0,70 L300,62 L300,112 L0,104 Z" fill="#16351f" stroke="#1f4a2c" strokeWidth="1" />
      {/* the canal cut */}
      <path d="M150,58 C150,80 168,92 168,116" fill="none" stroke={tint} strokeWidth="4" strokeLinecap="round" opacity="0.9" />
      {/* ships on the canal */}
      <circle cx="153" cy="74" r="2.4" fill="#e7eef3" />
      <circle cx="161" cy="98" r="2.4" fill="#e7eef3" />
      {/* endpoints */}
      <circle cx="150" cy="58" r="3" fill={tint} /><text x="156" y="50" fill="#9fb4c0" fontSize="9" fontFamily="monospace">Colón</text>
      <circle cx="168" cy="116" r="3" fill={tint} /><text x="174" y="124" fill="#9fb4c0" fontSize="9" fontFamily="monospace">Balboa</text>
      <text x="10" y="20" fill="#5e7d8c" fontSize="10" fontFamily="monospace">CARIBBEAN / ATLANTIC</text>
      <text x="10" y="160" fill="#5e7d8c" fontSize="10" fontFamily="monospace">PACIFIC OCEAN</text>
      <text x="232" y="90" fill="#5a7a4e" fontSize="10" fontFamily="monospace">PANAMA</text>
    </svg>
  );
}

export default function PanamaCanalWatch({ data }: { data: PortwatchData }) {
  const p = data?.chokepoints?.find((c) => c.key === 'panama');
  if (!p) return null;
  const s = sev(p.pctTankerTonnage);

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-bold text-white tracking-wide uppercase">Panama Canal Watch</h2>
        <span className="text-[11px] text-gray-500">Live transit vs 2023 · IMF PortWatch (AIS estimates)</span>
      </div>
      <p className="mt-1 text-xs text-gray-400 max-w-2xl">
        The Western Hemisphere&rsquo;s key chokepoint — the Pacific↔Atlantic shortcut that keeps US Gulf and
        East Coast cargoes off the long route around South America.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[200px_1fr] items-center">
        <Locator tint={s.bar} />
        <div>
          <div className="flex items-end gap-3">
            <div className={`text-3xl font-bold ${s.txt}`}>{p.pctTankerTonnage != null ? `${p.pctTankerTonnage}%` : '—'}</div>
            <div className="text-xs text-gray-400 pb-1">of 2023 tanker tonnage · <span className={s.txt}>{s.label}</span></div>
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            {p.avg7.tanker ?? '—'}/day tankers · {p.avg7.total ?? '—'}/day all vessels (7-day avg)
          </div>
          <div className="mt-2"><Spark pts={p.series.map((x) => x.c)} color={s.bar} /></div>
          <div className="text-[10px] text-gray-600">90-day tanker-tonnage trend</div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-gray-500 leading-relaxed">
        Watch the <span className="text-gray-400">draft</span>, not just the count: Panama&rsquo;s throughput is
        rationed by Gatún Lake water levels, and drought has forced deep transit cuts before (2023–24). A dry
        season that lowers the lake squeezes daily slots and pushes more tonnage onto the longer Cape Horn / Suez
        routes. Latest data {p.latestDate} (PortWatch reports ~a week in arrears). Source:{' '}
        <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-oil-400 hover:underline">IMF PortWatch</a>
        {' '}— transit estimated from satellite AIS, not canal-authority counts.
      </p>
    </div>
  );
}
