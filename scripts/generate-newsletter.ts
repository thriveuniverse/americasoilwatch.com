#!/usr/bin/env npx tsx
/**
 * AmericasOilWatch — Weekly Briefing Draft Generator
 * ====================================================
 * Reads current data files and calls Claude to draft a weekly briefing.
 * Output goes to newsletters/outbox/ for review before pushing.
 *
 * IMPORTANT: Review before pushing — pushing to outbox/ triggers the send.
 *
 * Usage: ANTHROPIC_API_KEY=sk-ant-xxx npm run draft:newsletter
 */

import fs   from 'fs';
import path from 'path';

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile();

const DATA_DIR = path.join(process.cwd(), 'data');
const OUTBOX   = path.join(process.cwd(), 'newsletters', 'outbox');

function loadJSON<T>(filename: string): T | null {
  const p = path.join(DATA_DIR, filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'n/a';
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
}

function fmtDelta(v: number | null | undefined, unit = ''): string {
  if (v === null || v === undefined) return 'n/a';
  return (v >= 0 ? '+' : '') + v.toFixed(2) + unit;
}

async function main() {
  console.log('📰 AmericasOilWatch — Drafting Weekly Newsletter');
  console.log('='.repeat(50));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('❌ ANTHROPIC_API_KEY not set'); process.exit(1); }

  const wti      = loadJSON<any>('wti.json');
  const brent    = loadJSON<any>('brent.json');
  const usStocks = loadJSON<any>('us-stocks.json');
  const usPrices = loadJSON<any>('us-prices.json');
  const analysis = loadJSON<any>('analysis.json');
  const marad    = loadJSON<any>('marad-advisories.json');
  const crea     = loadJSON<any>('crea-feed.json');
  const news     = loadJSON<any>('news-feed.json');

  const today      = new Date().toISOString().slice(0, 10);
  const spread     = (wti && brent) ? (wti.priceUsd - brent.priceUsd).toFixed(2) : null;

  // ─── Build strictly factual data context ───────────────────────────────────
  let ctx = `# Data snapshot — ${today}\n\n`;

  ctx += `## Prices (only these weekly figures are available)\n`;
  if (wti)      ctx += `- WTI: $${wti.priceUsd}/bbl, week ending ${wti.weekEnding}, change ${fmtPct(wti.changePct)}\n`;
  if (brent)    ctx += `- Brent: $${brent.priceUsd}/bbl, change ${fmtPct(brent.changePct)}\n`;
  if (spread)   ctx += `- WTI-Brent spread: $${spread}/bbl\n`;
  if (usPrices) ctx += `- US gasoline (retail, national avg): $${usPrices.gasolineUsdGal}/US gallon, w/w change ${fmtDelta(usPrices.gasolineChangeUsdGal, '$/gal')}\n`;
  if (usPrices) ctx += `- US diesel (retail, national avg): $${usPrices.dieselUsdGal}/US gallon, w/w change ${fmtDelta(usPrices.dieselChangeUsdGal, '$/gal')}\n`;

  if (usStocks) {
    ctx += `\n## US petroleum stocks (EIA, week ending ${usStocks.weekEnding}, thousand barrels)\n`;
    ctx += `- Commercial crude: ${usStocks.crudeMb} kb (w/w ${fmtDelta(usStocks.crudeMbChange, ' kb')})\n`;
    ctx += `- Gasoline: ${usStocks.gasolineMb} kb (w/w ${fmtDelta(usStocks.gasolineMbChange, ' kb')})\n`;
    ctx += `- Distillates: ${usStocks.distillateMb} kb (w/w ${fmtDelta(usStocks.distillateMbChange, ' kb')})\n`;
    ctx += `- SPR: ${usStocks.sprMb} kb (no weekly change data)\n`;
    ctx += `- US production: ${usStocks.productionKbpd} kb/d\n`;
  }

  if (marad?.advisories?.length) {
    ctx += `\n## Active MARAD maritime advisories (${marad.advisories.length} total)\n`;
    marad.advisories.forEach((a: any) =>
      ctx += `- [${a.severity.toUpperCase()}] ${a.id} — ${a.region}: ${a.incident}\n`
    );
  } else {
    ctx += `\n## MARAD advisories\nNo advisories in current data.\n`;
  }

  if (crea?.articles?.length) {
    ctx += `\n## Recent CREA research (${crea.articles.length} items)\n`;
    crea.articles.slice(0, 10).forEach((a: any) =>
      ctx += `- [${a.tag}] ${a.title} (${new Date(a.date).toISOString().slice(0,10)})\n`
    );
  }

  if (news?.articles?.length) {
    ctx += `\n## Recent industry headlines (${news.articles.length} total; showing latest 15)\n`;
    news.articles.slice(0, 15).forEach((a: any) =>
      ctx += `- [${a.category}] ${a.title} — ${a.source}, ${new Date(a.date).toISOString().slice(0,10)}\n`
    );
  }

  if (analysis?.statusLine) ctx += `\n## Dashboard status line\n${analysis.statusLine}\n`;

  ctx += `\n## What is NOT available in this data snapshot
- Country-level weekly production changes for Canada, Mexico, Brazil, Venezuela, Guyana, Argentina, etc. (PRODUCERS table is editorial, updated monthly not weekly)
- Month-over-month price comparisons (only week-over-week is tracked)
- Refinery utilisation percentages
- Pipeline flow data (Keystone, TMX, etc.)
- Rig counts
- Company-specific output figures (Chevron, Exxon, Petrobras volumes, etc.)
- OPEC+ compliance or quota data
- LNG shipment volumes
- Forward-looking political events (sanctions responses, NATO actions, etc.)
Do NOT invent figures or events for these topics. If a section has no supporting data, OMIT that section.
`;

  // ─── Strict system prompt ───────────────────────────────────────────────────
  const systemPrompt = `You draft the weekly AmericasOilWatch briefing for energy professionals — traders, logistics operators, procurement teams, journalists. They will sanity-check every figure.

HARD RULES (violating any of these destroys reader trust):
1. Every number, percentage, direction (up/down/rose/fell), and named event MUST come directly from the data snapshot the user provides. If it's not there, you cannot say it.
2. Do NOT invent weekly producer changes, refinery utilisation, company-specific output, rig counts, month-over-month comparisons, or political developments.
3. Do NOT speculate about what governments/companies will do next week. You may say "watch X" only if X is already an active data point (e.g. an existing MARAD advisory, a pending EIA release date).
4. If a topic has no supporting data, OMIT the section entirely. A shorter, accurate briefing is infinitely better than a padded one with fabrications.
5. When data is thin, acknowledge it explicitly: "No producer-level changes in this week's data" is acceptable and preferable to invention.
6. You may reference headline titles from the news/CREA lists but you must attribute them ("per OilPrice.com") and NOT extend them with details the headline doesn't state.

STYLE:
- Direct prose. No waffle, no marketing language.
- Structure:
  1. One-paragraph lede covering the single most important data movement this week.
  2. 2–4 short sections — only include those where the data supports substantive commentary.
     Typical candidates: Crude prices, US stocks/production, Retail fuel, Maritime risk, Industry headlines.
  3. One closing sentence: "Watch next week:" — ONLY a concrete upcoming data release or an already-active advisory, never speculation.
- Markdown formatting. 300–550 words. Shorter is better if data is thin.
- Write as the analyst. No meta-commentary ("Here is your briefing").`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Draft the weekly briefing using ONLY this data:\n\n${ctx}` }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const result = await res.json();
  const draft  = result.content?.[0]?.text ?? '';

  const subject  = `Americas Oil & Energy — Weekly Briefing ${today}`;
  const filename = `${today}-weekly-briefing.md`;
  const content  = `---\nsubject: ${subject}\n---\n\n${draft}\n`;

  fs.mkdirSync(OUTBOX, { recursive: true });
  fs.writeFileSync(path.join(OUTBOX, filename), content);
  console.log(`\n✅ Draft written to newsletters/outbox/${filename}`);
  console.log('   Review before sending.');
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
