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

  let dataContext = `# Current Data — AmericasOilWatch\n\n`;
  if (wti)      dataContext += `**WTI:** $${wti.priceUsd}/bbl (${wti.changePct >= 0 ? '+' : ''}${wti.changePct}%)\n`;
  if (brent)    dataContext += `**Brent:** $${brent.priceUsd}/bbl\n`;
  if (usStocks) dataContext += `**US Crude Stocks:** ${usStocks.crudeMb} MB (${usStocks.crudeMbChange >= 0 ? '+' : ''}${usStocks.crudeMbChange} MB)\n`;
  if (usStocks) dataContext += `**US Production:** ${usStocks.productionKbpd} kb/d\n`;
  if (usPrices) dataContext += `**US Gasoline:** $${usPrices.gasolineUsdGal}/gal\n`;
  if (analysis) dataContext += `\n**AI Analysis Summary:** ${analysis.statusLine}\n`;
  if (marad?.advisories?.length) {
    dataContext += `\n**Active MARAD Advisories:**\n`;
    marad.advisories.slice(0, 5).forEach((a: any) =>
      dataContext += `- [${a.severity.toUpperCase()}] ${a.region}: ${a.incident}\n`
    );
  }
  if (crea?.articles?.length) {
    dataContext += `\n**Recent CREA Research:**\n`;
    crea.articles.slice(0, 3).forEach((a: any) =>
      dataContext += `- [${a.tag}] ${a.title}\n`
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You draft weekly energy briefings for AmericasOilWatch subscribers. The audience is energy professionals, logistics operators, and informed citizens tracking Western Hemisphere oil markets.

Write in clear, direct prose. No waffle. Structure:
1. One-paragraph lede: what matters most this week
2. 3-4 short sections covering: crude price context, US stocks/production, key producer developments, supply route risks
3. One closing sentence on what to watch next week

Use markdown formatting. Keep total length to 400-600 words. Write as if you are the analyst — no meta-commentary about the format.`,
      messages: [{ role: 'user', content: `Draft the weekly briefing using this data:\n\n${dataContext}\n\nDate: ${today}` }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API ${res.status}`);
  const result = await res.json();
  const draft  = result.content?.[0]?.text ?? '';

  const subject = `Americas Oil & Energy — Weekly Briefing ${today}`;
  const filename = `${today}-weekly-briefing.md`;
  const content  = `---\nsubject: ${subject}\n---\n\n${draft}\n`;

  fs.mkdirSync(OUTBOX, { recursive: true });
  fs.writeFileSync(path.join(OUTBOX, filename), content);
  console.log(`\n✅ Draft written to newsletters/outbox/${filename}`);
  console.log('   Review and push to send.');
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
