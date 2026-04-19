import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'About | AmericasOilWatch' };
export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">About AmericasOilWatch</h1>
      </div>
      <div className="prose-article space-y-4 text-sm text-gray-400">
        <p>AmericasOilWatch is an independent fuel security intelligence dashboard covering the Western Hemisphere — from the Canadian oil sands to the tip of Patagonia.</p>
        <p>We track WTI crude prices, US petroleum stocks, producer snapshots across 12 Americas countries, and maritime supply route risk. Data comes from the EIA, MARAD, CREA, and editorial research.</p>
        <p>This site is part of the OilWatch family alongside <a href="https://eurooilwatch.com" className="text-oil-400 hover:underline">EuroOilWatch</a> and <a href="https://ukoilwatch.com" className="text-oil-400 hover:underline">UKOilWatch</a>.</p>
        <p>Nothing on this site constitutes financial advice. We are not affiliated with any government, oil company, or financial institution.</p>
        <p>Contact: <a href="mailto:hello@americasoilwatch.com" className="text-oil-400 hover:underline">hello@americasoilwatch.com</a></p>
      </div>
    </div>
  );
}
