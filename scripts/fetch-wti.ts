#!/usr/bin/env npx tsx
/**
 * AmericasOilWatch — WTI Crude Price Fetcher
 * ===========================================
 * Fetches WTI crude price from Yahoo Finance (CL=F) — no API key needed.
 * Falls back to EIA API if EIA_API_KEY is set.
 *
 * Output: data/wti.json, data/wti-history.json
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');

async function fetchFromYahoo(): Promise<any | null> {
  console.log('📈 Trying Yahoo Finance (CL=F)...');
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=5d',
      { headers: { 'User-Agent': 'AmericasOilWatch/0.1' } }
    );
    if (!res.ok) { console.log(`  ⚠️ Yahoo returned ${res.status}`); return null; }
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const closes = result.indicators?.quote?.[0]?.close?.filter((c: any) => c != null) ?? [];
    if (closes.length < 2) return null;

    const latest = closes[closes.length - 1];
    const prev   = closes[closes.length - 2];
    const change = latest - prev;
    console.log(`  ✅ WTI: $${latest.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)})`);

    return {
      lastUpdated: new Date().toISOString(),
      priceUsd: Math.round(latest * 100) / 100,
      changeUsd: Math.round(change * 100) / 100,
      changePct: Math.round((change / prev) * 10000) / 100,
      weekEnding: new Date().toISOString().slice(0, 10),
      dataSource: 'Yahoo Finance (CL=F)',
    };
  } catch (err: any) {
    console.log(`  ⚠️ Yahoo error: ${err.message}`);
    return null;
  }
}

async function fetchHistoryFromYahoo(): Promise<any[]> {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1wk&range=1y',
      { headers: { 'User-Agent': 'AmericasOilWatch/0.1' } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps = result.timestamps ?? [];
    const closes     = result.indicators?.quote?.[0]?.close ?? [];

    return timestamps
      .map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toISOString().slice(0, 10),
        priceUsd: closes[i] != null ? Math.round(closes[i] * 100) / 100 : null,
      }))
      .filter((e: any) => e.priceUsd != null);
  } catch { return []; }
}

async function fetchFromEIA(): Promise<any | null> {
  const key = process.env.EIA_API_KEY;
  if (!key) return null;
  console.log('📡 Trying EIA API...');
  try {
    const url = new URL('https://api.eia.gov/v2/petroleum/pri/spt/data/');
    url.searchParams.set('api_key', key);
    url.searchParams.set('frequency', 'weekly');
    url.searchParams.set('data[0]', 'value');
    url.searchParams.set('facets[series][]', 'RWTC');
    url.searchParams.set('sort[0][column]', 'period');
    url.searchParams.set('sort[0][direction]', 'desc');
    url.searchParams.set('length', '5');

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = await res.json();
    const rows = json.response?.data ?? [];
    if (rows.length < 2) return null;

    const latest = rows[0];
    const prev   = rows[1];
    const change = latest.value - prev.value;
    console.log(`  ✅ WTI (EIA): $${latest.value}/bbl`);

    return {
      lastUpdated: new Date().toISOString(),
      priceUsd: +latest.value,
      changeUsd: +change.toFixed(2),
      changePct: +((change / prev.value) * 100).toFixed(2),
      weekEnding: latest.period,
      dataSource: 'US Energy Information Administration (EIA)',
    };
  } catch { return null; }
}

async function main() {
  console.log('🛢️  AmericasOilWatch — Fetching WTI Crude Price');
  console.log('='.repeat(48));

  // Load .env.local
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (k && !(k in process.env)) process.env[k] = v;
    }
  }

  const wti = (await fetchFromEIA()) ?? (await fetchFromYahoo());
  if (!wti) throw new Error('All WTI sources failed');

  fs.writeFileSync(path.join(DATA_DIR, 'wti.json'), JSON.stringify(wti, null, 2));
  console.log(`\n✅ WTI written: $${wti.priceUsd}/bbl`);

  // History
  const entries = await fetchHistoryFromYahoo();
  if (entries.length) {
    const history = { lastUpdated: new Date().toISOString(), entries };
    fs.writeFileSync(path.join(DATA_DIR, 'wti-history.json'), JSON.stringify(history, null, 2));
    console.log(`📊 WTI history: ${entries.length} weekly entries`);
  }
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
