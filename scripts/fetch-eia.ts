#!/usr/bin/env npx tsx
/**
 * AmericasOilWatch — EIA Data Fetcher
 * =====================================
 * Fetches from the US Energy Information Administration (EIA) API v2:
 *   - WTI crude spot price (weekly)
 *   - US commercial crude stocks (weekly)
 *   - US gasoline & distillate stocks (weekly)
 *   - US crude production (weekly)
 *   - US retail gasoline & diesel prices (weekly)
 *   - West Coast (PADD 5) distillate / jet fuel / gasoline stocks (weekly),
 *     scored against their own 5-year seasonal band (the West Coast is a
 *     near-island market — national totals mask its regional tightness)
 *
 * Requires EIA_API_KEY (free at https://www.eia.gov/opendata/)
 * Output: data/wti.json, data/us-stocks.json, data/us-prices.json,
 *         data/padd5-stocks.json
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const EIA_KEY  = process.env.EIA_API_KEY ?? '';
const BASE     = 'https://api.eia.gov/v2';

if (!EIA_KEY) {
  console.error('❌ EIA_API_KEY not set. Get a free key at https://www.eia.gov/opendata/');
  process.exit(1);
}

async function eiaFetch(path_: string, params: Record<string, string>): Promise<any> {
  const url = new URL(`${BASE}${path_}`);
  url.searchParams.set('api_key', EIA_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`EIA HTTP ${res.status}: ${path_}`);
  const json = await res.json();
  if (json.response?.error) throw new Error(`EIA error: ${json.response.error}`);
  return json.response?.data ?? [];
}

async function fetchUSStocks() {
  console.log('  Fetching US petroleum stocks...');

  // EIA weekly stock series — verified against the API (values in thousand barrels):
  //   WCESTUS1 = US commercial crude excl SPR (~433.7 MMbbl)  ← commercial crude
  //   WCSSTUS1 = US crude oil in the SPR       (~357.1 MMbbl)  ← SPR
  //   WGTSTUS1 = US total gasoline stocks
  //   WDISTUS1 = US distillate fuel oil stocks
  // NB: the prior mapping was wrong — crudeMb pulled WCSSTUS1 (the SPR), and sprMb
  // pulled WPRSTUS1 (which is PROPANE stocks). Both corrected here. Production has no
  // series on this endpoint and is fetched from the supply endpoint below.
  const seriesMap: Record<string, string> = {
    'WCESTUS1': 'crudeMb',
    'WGTSTUS1': 'gasolineMb',
    'WDISTUS1': 'distillateMb',
    'WCSSTUS1': 'sprMb',
  };

  const results: Record<string, { current: number; prev: number; period?: string }> = {};

  for (const [series, field] of Object.entries(seriesMap)) {
    try {
      const rows = await eiaFetch('/petroleum/stoc/wstk/data/', {
        'frequency': 'weekly',
        'data[0]': 'value',
        'facets[series][]': series,
        'sort[0][column]': 'period',
        'sort[0][direction]': 'desc',
        'length': '2',
      });
      if (rows.length >= 1) {
        results[field] = { current: +rows[0].value, prev: rows[1] ? +rows[1].value : +rows[0].value, period: rows[0].period };
      }
    } catch (e: any) {
      console.warn(`    ⚠ ${series}: ${e.message}`);
    }
  }

  // Try production from petroleum supply series if stocks didn't include it
  if (!results['productionKbpd']) {
    try {
      const rows = await eiaFetch('/petroleum/sum/sndw/data/', {
        'frequency': 'weekly',
        'data[0]': 'value',
        'facets[series][]': 'WCRFPUS2',
        'sort[0][column]': 'period',
        'sort[0][direction]': 'desc',
        'length': '2',
      });
      if (rows.length >= 1) {
        results['productionKbpd'] = { current: +rows[0].value, prev: rows[1] ? +rows[1].value : +rows[0].value };
      }
    } catch {}
  }

  const out = {
    lastUpdated: new Date().toISOString(),
    weekEnding: results['crudeMb']?.period ?? new Date().toISOString().slice(0, 10),
    crudeMb: results['crudeMb']?.current ?? null,
    crudeMbChange: results['crudeMb'] ? +(results['crudeMb'].current - results['crudeMb'].prev).toFixed(1) : null,
    gasolineMb: results['gasolineMb']?.current ?? null,
    gasolineMbChange: results['gasolineMb'] ? +(results['gasolineMb'].current - results['gasolineMb'].prev).toFixed(1) : null,
    distillateMb: results['distillateMb']?.current ?? null,
    distillateMbChange: results['distillateMb'] ? +(results['distillateMb'].current - results['distillateMb'].prev).toFixed(1) : null,
    sprMb: results['sprMb']?.current ?? null,
    productionKbpd: results['productionKbpd']?.current ?? null,
    dataSource: 'US Energy Information Administration (EIA)',
  };

  fs.writeFileSync(path.join(DATA_DIR, 'us-stocks.json'), JSON.stringify(out, null, 2));
  console.log(`  ✓ US crude stocks: ${out.crudeMb} MB, production: ${out.productionKbpd} kb/d`);
}

async function fetchUSPrices() {
  console.log('  Fetching US retail fuel prices...');

  // EMM_EPM0_PTE_NUS_DPG = US regular gasoline, $/gal
  // EMM_EPD2D_PTE_NUS_DPG = US all grades diesel, $/gal
  const gasRows = await eiaFetch('/petroleum/pri/gnd/data/', {
    'frequency': 'weekly',
    'data[0]': 'value',
    'facets[series][]': 'EMM_EPM0_PTE_NUS_DPG',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    'length': '5',
  });

  const dslRows = await eiaFetch('/petroleum/pri/gnd/data/', {
    'frequency': 'weekly',
    'data[0]': 'value',
    'facets[series][]': 'EMD_EPD2D_PTE_NUS_DPG',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    'length': '5',
  });

  const gas    = gasRows[0];
  const gasPrev= gasRows[1];
  const dsl    = dslRows[0];
  const dslPrev= dslRows[1];

  const out = {
    lastUpdated: new Date().toISOString(),
    weekEnding: gas?.period ?? new Date().toISOString().slice(0, 10),
    gasolineUsdGal: gas ? +gas.value : null,
    gasolineChangeUsdGal: (gas && gasPrev) ? +(gas.value - gasPrev.value).toFixed(3) : null,
    dieselUsdGal: dsl ? +dsl.value : null,
    dieselChangeUsdGal: (dsl && dslPrev) ? +(dsl.value - dslPrev.value).toFixed(3) : null,
    dataSource: 'US Energy Information Administration (EIA)',
  };

  fs.writeFileSync(path.join(DATA_DIR, 'us-prices.json'), JSON.stringify(out, null, 2));
  console.log(`  ✓ US gasoline: $${out.gasolineUsdGal}/gal, diesel: $${out.dieselUsdGal}/gal`);
}

/**
 * West Coast (PADD 5) product stocks vs their own 5-year seasonal band.
 *
 * The West Coast is effectively an island fuel market — no major product
 * pipelines cross the Rockies and Jones Act limits domestic waterborne
 * resupply, so it leans on Asian imports. National stock totals (dominated by
 * PADD 3, the Gulf Coast) can look comfortable while PADD 5 is tight. We score
 * each fuel against the min/max/avg for the SAME time of year over the prior
 * 5 years, because raw barrels are seasonal and meaningless without that frame.
 */
const dayOfYear = (d: Date) =>
  Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86_400_000);

function seasonalBand(
  history: { period: string; value: number }[],
  current: { period: string; value: number },
) {
  const cur = new Date(current.period);
  const curDOY = dayOfYear(cur);
  const fiveYrAgo = new Date(cur);
  fiveYrAgo.setUTCFullYear(cur.getUTCFullYear() - 5);

  const band = history
    .filter(r => {
      const d = new Date(r.period);
      if (d >= cur || d < fiveYrAgo) return false; // strictly prior 5 years
      let diff = Math.abs(dayOfYear(d) - curDOY);
      diff = Math.min(diff, 365 - diff); // wrap year boundary
      return diff <= 10; // ±10 days of the same calendar week
    })
    .map(r => r.value);

  if (band.length < 3) return null; // not enough seasonal points to be meaningful

  const min = Math.min(...band);
  const max = Math.max(...band);
  const avg = band.reduce((a, b) => a + b, 0) / band.length;
  const pctOfRange = max > min ? Math.max(0, Math.min(1, (current.value - min) / (max - min))) : null;
  const vsAvgPct = avg > 0 ? +(((current.value - avg) / avg) * 100).toFixed(1) : null;

  // Tightness status — LOW stocks for the season = tight = worse.
  let status: 'critical' | 'warning' | 'normal' | 'ample' = 'normal';
  if (pctOfRange !== null) {
    if (pctOfRange < 0.15) status = 'critical';
    else if (pctOfRange < 0.35) status = 'warning';
    else if (pctOfRange > 0.7) status = 'ample';
  }

  return {
    fiveYrMin: Math.round(min),
    fiveYrMax: Math.round(max),
    fiveYrAvg: Math.round(avg),
    pctOfRange: pctOfRange === null ? null : +pctOfRange.toFixed(3),
    vsAvgPct,
    sampleN: band.length,
    status,
  };
}

async function fetchPADD5() {
  console.log('  Fetching West Coast (PADD 5) product stocks...');

  // EIA weekly ending-stock series for PADD 5 (West Coast), in thousand barrels:
  //   WDISTP51 = distillate fuel oil (diesel/heating oil)
  //   WKJSTP51 = kerosene-type jet fuel
  //   WGTSTP51 = total motor gasoline
  const seriesMap: Record<string, string> = {
    'WDISTP51': 'distillate',
    'WKJSTP51': 'jet',
    'WGTSTP51': 'gasoline',
  };

  const products: Record<string, any> = {};
  let latestPeriod = '';

  for (const [series, key] of Object.entries(seriesMap)) {
    try {
      const rows: { period: string; value: string }[] = await eiaFetch('/petroleum/stoc/wstk/data/', {
        'frequency': 'weekly',
        'data[0]': 'value',
        'facets[series][]': series,
        'sort[0][column]': 'period',
        'sort[0][direction]': 'desc',
        'length': '320', // ~6 years of weekly points
      });
      if (!rows.length) { console.warn(`    ⚠ ${series}: no rows`); continue; }

      const history = rows
        .filter(r => r.value != null && r.value !== '')
        .map(r => ({ period: r.period, value: +r.value }));
      const current = history[0];
      const prev = history[1];
      if (current.period > latestPeriod) latestPeriod = current.period;

      products[key] = {
        current: current.value,
        period: current.period,
        wowChange: prev ? +(current.value - prev.value).toFixed(0) : null,
        ...seasonalBand(history, current),
      };
      console.log(`    ✓ ${key}: ${current.value.toLocaleString()} Mbbl (${products[key].status ?? 'n/a'})`);
    } catch (e: any) {
      console.warn(`    ⚠ ${series}: ${e.message}`);
    }
  }

  if (Object.keys(products).length === 0) {
    console.warn('  ⚠ PADD 5: no series fetched, leaving existing file untouched');
    return;
  }

  const out = {
    lastUpdated: new Date().toISOString(),
    weekEnding: latestPeriod,
    region: 'West Coast (PADD 5)',
    products,
    note: 'Scored against each fuel\'s own 5-year seasonal band (same calendar week). Low for the season = tight.',
    dataSource: 'US Energy Information Administration (EIA), Weekly Petroleum Status Report',
  };

  fs.writeFileSync(path.join(DATA_DIR, 'padd5-stocks.json'), JSON.stringify(out, null, 2));
  console.log(`  ✓ PADD 5 stocks written (week ending ${latestPeriod})`);
}

async function main() {
  console.log('📡 AmericasOilWatch — EIA Data Fetch');
  console.log('='.repeat(40));

  // NOTE: fetchWTI() intentionally not called here. WTI is owned by
  // scripts/fetch-wti.ts, which has a richer source chain (Stooq → Yahoo →
  // EIA daily Cushing → FRED → EIA weekly). Calling fetchWTI() from this
  // script — which runs AFTER fetch:wti in the workflow — would clobber
  // a fresh daily value with the stale weekly RWTC average.
  await fetchUSStocks();
  await fetchUSPrices();
  await fetchPADD5();

  console.log('\n✅ EIA fetch complete');
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
