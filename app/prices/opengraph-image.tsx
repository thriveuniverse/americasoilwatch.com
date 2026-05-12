import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const revalidate = 3600;

export const alt = 'AmericasOilWatch — US retail fuel prices + WTI Cushing';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function loadJson<T>(filename: string): T | null {
  const p = path.join(process.cwd(), 'data', filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as T; } catch { return null; }
}

export default async function OgPrices() {
  const prices = loadJson<any>('us-prices.json');
  const wti    = loadJson<any>('wti.json');
  const brent  = loadJson<any>('brent.json');

  const gas    = prices?.gasolineUsdGal ?? 0;
  const diesel = prices?.dieselUsdGal ?? 0;
  const gasCh  = prices?.gasolineChangeUsdGal;
  const dCh    = prices?.dieselChangeUsdGal;
  const week   = prices?.weekEnding;

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg, #0a1929 0%, #0f1e35 50%, #1a2942 100%)',
        padding: '60px 70px', color: '#e2e8f0', fontFamily: 'sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 12, height: 12, borderRadius: 12, background: '#f59e0b', boxShadow: '0 0 18px #f59e0b' }} />
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>AmericasOilWatch</span>
            <span style={{
              marginLeft: 10, fontSize: 13, fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase',
              color: '#fbbf24', padding: '4px 10px',
              border: '1px solid rgba(217, 119, 6, 0.6)', borderRadius: 6, background: 'rgba(120, 53, 15, 0.25)',
            }}>
              Retail prices
            </span>
          </div>
          <div style={{ fontSize: 14, fontFamily: 'monospace', color: '#64748b', letterSpacing: 1.5 }}>
            americasoilwatch.com/prices
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 60 }}>
          <div style={{ display: 'flex', fontSize: 22, color: '#94a3b8', marginBottom: 24 }}>
            <span>US national average{week ? ` · week ending ${week}` : ''}</span>
          </div>
          <div style={{ display: 'flex', gap: 70 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 16, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' }}>Gasoline</span>
              <span style={{ fontSize: 130, fontWeight: 800, color: '#fbbf24', lineHeight: 1, fontFamily: 'monospace', marginTop: 4 }}>
                ${gas.toFixed(3)}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
                <span style={{ fontSize: 22, color: '#94a3b8' }}>/gallon</span>
                {typeof gasCh === 'number' && (
                  <span style={{ fontSize: 18, color: gasCh >= 0 ? '#ef4444' : '#10b981', fontFamily: 'monospace' }}>
                    {gasCh >= 0 ? '+' : '-'}${Math.abs(gasCh).toFixed(3)} WoW
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 16, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' }}>Diesel</span>
              <span style={{ fontSize: 130, fontWeight: 800, color: '#60a5fa', lineHeight: 1, fontFamily: 'monospace', marginTop: 4 }}>
                ${diesel.toFixed(3)}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
                <span style={{ fontSize: 22, color: '#94a3b8' }}>/gallon</span>
                {typeof dCh === 'number' && (
                  <span style={{ fontSize: 18, color: dCh >= 0 ? '#ef4444' : '#10b981', fontFamily: 'monospace' }}>
                    {dCh >= 0 ? '+' : '-'}${Math.abs(dCh).toFixed(3)} WoW
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {wti && (
              <span style={{ fontSize: 18, color: '#cbd5e1' }}>
                WTI: <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>${wti.priceUsd}/bbl</span>
              </span>
            )}
            {brent && (
              <span style={{ fontSize: 18, color: '#cbd5e1', marginTop: 4 }}>
                Brent: <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>${brent.priceUsd}/bbl</span>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 13, color: '#64748b', fontFamily: 'monospace', letterSpacing: 1 }}>
              Source: U.S. EIA
            </span>
            <span style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace', letterSpacing: 1, marginTop: 4 }}>
              americasoilwatch.com/api/v1/us-prices
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
