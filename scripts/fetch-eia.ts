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
 *
 * Requires EIA_API_KEY (free at https://www.eia.gov/opendata/)
 * Output: data/wti.json, data/us-stocks.json, data/us-prices.json
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

  // Series IDs:
  // WCSSTUS1 = US commercial crude stocks (MB)
  // WGTSTUS1 = US total gasoline stocks (MB)
  // WDISTUS1 = US distillate fuel oil stocks (MB)
  // WCSSTUS2 = US SPR crude stocks (MB)  — actually WPRSTUS1
  // WCRFPUS2 = US crude production (kb/d)

  const seriesMap: Record<string, string> = {
    'WCSSTUS1': 'crudeMb',
    'WGTSTUS1': 'gasolineMb',
    'WDISTUS1': 'distillateMb',
    'WPRSTUS1': 'sprMb',
    'WCRFPUS2': 'productionKbpd',
  };

  const results: Record<string, { current: number; prev: number }> = {};

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
        results[field] = { current: +rows[0].value, prev: rows[1] ? +rows[1].value : +rows[0].value };
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
    weekEnding: new Date().toISOString().slice(0, 10),
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

  console.log('\n✅ EIA fetch complete');
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
