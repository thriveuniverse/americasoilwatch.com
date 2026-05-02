import type { Metadata } from 'next';
import HormuzReportDownloadForm from '@/components/HormuzReportDownloadForm';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'From Hormuz to Hunger — The Compound Cascade That Institutional Models Miss | AmericasOilWatch',
  description:
    'Independent systems risk analysis of the global fertilizer disruption following the Strait of Hormuz blockade. Probability-weighted central estimate: 118–225M excess deaths across nine interacting causal chains.',
  alternates: { canonical: 'https://americasoilwatch.com/reports/from-hormuz-to-hunger' },
  openGraph: {
    title: 'From Hormuz to Hunger — The Compound Cascade That Institutional Models Miss',
    description:
      'Independent systems risk analysis of the global fertilizer disruption following the Strait of Hormuz blockade.',
    url: 'https://americasoilwatch.com/reports/from-hormuz-to-hunger',
    siteName: 'AmericasOilWatch',
    type: 'article',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'From Hormuz to Hunger' }],
  },
};

export default function HormuzReportPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>

        <p className="mt-6 text-[10px] font-mono font-semibold tracking-widest text-red-400 uppercase">
          Independent Systems Risk Analysis
        </p>

        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white leading-tight">
          America Struck Iran. The Famine Starts in 2027. Here&apos;s the Model Nobody Built.
        </h1>

        <p className="mt-4 text-sm text-gray-400">
          <strong className="text-gray-300">From Hormuz to Hunger</strong> — Policy Brief v3.0 ·
          By <strong className="text-gray-300">Jonathan Kelly</strong> · Published 30 April 2026
        </p>
      </header>

      {/* Distribution note */}
      <aside className="rounded-lg border border-oil-800 bg-oil-900/40 px-5 py-4 text-xs text-gray-400 leading-relaxed">
        <p className="font-mono uppercase tracking-widest text-[10px] text-gray-500 mb-2">Distribution note</p>
        <p>
          This report is an independent technical analysis intended to inform public understanding. It presents
          scenario-based risk estimates derived from stated assumptions and cited sources; it is not a forecast,
          and figures are ranges subject to uncertainty. Readers are encouraged to reference the assumptions,
          confidence levels, and sensitivity analysis when citing conclusions.
        </p>
      </aside>

      {/* Body */}
      <article className="space-y-6 text-[15px] text-gray-300 leading-relaxed">
        <p>
          On February 28, 2026, the United States and Israel struck Iranian nuclear and military infrastructure.
          Iran closed the Strait of Hormuz. Within 72 hours, daily vessel transits collapsed from 141 to 4 —
          a 97% reduction in commercial shipping through the chokepoint that carries 35% of the world&apos;s
          seaborne oil trade.
        </p>
        <p>
          Two months later, the American debate is still about oil prices and gas station receipts. That debate
          is missing the crisis.
        </p>

        <h2 className="mt-10 text-xl font-bold text-white">The Fertilizer Story America Isn&apos;t Hearing</h2>
        <p>
          The Strait of Hormuz carries approximately <strong className="text-white">30% of internationally traded fertilizer</strong>,
          including 67% of Gulf urea exports (UNCTAD, April 2026). US urea prices have surged 52% since the
          strikes. Brazilian urea — critical to the agricultural powerhouse that helps feed the world — is up
          60%. Global nitrogen fertilizer production is down approximately 20%, with prices up 70% across the
          board (World Bank Commodity Markets Outlook, April 2026).
        </p>
        <p>
          No strategic fertilizer reserves exist anywhere in the world. The FAO confirmed this in March 2026.
          The IEA released 400 million barrels from strategic petroleum reserves — the largest coordinated
          release in history — and oil is still elevated. There is no equivalent mechanism for fertilizer. None.
        </p>
        <p>
          America is the world&apos;s largest agricultural exporter. American farmers have access to domestic
          fertilizer production and can absorb price increases. The US will not starve. But the countries that
          depend on American grain exports, and the countries that depend on Gulf fertilizer to grow their own
          food, face a catastrophe that US military action initiated and US policy has not yet addressed.
        </p>

        <h2 className="mt-10 text-xl font-bold text-white">What Happens When 30% of Global Fertilizer Disappears</h2>
        <p>
          The relationship between fertilizer and food is non-linear. Agricultural science consistently shows
          that a 10% reduction in nitrogen fertilizer produces approximately 25% yield loss — not 10%. The curve
          is steeper for the world&apos;s poorest farmers: subsistence millet and sorghum in the Sahel, where
          baseline fertilizer application is already minimal, face 30–50% yield loss from a 10% input reduction.
          Well-fertilized American corn faces 15–20%.
        </p>
        <p>The populations who can least afford to lose food are losing the most.</p>
        <p>
          But yield collapse is only the first link in the chain. I have built an independent systems model —
          using the same FAO, WFP, UNCTAD, and World Bank data that institutional analysts use — that tracks
          nine interacting causal chains through which a fertilizer disruption compounds into mass starvation:
        </p>

        <ul className="space-y-2 text-sm">
          <li><strong className="text-white">Chain 1:</strong> Fertilizer shortage → non-linear yield collapse across South Asia, Sub-Saharan Africa, MENA</li>
          <li><strong className="text-white">Chain 2:</strong> Supply chain lock-in → 8–14 months before fertilizer flows normalize even after Hormuz reopens</li>
          <li><strong className="text-white">Chain 3:</strong> Sovereign debt doom loops → food-importing nations can&apos;t afford grain at crisis prices</li>
          <li><strong className="text-white">Chain 4:</strong> Fertilizer export cascade → producing countries restrict exports (Russia and China did this in 2021–22)</li>
          <li><strong className="text-white">Chain 5:</strong> El Niño convergence → 40–55% probability of compounding drought</li>
          <li><strong className="text-white">Chain 6:</strong> Autarkic market fragmentation → export bans destroy the global food market&apos;s ability to function</li>
          <li><strong className="text-white">Chain 7:</strong> Humanitarian access denial → 60–120 million people in conflict zones unreachable by aid</li>
          <li><strong className="text-white">Chain 8:</strong> Logistics ceiling → WFP can assist ~110 million; the crisis population exceeds 300 million</li>
          <li><strong className="text-white">Chain 9:</strong> Disease multiplication → famine-associated disease historically kills 2–3x more than direct starvation</li>
        </ul>

        <p>
          No US agency, no international institution, and no UN body currently models the compound interaction
          between these nine chains. They assess them separately and add the results. The historical record —
          Bengal 1943, China 1959–62, Ethiopia 1983–85, North Korea 1994–98, Somalia 2011 — shows that compound
          interactions produce mortality 3–10x above additive projections. Every time.
        </p>

        <h2 className="mt-10 text-xl font-bold text-white">The Numbers</h2>
        <p>
          The probability-weighted central estimate is <strong className="text-white">118–225 million excess starvation deaths
          over 2026–2030</strong>.
        </p>
        <p>
          Before dismissing that number: it is an expected-value calculation across five scenarios weighted by
          assessed probability. The single most likely outcome (base case, 30–40% probability) is 95–200 million.
          The best case — Hormuz reopens by August, no El Niño, unprecedented G20 coordination — still produces
          32–55 million from damage already done. The calculated floor from disruption already incurred is
          20–35 million excess deaths — planting cycles missed, supply chains broken, acute malnutrition already
          escalating in the world&apos;s most vulnerable populations.
        </p>
        <p>
          These numbers are dramatically higher than institutional projections. That gap is the central finding
          of the analysis. It is not a disagreement over data — the model uses the same sources. It is a
          disagreement over model structure: institutional frameworks are linear and additive; reality is
          interactive and multiplicative. The same structural blind spot has produced systematic underestimates
          in every major famine in the historical record.
        </p>
        <p>
          The full methodology, regional mortality conversion tables, crop-specific fertilizer sensitivity
          analysis, and historical calibration against nine famines are in the reports below. The model is
          transparent and falsifiable. Every assumption is stated. Every source is cited.
        </p>

        <h2 className="mt-10 text-xl font-bold text-white">What America Can Do</h2>
        <p>
          The United States initiated the military action that triggered this crisis. That creates both an
          obligation and a unique form of leverage.
        </p>

        <div className="space-y-4">
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
            <p className="text-sm font-semibold text-white">1. Achieve Hormuz reopening.</p>
            <p className="mt-2 text-sm text-gray-400">
              The US has more influence over the resolution of the Hormuz blockade than any other actor.
              Reopening before August 2026 reduces the central estimate by 40–60% (50–130 million lives). After
              August, damage transitions from one-crop-cycle disruption to self-sustaining multi-cycle
              compounding. The window is approximately 90 days.
            </p>
          </div>
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
            <p className="text-sm font-semibold text-white">2. Prevent autarkic fragmentation.</p>
            <p className="mt-2 text-sm text-gray-400">
              India&apos;s decision to ban or maintain rice exports is the largest political binary variable in the
              model after Hormuz duration. US diplomatic engagement with New Delhi — offering guaranteed
              fertilizer access or financial support in exchange for open markets — is estimated to save 15–25
              million lives.
            </p>
          </div>
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
            <p className="text-sm font-semibold text-white">3. Lead the creation of a G20 Emergency Fertilizer Facility.</p>
            <p className="mt-2 text-sm text-gray-400">
              America built the IEA after 1973. There is no equivalent coordination mechanism for fertilizer.
              Building one now — to pool non-Hormuz supply, prevent export bans, and allocate by agricultural
              need — could prevent the autarkic tipping point. Estimated impact: 10–25 million lives.
            </p>
          </div>
          <div className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
            <p className="text-sm font-semibold text-white">4. Fully fund humanitarian response.</p>
            <p className="mt-2 text-sm text-gray-400">
              WFP&apos;s $13 billion 2026 requirement is approximately $650–$1,300 per life saved. The United States
              is historically the largest single humanitarian donor. Full funding of WFP operations is the most
              cost-effective life-saving intervention available.
            </p>
          </div>
        </div>

        <h2 className="mt-10 text-xl font-bold text-white">The August Deadline</h2>
        <p>
          This is not an open-ended warning. The model identifies a specific non-linear threshold at
          approximately 5–6 months of blockade duration (August 2026). Before that threshold, the crisis damages
          one crop cycle — severe, but the system can recover. After that threshold, consecutive crop cycles are
          affected, soil depletion begins, seed stocks are consumed, agricultural labour forces weaken, and the
          damage becomes self-sustaining. The difference between acting in May and acting in September is
          measured in tens of millions of lives.
        </p>
      </article>

      {/* Email-gated download form */}
      <HormuzReportDownloadForm siteName="AmericasOilWatch" />

      {/* Update commitment */}
      <p className="text-xs text-gray-500 italic">
        This analysis will be updated as new data becomes available. Key watch points: NOAA May 2026 El Niño
        update, Hormuz shipping data, India export policy signals, Q3 2026 harvest reports, WFP funding status.
      </p>

      {/* Footer */}
      <footer className="border-t border-oil-800/40 pt-6 mt-8 space-y-3 text-xs text-gray-500">
        <p>
          <strong className="text-gray-400">Contact:</strong>{' '}
          <a href="mailto:jon@thethriveclan.com" className="text-oil-400 hover:underline">jon@thethriveclan.com</a>
        </p>
        <p>
          <strong className="text-gray-400">Also published on:</strong>{' '}
          <a href="https://eurooilwatch.com/reports/from-hormuz-to-hunger" className="text-oil-400 hover:underline">eurooilwatch.com</a>
          {' · '}
          <a href="https://ukoilwatch.com/reports/from-hormuz-to-hunger" className="text-oil-400 hover:underline">ukoilwatch.com</a>
        </p>
        <p>
          <strong className="text-gray-400">Sources:</strong> FAO, WFP, UNCTAD, World Bank CMO April 2026, GRFC 2026,
          Fertilizers Europe, USDA Foreign Agricultural Service, UNU, NOAA, nine historical famine case studies.
          Full reference list in the Technical Report.
        </p>
      </footer>
    </div>
  );
}
