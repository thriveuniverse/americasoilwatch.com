'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

interface Entry { date: string; priceUsd: number }
interface Props  { entries: Entry[] }

function fmtMonth(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function WtiTrendChart({ entries }: Props) {
  if (!entries || entries.length === 0) return null;

  const prices = entries.map(e => e.priceUsd);
  const min = Math.floor(Math.min(...prices) * 0.95);
  const max = Math.ceil(Math.max(...prices) * 1.05);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

  const latest   = entries[entries.length - 1];
  const earliest = entries[0];
  const ytdPct   = ((latest.priceUsd - earliest.priceUsd) / earliest.priceUsd) * 100;

  return (
    <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          WTI Crude — 18-Month Trend
        </h2>
        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
          <span>Avg: <span className="text-gray-300">${avg.toFixed(2)}</span></span>
          <span>Range: <span className="text-gray-300">${min}–${max}</span></span>
          <span>Change:
            <span className={ytdPct >= 0 ? ' text-emerald-400' : ' text-red-400'}>
              {' '}{ytdPct >= 0 ? '+' : ''}{ytdPct.toFixed(1)}%
            </span>
          </span>
        </div>
      </div>
      <div className="p-4" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={entries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#1e3a5f" opacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickFormatter={fmtMonth}
              minTickGap={40}
              stroke="#334155"
            />
            <YAxis
              domain={[min, max]}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickFormatter={v => `$${v}`}
              stroke="#334155"
              width={45}
            />
            <Tooltip
              contentStyle={{ background: '#06111f', border: '1px solid #003d7a', borderRadius: 4, fontSize: 12 }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#79bfff' }}
              formatter={(v: number) => [`$${v.toFixed(2)}`, 'WTI']}
              labelFormatter={(l: string) => new Date(l).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            />
            <ReferenceLine y={avg} stroke="#005dba" strokeDasharray="3 3" opacity={0.4} />
            <Line
              type="monotone"
              dataKey="priceUsd"
              stroke="#329dff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#79bfff', stroke: '#06111f', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="px-5 py-2 border-t border-oil-800/40 bg-oil-900/20">
        <p className="text-[10px] text-gray-600">
          Weekly WTI spot price, Cushing OK. Dashed line = 18-month average. Source: EIA.
        </p>
      </div>
    </div>
  );
}
