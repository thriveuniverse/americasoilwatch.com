import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import JsonLd from '@/components/JsonLd';
import BrentHistoricalContext from '@/components/BrentHistoricalContext';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Fuel Prices | AmericasOilWatch',
  alternates: { canonical: 'https://americasoilwatch.com/prices' },
};

export default function PricesPage() {
  const wtiPath = path.join(process.cwd(), 'data', 'wti.json');
  const pricePath = path.join(process.cwd(), 'data', 'us-prices.json');
  const wti = fs.existsSync(wtiPath) ? JSON.parse(fs.readFileSync(wtiPath, 'utf-8')) : null;
  const prices = fs.existsSync(pricePath) ? JSON.parse(fs.readFileSync(pricePath, 'utf-8')) : null;

  function loadJson<T>(filename: string): T | null {
    const p = path.join(process.cwd(), 'data', filename);
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
  }
  const eiaBrent = loadJson<{
    entries: { date: string; priceUsd: number }[];
    allTimeHigh: { date: string; priceUsd: number };
    allTimeLow:  { date: string; priceUsd: number };
  }>('brent-eia-daily.json');
  const liveBrent = loadJson<{ priceUsd: number }>('brent.json');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <JsonLd type="prices" />
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">Americas Fuel Prices</h1>
        <p className="mt-2 text-sm text-gray-400">
          WTI benchmark, US retail fuel prices, and broader Americas price context. Data from EIA (weekly).
        </p>
      </div>

      {/* Benchmark prices */}
      <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
        <div className="px-5 py-3 border-b border-oil-800/60">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">Crude Benchmarks</h2>
        </div>
        <div className="divide-y divide-oil-800/40">
          {wti && (
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">WTI Crude (Cushing, Oklahoma)</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Primary Americas benchmark · Week ending {wti.weekEnding}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-mono font-bold text-white">${wti.priceUsd}</p>
                <p className={`text-xs font-mono ${wti.changePct >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {wti.changePct >= 0 ? '▲' : '▼'} {Math.abs(wti.changePct)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* US retail prices */}
      {prices && (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-oil-800/60 flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase">US Retail Fuel Prices</h2>
            <span className="text-[10px] text-gray-600">Week ending {prices.weekEnding}</span>
          </div>
          <div className="divide-y divide-oil-800/40">
            {[
              { label: 'Regular Gasoline', value: prices.gasolineUsdGal, change: prices.gasolineChangeUsdGal },
              { label: 'Diesel', value: prices.dieselUsdGal, change: prices.dieselChangeUsdGal },
            ].map(f => (
              <div key={f.label} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-200">{f.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">US national average · per US gallon</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-mono font-bold text-white">${f.value?.toFixed(3)}</p>
                  {f.change !== null && (
                    <p className={`text-xs font-mono ${(f.change ?? 0) >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {(f.change ?? 0) >= 0 ? '▲' : '▼'} ${Math.abs(f.change ?? 0).toFixed(3)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-2.5 border-t border-oil-800/40 bg-oil-900/20">
            <p className="text-[10px] text-gray-600">
              Source: <a href="https://www.eia.gov/petroleum/gasdiesel/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">EIA Weekly Retail Gasoline and Diesel Prices</a>.
            </p>
          </div>
        </div>
      )}

      {/* Price context note */}
      <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-4">
        <h3 className="text-xs font-mono font-semibold text-gray-500 uppercase tracking-widest mb-2">Americas Price Context</h3>
        <div className="space-y-2 text-xs text-gray-400">
          <p><span className="text-gray-300 font-medium">USA:</span> EIA weekly retail prices — most transparent market in the hemisphere. Federal + state taxes add ~$0.57/gal average.</p>
          <p><span className="text-gray-300 font-medium">Canada:</span> Provincial variation significant. NRCan publishes weekly pump prices. WCS (Alberta) trades at discount to WTI.</p>
          <p><span className="text-gray-300 font-medium">Mexico:</span> PEMEX sets prices via IEPS tax mechanism. Subsidised fuel below market during high-price periods.</p>
          <p><span className="text-gray-300 font-medium">Brazil:</span> Petrobras adjusts fuel prices to international parity. Diesel subsidised historically — current policy market-linked.</p>
          <p><span className="text-gray-300 font-medium">Venezuela:</span> Heavily subsidised, among cheapest globally (effectively &lt;$0.01/litre) but severe scarcity and dollar black market.</p>
          <p><span className="text-gray-300 font-medium">Argentina:</span> Price controls and FX restrictions complicate pump price data. Significant gap between official and parallel exchange rates.</p>
        </div>
      </div>

      {eiaBrent && eiaBrent.entries?.length > 0 && (
        <BrentHistoricalContext
          entries={eiaBrent.entries}
          allTimeHigh={eiaBrent.allTimeHigh}
          allTimeLow={eiaBrent.allTimeLow}
          livePriceUsd={liveBrent?.priceUsd}
        />
      )}
    </div>
  );
}
