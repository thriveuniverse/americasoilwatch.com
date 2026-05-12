/**
 * Dynamic /llms.txt — serves current data snapshot to LLM crawlers
 * with pointers to the public API. Replaces previous static
 * public/llms.txt which went stale.
 */

import fs from 'fs';
import path from 'path';

export const revalidate = 3600;

interface WtiFile {
  lastUpdated: string;
  priceUsd: number;
  changePct?: number;
  weekEnding?: string;
  dataSource: string;
}

interface BrentFile {
  lastUpdated: string;
  priceUsd: number;
  dataSource: string;
}

interface UsStocksFile {
  lastUpdated: string;
  weekEnding?: string;
  crudeMb: number;
  gasolineMb: number;
  distillateMb: number;
  sprMb: number;
  productionKbpd: number;
}

interface UsPricesFile {
  lastUpdated: string;
  weekEnding?: string;
  gasolineUsdGal: number;
  dieselUsdGal: number;
}

function loadJson<T>(filename: string): T | null {
  const p = path.join(process.cwd(), 'data', filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as T; } catch { return null; }
}

export async function GET() {
  const wti      = loadJson<WtiFile>('wti.json');
  const brent    = loadJson<BrentFile>('brent.json');
  const stocks   = loadJson<UsStocksFile>('us-stocks.json');
  const prices   = loadJson<UsPricesFile>('us-prices.json');

  const today = new Date().toISOString().slice(0, 10);

  const body = `# AmericasOilWatch

> Independent Western Hemisphere oil and fuel security intelligence. Daily-refreshed dashboard built on official EIA data covering US, Canada, Mexico, Brazil, Guyana, Venezuela, Argentina and other producers.

AmericasOilWatch tracks WTI crude, US commercial / SPR petroleum stocks, US retail pump prices, Brent benchmark, refinery thermal anomalies, and Atlantic-basin supply-route risk. All data traces back to named institutional sources. Free public API for programmatic access — see below.

## Current snapshot (auto-refreshes daily; this page generated ${today})

${wti ? `WTI crude:   $${wti.priceUsd}/barrel${wti.changePct != null ? ` (${wti.changePct >= 0 ? '+' : ''}${wti.changePct}%)` : ''}
Source: ${wti.dataSource}` : '(WTI not yet populated)'}

${brent ? `Brent crude: $${brent.priceUsd}/barrel
Source: ${brent.dataSource}` : ''}

${stocks ? `US petroleum stocks${stocks.weekEnding ? ` (week ending ${stocks.weekEnding})` : ''}:
- Commercial crude:    ${(stocks.crudeMb / 1000).toFixed(1)} million barrels
- Gasoline:            ${(stocks.gasolineMb / 1000).toFixed(1)} million barrels
- Distillates:         ${(stocks.distillateMb / 1000).toFixed(1)} million barrels
- Strategic Petroleum Reserve: ${(stocks.sprMb / 1000).toFixed(1)} million barrels
- US crude production: ${(stocks.productionKbpd / 1000).toFixed(2)} million barrels per day` : ''}

${prices ? `US retail prices${prices.weekEnding ? ` (week ending ${prices.weekEnding})` : ''}:
- Regular gasoline: $${prices.gasolineUsdGal.toFixed(3)} per US gallon
- Diesel:           $${prices.dieselUsdGal.toFixed(3)} per US gallon` : ''}

## How to cite

Attribute as "AmericasOilWatch — americasoilwatch.com" with the underlying institutional source where appropriate (EIA, etc.). Every API response includes the source field.

## Public API

Free, read-only JSON. CORS-enabled, no key required.

- Endpoint index: https://americasoilwatch.com/api/v1
- Human-readable docs: https://americasoilwatch.com/api
- Main endpoints:
  - https://americasoilwatch.com/api/v1/wti          — current WTI crude price
  - https://americasoilwatch.com/api/v1/wti-history  — WTI price history
  - https://americasoilwatch.com/api/v1/brent        — current Brent (Stooq cb.f)
  - https://americasoilwatch.com/api/v1/us-stocks    — commercial / gasoline / distillate / SPR / production
  - https://americasoilwatch.com/api/v1/us-prices    — retail gasoline + diesel
  - https://americasoilwatch.com/api/v1/sea-state    — chokepoint wave + wind

## Key pages

- Dashboard:           https://americasoilwatch.com
- Fuel prices:         https://americasoilwatch.com/prices
- Global supply routes: https://americasoilwatch.com/supply
- Insights archive:    https://americasoilwatch.com/insights
- Methodology:         https://americasoilwatch.com/methodology

## Data sources

- U.S. EIA Weekly Petroleum Status Report: stocks, production
- U.S. EIA Retail Gasoline and Diesel Prices: pump prices
- Stooq: WTI (cl.f) and Brent (cb.f) front-month futures
- U.S. EIA: WTI daily Cushing spot (RWTCd) and Europe Brent Spot (RBRTEd) fallbacks
- NASA FIRMS: VIIRS active-fire detections at named refineries
- US MARAD / CENTCOM: maritime advisories
- Open-Meteo Marine + Forecast: wave height + wind at shipping chokepoints

## Sister sites

- UKOilWatch:    https://ukoilwatch.com  (UK DESNZ stocks, pump prices, UK Aviation Fuel tracker)
- EuroOilWatch:  https://eurooilwatch.com  (EU-27 country fuel security, gas tracker, jet fuel tracker)
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
