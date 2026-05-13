'use client';

import { useState } from 'react';

interface MonthlyPoint { period: string; kbpd: number; }

interface Member {
  code: string;
  name: string;
  group: 'OPEC' | 'Non-OPEC';
  quotaKbpd: number | null;
  exemptReason?: string;
  latestKbpd: number | null;
  latestPeriod: string | null;
  history: MonthlyPoint[];
  vsQuota: number | null;
}

export interface OpecData {
  lastUpdated: string;
  latestDataPeriod: string | null;
  dataSource: string;
  quotaSource: string;
  publicationLag: string;
  totals: {
    opecKbpd: number;
    opecNonExemptKbpd: number;
    nonOpecKbpd: number;
    nonOpecNonExemptKbpd: number;
    combinedKbpd: number;
    opecQuotaKbpd: number;
    nonOpecQuotaKbpd: number;
    combinedQuotaKbpd: number;
    opecComplianceKbpd: number;
    nonOpecComplianceKbpd: number;
  };
  members: Member[];
}

function formatPeriod(p: string | null): string {
  if (!p) return '—';
  const [y, m] = p.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} '${y.slice(2)}`;
}

function formatKbpd(v: number | null | undefined): string {
  if (v == null) return '—';
  return v.toLocaleString();
}

function colorVsQuota(vsQuota: number | null): string {
  if (vsQuota == null) return 'text-gray-400';
  // OPEC+ has tolerated over-production historically. The badge:
  // - Within ±100 kbpd: in compliance (green)
  // - 100-300 kbpd over: minor (amber)
  // - >300 kbpd over: cheating (orange)
  // - Under quota: green (under-producing is benign for cartel discipline)
  if (vsQuota < -100)   return 'text-gray-300';  // significantly under
  if (vsQuota <= 100)   return 'text-emerald-400';
  if (vsQuota <= 300)   return 'text-amber-400';
  return 'text-orange-400';
}

export default function OpecPlusTracker({ data }: { data: OpecData }) {
  const [sortKey, setSortKey] = useState<'production' | 'quota' | 'vsQuota' | 'name'>('production');

  const opecMembers    = data.members.filter(m => m.group === 'OPEC');
  const nonOpecMembers = data.members.filter(m => m.group === 'Non-OPEC');

  const sortFn = (a: Member, b: Member) => {
    if (sortKey === 'production') return (b.latestKbpd ?? 0) - (a.latestKbpd ?? 0);
    if (sortKey === 'quota')      return (b.quotaKbpd ?? 0) - (a.quotaKbpd ?? 0);
    if (sortKey === 'vsQuota') {
      const av = a.vsQuota ?? -Infinity;
      const bv = b.vsQuota ?? -Infinity;
      return bv - av;
    }
    return a.name.localeCompare(b.name);
  };

  const renderRow = (m: Member) => {
    const exempt = m.quotaKbpd == null;
    return (
      <tr key={m.code} className="border-b border-oil-800/40">
        <td className="px-3 py-2 text-gray-200 text-xs">{m.name}</td>
        <td className="px-3 py-2 text-right font-mono text-xs text-white">{formatKbpd(m.latestKbpd)}</td>
        <td className="px-3 py-2 text-right font-mono text-xs text-gray-400 hidden sm:table-cell">
          {exempt ? <span className="text-[10px] text-gray-500 italic">exempt</span> : formatKbpd(m.quotaKbpd)}
        </td>
        <td className={`px-3 py-2 text-right font-mono text-xs ${colorVsQuota(m.vsQuota)} hidden sm:table-cell`}>
          {exempt ? '—' : m.vsQuota != null ? `${m.vsQuota >= 0 ? '+' : ''}${m.vsQuota}` : '—'}
        </td>
      </tr>
    );
  };

  const Section = ({ title, members, total, nonExemptTotal, quotaTotal, compliance }: {
    title: string;
    members: Member[];
    total: number;
    nonExemptTotal: number;
    quotaTotal: number;
    compliance: number;
  }) => (
    <div className="rounded-md border border-oil-800 bg-oil-950/30 overflow-hidden">
      <div className="px-4 py-2 bg-oil-900/60 border-b border-oil-800 flex items-baseline justify-between flex-wrap gap-2">
        <h3 className="text-xs font-mono font-semibold tracking-widest text-gray-300 uppercase">{title}</h3>
        <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500">
          <span>Total: <span className="text-white font-semibold">{formatKbpd(total)}</span> kbpd</span>
          <span>· Quota: <span className="text-gray-300">{formatKbpd(quotaTotal)}</span></span>
          <span>· Compliance: <span className={colorVsQuota(compliance)}>{compliance >= 0 ? '+' : ''}{compliance.toLocaleString()}</span></span>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr className="text-[10px] text-gray-500 uppercase tracking-wider">
            <th className="text-left px-3 py-2 cursor-pointer hover:text-gray-300" onClick={() => setSortKey('name')}>Country</th>
            <th className="text-right px-3 py-2 cursor-pointer hover:text-gray-300" onClick={() => setSortKey('production')}>Production (kbpd)</th>
            <th className="text-right px-3 py-2 hidden sm:table-cell cursor-pointer hover:text-gray-300" onClick={() => setSortKey('quota')}>Quota</th>
            <th className="text-right px-3 py-2 hidden sm:table-cell cursor-pointer hover:text-gray-300" onClick={() => setSortKey('vsQuota')}>vs Quota</th>
          </tr>
        </thead>
        <tbody>
          {[...members].sort(sortFn).map(renderRow)}
        </tbody>
      </table>
    </div>
  );

  return (
    <section className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
      <div className="px-5 py-3 border-b border-oil-800/60 flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">
          OPEC+ Production vs Declaration of Cooperation Quotas
        </h2>
        <span className="text-[10px] font-mono text-gray-600">
          Latest data: {formatPeriod(data.latestDataPeriod)}
        </span>
      </div>

      {/* Headline totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-oil-800/40">
        <div className="bg-oil-900/30 px-5 py-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">OPEC+ combined</p>
          <p className="text-2xl font-mono font-bold text-white">
            {(data.totals.combinedKbpd / 1000).toFixed(2)}<span className="text-sm text-gray-500 ml-0.5">mbpd</span>
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            Quota: {(data.totals.combinedQuotaKbpd / 1000).toFixed(2)} mbpd (non-exempt only)
          </p>
        </div>
        <div className="bg-oil-900/30 px-5 py-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">OPEC core</p>
          <p className="text-2xl font-mono font-bold text-white">
            {(data.totals.opecKbpd / 1000).toFixed(2)}<span className="text-sm text-gray-500 ml-0.5">mbpd</span>
          </p>
          <p className={`text-[10px] mt-1 ${colorVsQuota(data.totals.opecComplianceKbpd)}`}>
            Non-exempt vs quota: {data.totals.opecComplianceKbpd >= 0 ? '+' : ''}{data.totals.opecComplianceKbpd.toLocaleString()} kbpd
          </p>
        </div>
        <div className="bg-oil-900/30 px-5 py-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">Non-OPEC partners</p>
          <p className="text-2xl font-mono font-bold text-white">
            {(data.totals.nonOpecKbpd / 1000).toFixed(2)}<span className="text-sm text-gray-500 ml-0.5">mbpd</span>
          </p>
          <p className={`text-[10px] mt-1 ${colorVsQuota(data.totals.nonOpecComplianceKbpd)}`}>
            Non-exempt vs quota: {data.totals.nonOpecComplianceKbpd >= 0 ? '+' : ''}{data.totals.nonOpecComplianceKbpd.toLocaleString()} kbpd
          </p>
        </div>
      </div>

      {/* Disclosure on lag */}
      <div className="px-5 py-3 border-t border-oil-800/40 bg-amber-950/15">
        <p className="text-xs text-amber-200/90 leading-relaxed">
          <strong className="text-amber-300">⚠ Publication lag:</strong>{' '}
          EIA international data publishes with a ~3-month delay. Latest available period is{' '}
          <span className="font-mono">{formatPeriod(data.latestDataPeriod)}</span>{' '}
          — this <strong>does not yet reflect</strong> the Hormuz war period (28 Feb 2026 onwards).
          Use this tracker for structural context (member composition, quota schedule, pre-war baseline),
          not real-time post-war production.
        </p>
      </div>

      {/* Section: OPEC core */}
      <div className="px-5 py-4 border-t border-oil-800/40 space-y-3">
        <Section
          title="OPEC core members"
          members={opecMembers}
          total={data.totals.opecKbpd}
          nonExemptTotal={data.totals.opecNonExemptKbpd}
          quotaTotal={data.totals.opecQuotaKbpd}
          compliance={data.totals.opecComplianceKbpd}
        />
        <Section
          title="Non-OPEC partners (Declaration of Cooperation)"
          members={nonOpecMembers}
          total={data.totals.nonOpecKbpd}
          nonExemptTotal={data.totals.nonOpecNonExemptKbpd}
          quotaTotal={data.totals.nonOpecQuotaKbpd}
          compliance={data.totals.nonOpecComplianceKbpd}
        />
      </div>

      {/* Methodology / sources */}
      <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-950/40">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Production via <a href="https://www.eia.gov/international/data/world" target="_blank" rel="noopener" className="text-oil-400 hover:underline">U.S. EIA International data</a> (product 53: total petroleum and other liquids; activity 1: production). Quotas from OPEC+ Declaration of Cooperation as of late 2024 — JMMC adjusts these periodically. Note that EIA reports total liquids while OPEC quotas are against crude only, so member-level vs-quota comparison is approximate. Iran, Venezuela and Libya are exempt under the current accord; their production is included in totals but not in quota sums.
        </p>
      </div>
    </section>
  );
}
