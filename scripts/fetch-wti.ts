#!/usr/bin/env npx tsx
/**
 * AmericasOilWatch — WTI Crude Price Fetcher
 * ===========================================
 * Source chain (first non-null wins):
 *   1. Stooq cl.f    — front-month WTI futures, intraday (~15 min delayed)
 *   2. Stooq cl.c    — continuous contract; daily close. Catches the case where
 *                      cl.f returns "N/D" from some IPs even when cb.f works.
 *   3. Yahoo CL=F    — daily close
 *   4. FRED DCOILWTICO — daily Cushing spot; reliably reachable from cloud IPs.
 *                       ~3–5 business day lag. CSV, no API key required.
 *   5. EIA RWTC weekly — last-resort weekly average if EIA_API_KEY is set.
 *
 * Day-over-day change is computed from wti-history.json. If the most recent
 * prior entry is more than 5 days old, change is set to 0 to avoid showing
 * a weekly/multi-day move as if it were daily.
 *
 * Output: data/wti.json, data/wti-history.json
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR     = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'wti-history.json');

interface HistoryEntry { date: string; priceUsd: number; }
interface WtiHistory { lastUpdated: string; entries: HistoryEntry[]; }

// ─── Stooq (cl.f front-month, then cl.c continuous as backup) ────────────────

async function fetchFromStooqSymbol(symbol: string): Promise<number | null> {
  console.log(`📈 Trying Stooq (${symbol})...`);
  try {
    const res = await fetch(`https://stooq.com/q/l/?s=${symbol}&f=sd2t2ohlcv&h&e=csv`, {
      headers: { 'User-Agent': 'AmericasOilWatch/0.1' },
    });
    if (!res.ok) { console.log(`  ⚠️ Stooq returned ${res.status}`); return null; }
    const csv = await res.text();
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return null;

    // Columns: Symbol,Date,Time,Open,High,Low,Close,Volume
    const close = parseFloat(lines[1].split(',')[6]);
    if (!isFinite(close) || close <= 0) {
      console.log(`  ⚠️ Stooq returned invalid close: ${lines[1]}`);
      return null;
    }
    console.log(`  ✅ Stooq WTI (${symbol}) close: $${close.toFixed(2)}`);
    return close;
  } catch (err: any) {
    console.log(`  ⚠️ Stooq (${symbol}) failed: ${err.message}`);
    return null;
  }
}

const fetchFromStooq    = () => fetchFromStooqSymbol('cl.f');
const fetchFromStooqAlt = () => fetchFromStooqSymbol('cl.c');

// ─── Fallback 1: Yahoo Finance ───────────────────────────────────────────────

async function fetchFromYahoo(): Promise<number | null> {
  console.log('📈 Falling back to Yahoo Finance (CL=F)...');
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=5d',
      { headers: { 'User-Agent': 'AmericasOilWatch/0.1' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const closes = (result.indicators?.quote?.[0]?.close ?? []).filter((c: any) => c != null);
    if (closes.length === 0) return null;
    const latest = closes[closes.length - 1];
    console.log(`  ⚠️ Yahoo WTI close: $${latest.toFixed(2)} (used as fallback)`);
    return latest;
  } catch { return null; }
}

// ─── Fallback 2: FRED (St. Louis Fed) — daily Cushing spot, no key needed ────

async function fetchFromFRED(): Promise<number | null> {
  console.log('📊 Falling back to FRED (DCOILWTICO daily Cushing spot)...');
  try {
    const res = await fetch('https://fred.stlouisfed.org/graph/fredgraph.csv?id=DCOILWTICO', {
      headers: { 'User-Agent': 'AmericasOilWatch/0.1' },
    });
    if (!res.ok) { console.log(`  ⚠️ FRED returned ${res.status}`); return null; }
    const csv = await res.text();
    const lines = csv.trim().split('\n');
    // CSV is DATE,DCOILWTICO. Walk back from the last row to find a real value
    // (FRED uses "." for unreleased days).
    for (let i = lines.length - 1; i >= 1; i--) {
      const cols = lines[i].split(',');
      const v = parseFloat(cols[1]);
      if (isFinite(v) && v > 0) {
        console.log(`  ⚠️ FRED WTI (${cols[0]}): $${v.toFixed(2)} (used as fallback)`);
        return v;
      }
    }
    console.log('  ⚠️ FRED returned no usable rows');
    return null;
  } catch (err: any) {
    console.log(`  ⚠️ FRED failed: ${err.message}`);
    return null;
  }
}

// ─── Fallback 3: EIA API (weekly) ────────────────────────────────────────────

async function fetchFromEIA(): Promise<number | null> {
  const key = process.env.EIA_API_KEY;
  if (!key) return null;
  console.log('📡 Falling back to EIA API...');
  try {
    const url = new URL('https://api.eia.gov/v2/petroleum/pri/spt/data/');
    url.searchParams.set('api_key', key);
    url.searchParams.set('frequency', 'weekly');
    url.searchParams.set('data[0]', 'value');
    url.searchParams.set('facets[series][]', 'RWTC');
    url.searchParams.set('sort[0][column]', 'period');
    url.searchParams.set('sort[0][direction]', 'desc');
    url.searchParams.set('length', '1');
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = await res.json();
    const row = json.response?.data?.[0];
    if (!row) return null;
    console.log(`  ⚠️ EIA WTI (weekly ${row.period}): $${row.value}`);
    return +row.value;
  } catch { return null; }
}

// ─── Change calculation (self-contained via history) ─────────────────────────

function getPreviousClose(today: string): { price: number; date: string } | null {
  if (!fs.existsSync(HISTORY_FILE)) return null;
  try {
    const hist: WtiHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    const prior = hist.entries
      .filter(e => e.date < today)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (prior.length === 0) return null;
    const latest = prior[prior.length - 1];
    return { price: latest.priceUsd, date: latest.date };
  } catch { return null; }
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

// ─── History update ──────────────────────────────────────────────────────────

async function updateHistory(priceUsd: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  let history: WtiHistory = fs.existsSync(HISTORY_FILE)
    ? JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))
    : { lastUpdated: new Date().toISOString(), entries: [] };

  history.entries = history.entries.filter(e => e.date !== today);
  history.entries.push({ date: today, priceUsd });
  history.entries = history.entries.sort((a, b) => a.date.localeCompare(b.date)).slice(-365);
  history.lastUpdated = new Date().toISOString();

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  console.log(`   📊 History: ${history.entries.length} entries (${history.entries[0]?.date} → ${today})`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🛢️  AmericasOilWatch — Fetching WTI Crude Price');
  console.log('='.repeat(48));

  // Load .env.local so EIA_API_KEY is picked up if present
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

  const sources: Array<[string, () => Promise<number | null>]> = [
    ['Stooq (cl.f front-month)',                   fetchFromStooq],
    ['Stooq (cl.c continuous)',                    fetchFromStooqAlt],
    ['Yahoo Finance (CL=F)',                       fetchFromYahoo],
    ['FRED (DCOILWTICO daily Cushing)',            fetchFromFRED],
    ['US Energy Information Administration (EIA)', fetchFromEIA],
  ];

  let priceUsd: number | null = null;
  let dataSource = '';
  for (const [label, fn] of sources) {
    const v = await fn();
    if (v !== null) { priceUsd = v; dataSource = label; break; }
  }
  if (priceUsd === null) {
    console.error('❌ All WTI sources failed — not overwriting wti.json');
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const prev  = getPreviousClose(today);

  let changeUsd = 0;
  let changePct = 0;
  if (prev) {
    const gap = daysBetween(prev.date, today);
    if (gap <= 5) {
      changeUsd = Math.round((priceUsd - prev.price) * 100) / 100;
      changePct = Math.round(((priceUsd - prev.price) / prev.price) * 10000) / 100;
    } else {
      console.log(`  ⚠️ Most recent history entry (${prev.date}) is ${gap} days old — skipping change calc`);
    }
  }

  const wti = {
    lastUpdated: new Date().toISOString(),
    priceUsd:    Math.round(priceUsd * 100) / 100,
    changeUsd,
    changePct,
    weekEnding:  today,
    dataSource,
  };

  fs.writeFileSync(path.join(DATA_DIR, 'wti.json'), JSON.stringify(wti, null, 2));
  console.log(`\n✅ WTI written: $${wti.priceUsd}/bbl (${changeUsd >= 0 ? '+' : ''}${changeUsd} USD, ${changePct >= 0 ? '+' : ''}${changePct}%)`);

  await updateHistory(wti.priceUsd);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
