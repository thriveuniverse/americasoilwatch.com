import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
export const metadata: Metadata = { title: 'Methodology | AmericasOilWatch' };
export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <JsonLd type="methodology" />
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">Methodology</h1>
      </div>
      <div className="prose-article space-y-6 text-sm text-gray-400">
        <section>
          <h2 className="text-white">Data Sources &amp; Update Cadence</h2>
          <div className="overflow-x-auto my-3">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-oil-800">
                  <th className="text-left py-2 px-2 font-mono text-[10px] uppercase tracking-wider text-gray-500">Dataset</th>
                  <th className="text-left py-2 px-2 font-mono text-[10px] uppercase tracking-wider text-gray-500">Source</th>
                  <th className="text-left py-2 px-2 font-mono text-[10px] uppercase tracking-wider text-gray-500">Cadence</th>
                  <th className="text-left py-2 px-2 font-mono text-[10px] uppercase tracking-wider text-gray-500">Lag</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-oil-800/40">
                  <td className="py-2 px-2">WTI Crude spot</td>
                  <td className="py-2 px-2 text-gray-500">EIA API v2 (series RWTC)</td>
                  <td className="py-2 px-2">Weekly</td>
                  <td className="py-2 px-2 text-gray-500">1–3 days</td>
                </tr>
                <tr className="border-b border-oil-800/40">
                  <td className="py-2 px-2">Brent Crude spot</td>
                  <td className="py-2 px-2 text-gray-500">ICE Brent front-month</td>
                  <td className="py-2 px-2">Daily</td>
                  <td className="py-2 px-2 text-gray-500">Same day</td>
                </tr>
                <tr className="border-b border-oil-800/40">
                  <td className="py-2 px-2">US petroleum stocks</td>
                  <td className="py-2 px-2 text-gray-500">EIA Weekly Petroleum Status Report</td>
                  <td className="py-2 px-2">Weekly (Wed)</td>
                  <td className="py-2 px-2 text-gray-500">5–7 days</td>
                </tr>
                <tr className="border-b border-oil-800/40">
                  <td className="py-2 px-2">US retail gasoline / diesel</td>
                  <td className="py-2 px-2 text-gray-500">EIA weekly retail survey</td>
                  <td className="py-2 px-2">Weekly (Mon)</td>
                  <td className="py-2 px-2 text-gray-500">Same day</td>
                </tr>
                <tr className="border-b border-oil-800/40">
                  <td className="py-2 px-2">Maritime advisories</td>
                  <td className="py-2 px-2 text-gray-500">US MARAD</td>
                  <td className="py-2 px-2">On-publish</td>
                  <td className="py-2 px-2 text-gray-500">Hours</td>
                </tr>
                <tr className="border-b border-oil-800/40">
                  <td className="py-2 px-2">Energy research</td>
                  <td className="py-2 px-2 text-gray-500">CREA RSS</td>
                  <td className="py-2 px-2">On-publish</td>
                  <td className="py-2 px-2 text-gray-500">Hours</td>
                </tr>
                <tr className="border-b border-oil-800/40">
                  <td className="py-2 px-2">News aggregation</td>
                  <td className="py-2 px-2 text-gray-500">OilPrice.com, Rigzone, Offshore Technology</td>
                  <td className="py-2 px-2">Daily</td>
                  <td className="py-2 px-2 text-gray-500">Hours</td>
                </tr>
                <tr className="border-b border-oil-800/40">
                  <td className="py-2 px-2">Producer snapshots</td>
                  <td className="py-2 px-2 text-gray-500">IEA MOMR, OPEC MOMR, national regulators</td>
                  <td className="py-2 px-2">Editorial</td>
                  <td className="py-2 px-2 text-gray-500">Weeks</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            All automated pipelines run daily at approximately 05:00 UTC. Manual editorial updates
            (producer snapshots, chokepoint risk ratings) are reviewed weekly.
          </p>
        </section>

        <section>
          <h2 className="text-white">Days-of-Supply Calculation</h2>
          <p>
            Days-of-supply figures shown on the dashboard are computed as stock ÷ typical US demand:
          </p>
          <ul>
            <li><strong>Commercial Crude:</strong> vs ~16 million bpd refinery input</li>
            <li><strong>Gasoline:</strong> vs ~9 million bpd product demand</li>
            <li><strong>Distillates:</strong> vs ~4 million bpd product demand</li>
            <li><strong>SPR:</strong> vs ~6 million bpd net crude imports (traditional IEA import-cover metric)</li>
          </ul>
          <p>
            Demand benchmarks are held constant for readability; in reality they fluctuate seasonally (±10–15%).
            The figures are best read as relative benchmarks rather than operational forecasts.
          </p>
        </section>
        <section>
          <h2 className="text-white">Update Frequency</h2>
          <p>EIA data is updated weekly — crude stocks on Wednesdays, retail prices on Mondays. The pipeline runs daily at 05:00 UTC to pick up the latest available data. AI analysis is regenerated on each successful data fetch.</p>
        </section>
        <section>
          <h2 className="text-white">Producer Data</h2>
          <p>Production figures for non-US countries (Canada, Brazil, Guyana, etc.) are editorial estimates based on IEA Monthly Oil Market Report, OPEC MOMR, and national regulator releases. These are updated less frequently than US EIA data and should be treated as approximate figures.</p>
        </section>
        <section>
          <h2 className="text-white">AI Analysis</h2>
          <p>Analysis is generated by Claude (Anthropic) using the latest fetched data. It is not financial advice. The model is instructed to cite specific numbers and avoid speculation beyond the data. Analysis is regenerated daily when new data is available.</p>
        </section>
        <section>
          <h2 className="text-white">Chokepoint Risk Ratings</h2>
          <p>Risk ratings are editorial assessments updated manually based on news sources, MARAD advisories, and geopolitical developments. They do not update automatically. Normal / Elevated / High / Critical follows the same framework as EuroOilWatch and UKOilWatch.</p>
        </section>
      </div>
    </div>
  );
}
