import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const revalidate = 3600;

export const alt = 'AmericasOilWatch — Western Hemisphere Oil & Fuel Intelligence';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function loadJson<T>(filename: string): T | null {
  const p = path.join(process.cwd(), 'data', filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as T; } catch { return null; }
}

export default async function OgHome() {
  const wti      = loadJson<any>('wti.json');
  const brent    = loadJson<any>('brent.json');
  const stocks   = loadJson<any>('us-stocks.json');
  const prices   = loadJson<any>('us-prices.json');

  const wtiUsd   = wti?.priceUsd ?? 0;
  const brentUsd = brent?.priceUsd ?? 0;
  const sprMb    = stocks?.sprMb ? stocks.sprMb / 1000 : null;
  const gasGal   = prices?.gasolineUsdGal ?? null;
  const week     = stocks?.weekEnding ?? prices?.weekEnding;

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
          </div>
          <div style={{ fontSize: 14, fontFamily: 'monospace', color: '#64748b', letterSpacing: 1.5 }}>
            americasoilwatch.com
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 60 }}>
          <div style={{ display: 'flex', fontSize: 22, color: '#94a3b8', marginBottom: 24 }}>
            <span>Western Hemisphere benchmarks{week ? ` · week ending ${week}` : ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 50 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' }}>WTI Cushing</span>
              <span style={{ fontSize: 110, fontWeight: 800, color: '#fbbf24', lineHeight: 1, fontFamily: 'monospace', marginTop: 4 }}>
                ${wtiUsd.toFixed(2)}
              </span>
              <span style={{ fontSize: 16, color: '#94a3b8', marginTop: 4 }}>per barrel</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' }}>Brent</span>
              <span style={{ fontSize: 110, fontWeight: 800, color: '#60a5fa', lineHeight: 1, fontFamily: 'monospace', marginTop: 4 }}>
                ${brentUsd.toFixed(2)}
              </span>
              <span style={{ fontSize: 16, color: '#94a3b8', marginTop: 4 }}>per barrel</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {gasGal != null && (
              <span style={{ fontSize: 18, color: '#cbd5e1' }}>
                US gasoline: <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>${gasGal.toFixed(3)}/gal</span>
              </span>
            )}
            {sprMb != null && (
              <span style={{ fontSize: 18, color: '#cbd5e1', marginTop: 4 }}>
                SPR: <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>{sprMb.toFixed(1)}m bbl</span>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 13, color: '#64748b', fontFamily: 'monospace', letterSpacing: 1 }}>
              Source: U.S. EIA + Stooq
            </span>
            <span style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace', letterSpacing: 1, marginTop: 4 }}>
              americasoilwatch.com/api
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
