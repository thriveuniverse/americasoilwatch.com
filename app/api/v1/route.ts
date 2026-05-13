/**
 * API root — machine-readable index of available endpoints.
 * Human-readable docs at /api.
 */

import { NextResponse } from 'next/server';

const BASE = 'https://americasoilwatch.com/api/v1';

const RESOURCES = [
  { name: 'wti',                description: 'Current WTI crude price (Cushing, OK)',                                       source: 'Stooq cl.f → EIA daily Cushing fallback chain' },
  { name: 'wti-history',        description: 'WTI price history (rolling, daily)',                                          source: 'Stooq / EIA RWTC' },
  { name: 'brent',              description: 'Current Brent crude price (front-month futures)',                             source: 'Stooq (cb.f)' },
  { name: 'brent-history',      description: 'Brent price history',                                                          source: 'Stooq' },
  { name: 'brent-eia-daily',    description: 'EIA Europe Brent Spot Price FOB daily series, since 20 May 1987',              source: 'U.S. EIA (RBRTE)' },
  { name: 'us-stocks',          description: 'US commercial crude, gasoline, distillate, SPR stocks and production',         source: 'U.S. EIA Weekly Petroleum Status Report' },
  { name: 'us-prices',          description: 'US weekly retail gasoline and diesel prices',                                   source: 'U.S. EIA' },
  { name: 'bunker',             description: 'Marine bunker fuel price estimates (VLSFO / MGO)',                              source: 'Derived from Brent' },
  { name: 'bunker-history',     description: 'Rolling history of bunker fuel estimates',                                     source: 'Derived from Brent' },
  { name: 'sea-state',          description: 'Live wave height + wind at key oil-shipping chokepoints',                      source: 'Open-Meteo Marine + Forecast' },
  { name: 'marad-advisories',   description: 'US MARAD maritime security advisories',                                         source: 'maritime.dot.gov' },
  { name: 'centcom-advisories', description: 'CENTCOM Middle East maritime advisories',                                       source: 'U.S. Central Command via DVIDS' },
  { name: 'crea-feed',          description: 'Energy and clean air research feed',                                            source: 'CREA' },
  { name: 'news-feed',          description: 'Aggregated oil and energy news headlines',                                       source: 'OilPrice.com, Rigzone, Offshore Technology RSS' },
  { name: 'opec',               description: 'OPEC+ member crude production from EIA international data vs Declaration of Cooperation quota schedule', source: 'U.S. EIA International + OPEC+ JMMC schedule' },
];

export async function GET() {
  return NextResponse.json(
    {
      service: 'AmericasOilWatch Public API',
      version: 'v1',
      docs: 'https://americasoilwatch.com/api',
      cors: 'open',
      cache: 'public, s-maxage=300, stale-while-revalidate=3600',
      citation: 'AmericasOilWatch — americasoilwatch.com',
      resources: RESOURCES.map(r => ({ ...r, url: `${BASE}/${r.name}` })),
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
