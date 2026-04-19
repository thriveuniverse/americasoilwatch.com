#!/usr/bin/env npx tsx
/**
 * AmericasOilWatch — AI Analysis Generator
 * ==========================================
 * Reads EIA stocks, WTI price, and Brent data then generates a
 * plain-English Americas energy security analysis via Claude.
 *
 * Usage: ANTHROPIC_API_KEY=sk-ant-xxx npx tsx scripts/generate-analysis.ts
 * Output: data/analysis.json
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
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

const DATA_DIR   = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'analysis.json');

function loadJSON<T>(filename: string): T | null {
  const p = path.join(DATA_DIR, filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

async function main() {
  console.log('🤖 AmericasOilWatch — Generating AI Analysis');
  console.log('=============================================');

  const wti      = loadJSON<any>('wti.json');
  const brent    = loadJSON<any>('brent.json');
  const usStocks = loadJSON<any>('us-stocks.json');
  const usPrices = loadJSON<any>('us-prices.json');
  const marad    = loadJSON<any>('marad-advisories.json');
  const crea     = loadJSON<any>('crea-feed.json');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('  ⚠️  No ANTHROPIC_API_KEY — writing placeholder analysis');
    const placeholder = {
      generatedAt: new Date().toISOString(),
      statusLine: 'Americas energy market data loading — analysis pending',
      overallStatus: 'watch',
      fullAnalysis: 'Analysis will be generated once the ANTHROPIC_API_KEY environment variable is set. The data pipeline is collecting WTI price, US petroleum stocks, and retail fuel price data from the EIA.',
      keyPoints: [
        'EIA data pipeline active — US stocks, WTI price, and retail prices being collected',
        'Panama Canal transit data tracked manually — editorial updates',
        'AI analysis requires ANTHROPIC_API_KEY environment variable',
      ],
      dataPeriod: wti?.weekEnding ?? 'pending',
      model: 'placeholder',
    };
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(placeholder, null, 2));
    console.log('✅ Placeholder written');
    return;
  }

  let dataContext = `## Americas Energy Data — ${new Date().toISOString().slice(0, 10)}\n\n`;

  if (wti) {
    dataContext += `### WTI Crude (primary Americas benchmark)\n`;
    dataContext += `Price: $${wti.priceUsd}/bbl (week ending ${wti.weekEnding})\n`;
    dataContext += `Change: ${wti.changePct >= 0 ? '+' : ''}${wti.changePct}%\n\n`;
  }
  if (brent) {
    dataContext += `### Brent Crude (international benchmark)\n`;
    dataContext += `Price: $${brent.priceUsd}/bbl\n`;
    dataContext += `WTI-Brent spread: $${wti ? (wti.priceUsd - brent.priceUsd).toFixed(2) : 'n/a'}\n\n`;
  }
  if (usStocks) {
    dataContext += `### US Petroleum Stocks (EIA weekly)\n`;
    dataContext += `Commercial crude: ${usStocks.crudeMb} MB (change: ${usStocks.crudeMbChange >= 0 ? '+' : ''}${usStocks.crudeMbChange} MB)\n`;
    dataContext += `Gasoline: ${usStocks.gasolineMb} MB (${usStocks.gasolineMbChange >= 0 ? '+' : ''}${usStocks.gasolineMbChange} MB)\n`;
    dataContext += `Distillates: ${usStocks.distillateMb} MB (${usStocks.distillateMbChange >= 0 ? '+' : ''}${usStocks.distillateMbChange} MB)\n`;
    dataContext += `SPR: ${usStocks.sprMb} MB\n`;
    dataContext += `US production: ${usStocks.productionKbpd} kb/d\n\n`;
  }
  if (usPrices) {
    dataContext += `### US Retail Fuel Prices\n`;
    dataContext += `Gasoline: $${usPrices.gasolineUsdGal}/gal (${usPrices.gasolineChangeUsdGal >= 0 ? '+' : ''}$${usPrices.gasolineChangeUsdGal})\n`;
    dataContext += `Diesel: $${usPrices.dieselUsdGal}/gal (${usPrices.dieselChangeUsdGal >= 0 ? '+' : ''}$${usPrices.dieselChangeUsdGal})\n\n`;
  }
  if (marad?.advisories?.length) {
    dataContext += `### Active Maritime Advisories\n`;
    dataContext += `${marad.advisories.length} relevant MARAD advisories active\n`;
    marad.advisories.slice(0, 5).forEach((a: any) => {
      dataContext += `- [${a.severity.toUpperCase()}] ${a.region}: ${a.incident}\n`;
    });
    dataContext += '\n';
  }
  if (crea?.articles?.length) {
    dataContext += `### Recent CREA Research\n`;
    crea.articles.slice(0, 3).forEach((a: any) => {
      dataContext += `- [${a.tag}] ${a.title}\n`;
    });
    dataContext += '\n';
  }

  const systemPrompt = `You are a senior energy analyst writing for AmericasOilWatch, a fuel security intelligence dashboard covering the entire Western Hemisphere from Canada to Argentina.

Your audience includes energy traders, logistics operators, policymakers, and journalists tracking Americas oil markets.

Write clear, factual analysis grounded in the data provided. Cite specific numbers. Cover the US as the dominant market, but note significant developments in Canada, Brazil, Guyana, Venezuela, and other producers where relevant.

Key context for the Americas:
- WTI (West Texas Intermediate) is the primary Americas price benchmark, set at Cushing, Oklahoma
- The Panama Canal is the critical chokepoint for tanker traffic between the Atlantic and Pacific
- The US is the world's largest oil producer at ~13.3m bpd, with shale/tight oil dominant
- Canada's oil sands (WCS) trade at a discount to WTI due to heavy grade and pipeline constraints
- Guyana (ExxonMobil Stabroek) is the fastest-growing new producer globally
- Brazil (Petrobras pre-salt) is South America's largest producer with rising output
- Venezuela has massive reserves but production collapsed under sanctions/mismanagement

Output valid JSON only — no markdown, no preamble:
{
  "statusLine": "One sentence summarising Americas energy market conditions right now",
  "overallStatus": "safe|watch|warning|critical",
  "fullAnalysis": "3-5 paragraphs covering: US market conditions, crude price context, supply route risks, notable producer developments. Separate paragraphs with \\n\\n.",
  "keyPoints": ["4-6 bullet points of the most important findings"],
  "dataPeriod": "e.g. week ending 2026-04-18"
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Analyse this Americas energy data:\n\n${dataContext}` }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const result = await res.json();
  const text = result.content?.[0]?.text ?? '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned);

  const analysis = {
    generatedAt: new Date().toISOString(),
    statusLine: parsed.statusLine,
    overallStatus: parsed.overallStatus,
    fullAnalysis: parsed.fullAnalysis,
    keyPoints: parsed.keyPoints,
    dataPeriod: parsed.dataPeriod ?? wti?.weekEnding ?? 'unknown',
    model: 'claude-sonnet-4-20250514',
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(analysis, null, 2));
  console.log(`\n✅ Analysis written — ${analysis.statusLine}`);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
