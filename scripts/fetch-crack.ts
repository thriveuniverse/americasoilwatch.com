#!/usr/bin/env npx tsx
/**
 * AmericasOilWatch — US 3-2-1 Crack Spread
 * ========================================
 * The 3-2-1 crack spread is the single cleanest proxy for US refining margin:
 * how much a refiner earns turning 3 barrels of crude into 2 barrels of
 * gasoline and 1 barrel of distillate. It is the number that tells you whether
 * refiners have any incentive to run hard — and therefore whether product
 * (pump/diesel) prices will follow crude down or stay stubbornly high.
 *
 *   crack ($/bbl) = [ 2×(gasoline $/gal × 42) + 1×(distillate $/gal × 42)
 *                     − 3×(crude $/bbl) ] ÷ 3
 *
 * All three legs are pulled from EIA daily SPOT prices so the margin is
 * computed on a single consistent basis (not a mix of spot crude vs retail
 * product). US-standard benchmark legs:
 *   - Crude:      WTI Cushing spot                      (RWTC, $/bbl)
 *   - Gasoline:   NY Harbor conventional regular spot   (EER_EPMRU_PF4_Y35NY_DPG, $/gal)
 *   - Distillate: NY Harbor ULSD spot                   (EER_EPD2DXL0_PF4_Y35NY_DPG, $/gal)
 *
 * Requires EIA_API_KEY (free at https://www.eia.gov/opendata/)
 * Output: data/crack.json
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const EIA_KEY  = process.env.EIA_API_KEY ?? '';
const BASE     = 'https://api.eia.gov/v2';
const GAL_PER_BBL = 42;

if (!EIA_KEY) {
  console.error('❌ EIA_API_KEY not set. Get a free key at https://www.eia.gov/opendata/');
  process.exit(1);
}

async function eiaSpot(series: string, length = 400): Promise<{ period: string; value: number }[]> {
  const url = new URL(`${BASE}/petroleum/pri/spt/data/`);
  url.searchParams.set('api_key', EIA_KEY);
  url.searchParams.set('frequency', 'daily');
  url.searchParams.set('data[0]', 'value');
  url.searchParams.set('facets[series][]', series);
  url.searchParams.set('sort[0][column]', 'period');
  url.searchParams.set('sort[0][direction]', 'desc');
  url.searchParams.set('length', String(length));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`EIA HTTP ${res.status} for ${series}`);
  const json = await res.json();
  if (json.response?.error) throw new Error(`EIA error for ${series}: ${json.response.error}`);
  return (json.response?.data ?? [])
    .filter((r: any) => r.value != null && r.value !== '')
    .map((r: any) => ({ period: r.period, value: +r.value }));
}

function crack321(wti: number, gasGal: number, ulsdGal: number): number {
  return (2 * gasGal * GAL_PER_BBL + 1 * ulsdGal * GAL_PER_BBL - 3 * wti) / 3;
}

async function main() {
  console.log('📡 AmericasOilWatch — US 3-2-1 Crack Spread');
  console.log('='.repeat(44));

  const [wti, gas, ulsd] = await Promise.all([
    eiaSpot('RWTC'),                        // WTI Cushing spot, $/bbl
    eiaSpot('EER_EPMRU_PF4_Y35NY_DPG'),     // NY Harbor conventional regular gasoline spot, $/gal
    eiaSpot('EER_EPD2DXL0_PF4_Y35NY_DPG'),  // NY Harbor ULSD spot, $/gal
  ]);
  console.log(`  Pulled ${wti.length} WTI, ${gas.length} gasoline, ${ulsd.length} ULSD daily points`);

  const gasBy  = new Map(gas.map(r => [r.period, r.value]));
  const ulsdBy = new Map(ulsd.map(r => [r.period, r.value]));

  // Only dates where all three legs settled — the crack is undefined otherwise.
  const series = wti
    .filter(r => gasBy.has(r.period) && ulsdBy.has(r.period))
    .map(r => {
      const g = gasBy.get(r.period)!;
      const d = ulsdBy.get(r.period)!;
      return {
        date: r.period,
        crackUsd: +crack321(r.value, g, d).toFixed(2),
        wtiUsd: +r.value.toFixed(2),
        gasolineUsdGal: +g.toFixed(3),
        ulsdUsdGal: +d.toFixed(3),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first

  if (series.length < 2) {
    console.error(`❌ Only ${series.length} aligned data point(s) — refusing to overwrite crack.json`);
    process.exit(1);
  }

  const latest = series[0];
  const prev   = series[1];
  const yearAgo = series.find(s => s.date <= isoOffsetDays(latest.date, -365)) ?? series[series.length - 1];

  const out = {
    lastUpdated: new Date().toISOString(),
    latestDate: latest.date,
    crackUsd: latest.crackUsd,
    crackChangeUsd: +(latest.crackUsd - prev.crackUsd).toFixed(2),
    crackVsYearAgoUsd: +(latest.crackUsd - yearAgo.crackUsd).toFixed(2),
    components: {
      wtiUsd: latest.wtiUsd,
      gasolineUsdGal: latest.gasolineUsdGal,
      ulsdUsdGal: latest.ulsdUsdGal,
    },
    // Newest-last, trimmed to ~120 trading days for a clean sparkline.
    history: series.slice(0, 120).reverse().map(s => ({ date: s.date, crackUsd: s.crackUsd })),
    formula: '3-2-1: (2×gasoline$/gal×42 + 1×ULSD$/gal×42 − 3×WTI$/bbl) ÷ 3',
    legs: {
      crude: 'WTI Cushing spot (EIA RWTC)',
      gasoline: 'NY Harbor conventional regular gasoline spot (EIA)',
      distillate: 'NY Harbor ULSD spot (EIA)',
    },
    dataSource: 'US Energy Information Administration (EIA), daily spot prices',
  };

  fs.writeFileSync(path.join(DATA_DIR, 'crack.json'), JSON.stringify(out, null, 2));
  console.log(`  ✓ 3-2-1 crack: $${out.crackUsd}/bbl (${out.crackChangeUsd >= 0 ? '+' : ''}${out.crackChangeUsd} d/d) — ${latest.date}`);
  console.log(`    WTI $${latest.wtiUsd} · gasoline $${latest.gasolineUsdGal}/gal · ULSD $${latest.ulsdUsdGal}/gal`);
}

/** ISO date string offset by N days (UTC). new Date(string) is allowed; argless is not. */
function isoOffsetDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
