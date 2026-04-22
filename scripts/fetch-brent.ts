#!/usr/bin/env npx tsx
/**
 * AmericasOilWatch — Brent Crude Price Fetcher
 * ==========================================
 * Primary source: Stooq (cb.f front-month futures, ~15 min delayed, CSV).
 * Fallback: Yahoo Finance (BZ=F) — kept because it worked for history seeding.
 *
 * Day-over-day change is computed from our own brent-history.json so we
 * don't need Stooq's historical endpoint (which rate-limits without a session).
 *
 * Usage: npx tsx scripts/fetch-brent.ts
 * Output: data/brent.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { BrentData } from '../lib/types';

const OUTPUT_FILE  = path.join(__dirname, '..', 'data', 'brent.json');
const HISTORY_FILE = path.join(__dirname, '..', 'data', 'brent-history.json');
const EUR_USD      = 0.92;

interface HistoryEntry { date: string; priceUsd: number; priceEur: number; }
interface BrentHistory { lastUpdated: string; entries: HistoryEntry[]; }

/**
 * Primary source: Stooq front-month Brent futures.
 * Returns the current close in USD. No change/previous — computed later from our history.
 */
async function fetchFromStooq(): Promise<number | null> {
  console.log('📈 Trying Stooq (cb.f)...');
  try {
    const res = await fetch('https://stooq.com/q/l/?s=cb.f&f=sd2t2ohlcv&h&e=csv', {
      headers: { 'User-Agent': 'AmericasOilWatch/0.1' },
    });
    if (!res.ok) {
      console.log(`  ⚠️ Stooq returned ${res.status}`);
      return null;
    }
    const csv = await res.text();
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return null;

    // Columns: Symbol,Date,Time,Open,High,Low,Close,Volume
    const cols = lines[1].split(',');
    const close = parseFloat(cols[6]);
    if (!isFinite(close) || close <= 0) {
      console.log(`  ⚠️ Stooq returned invalid close: ${cols[6]}`);
      return null;
    }

    console.log(`  ✅ Stooq Brent close: $${close.toFixed(2)}`);
    return close;
  } catch (err: any) {
    console.log(`  ⚠️ Stooq failed: ${err.message}`);
    return null;
  }
}

/**
 * Fallback: Yahoo Finance chart API.
 */
async function fetchFromYahoo(): Promise<number | null> {
  console.log('📈 Falling back to Yahoo Finance (BZ=F)...');
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=5d',
      { headers: { 'User-Agent': 'AmericasOilWatch/0.1' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const closes = (result.indicators?.quote?.[0]?.close ?? []).filter((c: any) => c != null);
    if (closes.length === 0) return null;

    const latest = closes[closes.length - 1];
    console.log(`  ⚠️ Yahoo Brent close: $${latest.toFixed(2)} (used as fallback)`);
    return latest;
  } catch (err: any) {
    console.log(`  ⚠️ Yahoo failed: ${err.message}`);
    return null;
  }
}

/**
 * Load previous day's close from our own history.
 * Returns null (skip change calc) if most recent entry is more than 5 days old —
 * prevents showing a weekly/multi-day move as if it were day-over-day.
 */
function getPreviousClose(today: string): { price: number; date: string } | null {
  if (!fs.existsSync(HISTORY_FILE)) return null;
  try {
    const hist: BrentHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
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

async function updateBrentHistory(priceUsd: number, priceEur: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  let history: BrentHistory;

  if (fs.existsSync(HISTORY_FILE)) {
    history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  } else {
    history = { lastUpdated: new Date().toISOString(), entries: [] };
  }

  history.entries = history.entries.filter(e => e.date !== today);
  history.entries.push({ date: today, priceUsd, priceEur });
  history.entries = history.entries.sort((a, b) => a.date.localeCompare(b.date)).slice(-365);
  history.lastUpdated = new Date().toISOString();

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  console.log(`   📊 History: ${history.entries.length} entries (${history.entries[0]?.date} → ${today})`);
}

async function main() {
  console.log('🛢️  AmericasOilWatch — Fetching Brent Crude Price');
  console.log('==============================================');

  // Stooq primary, Yahoo fallback
  const priceUsd = await fetchFromStooq() ?? await fetchFromYahoo();

  if (priceUsd === null) {
    console.error('❌ All sources failed — not overwriting brent.json');
    process.exit(1);
  }

  const today    = new Date().toISOString().slice(0, 10);
  const prev     = getPreviousClose(today);
  const priceEur = Math.round(priceUsd * EUR_USD * 100) / 100;

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

  const data: BrentData = {
    lastUpdated: new Date().toISOString(),
    priceUsd:    Math.round(priceUsd * 100) / 100,
    priceEur,
    changeUsd,
    changePct,
    dataSource:  'Stooq (cb.f front-month)',
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  console.log(`\n✅ Written to ${OUTPUT_FILE}`);
  console.log(`   Brent: $${data.priceUsd} / €${data.priceEur} (${changeUsd >= 0 ? '+' : ''}${changeUsd} USD, ${changePct >= 0 ? '+' : ''}${changePct}%)`);

  await updateBrentHistory(data.priceUsd, data.priceEur);
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
