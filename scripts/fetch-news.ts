#!/usr/bin/env npx tsx
/**
 * AmericasOilWatch — News Feed Fetcher
 * =====================================
 * Fetches oil/energy RSS feeds, filters for Americas relevance,
 * optionally generates an AI summary, saves to data/news-feed.json.
 *
 * No API key required for feed fetching.
 * ANTHROPIC_API_KEY required for AI summary (uses claude-haiku for speed).
 * Run: npm run fetch:news
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
const OUTPUT_FILE = path.join(DATA_DIR, 'news-feed.json');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; AmericasOilWatch/1.0 fuel-security-monitor)',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
};

const FEEDS: { url: string; source: string; includeAll?: boolean }[] = [
  { url: 'https://oilprice.com/rss/main',                          source: 'OilPrice.com',         includeAll: true },
  { url: 'https://www.rigzone.com/news/rss/rigzone_news.aspx',     source: 'Rigzone',              includeAll: true },
  { url: 'https://www.offshore-technology.com/feed/',              source: 'Offshore Technology',  includeAll: true },
  { url: 'https://energyandcleanair.org/feed/',                    source: 'CREA' },
];

const AMERICAS_KEYWORDS = [
  'united states', 'america', 'americas', 'canada', 'mexico', 'brazil',
  'venezuela', 'colombia', 'argentina', 'ecuador', 'guyana', 'peru', 'bolivia',
  'wti', 'west texas', 'permian', 'eagle ford', 'bakken', 'marcellus', 'cushing',
  'gulf of mexico', 'gulf coast', 'keystone', 'trans-alaska', 'panama canal',
  'petrobras', 'pemex', 'exxon', 'chevron', 'spr', 'strategic petroleum',
];

const GENERAL_ENERGY_KEYWORDS = [
  'oil price', 'crude price', 'brent', 'opec', 'iea', 'eia', 'petroleum',
  'fuel supply', 'energy market', 'oil market', 'oil supply', 'oil demand',
  'crude oil', 'natural gas', 'lng', 'refinery', 'gasoline', 'diesel',
];

function isRelevant(title: string, description: string): boolean {
  const combined = (title + ' ' + description).toLowerCase();
  return AMERICAS_KEYWORDS.some(k => combined.includes(k)) ||
         GENERAL_ENERGY_KEYWORDS.some(k => combined.includes(k));
}

function categorize(title: string, description: string): string {
  const t = (title + ' ' + description).toLowerCase();
  if (t.match(/sanction|geopolit|iran|russia|opec\+?.*politic|conflict|war|tariff/)) return 'Geopolitics';
  if (t.match(/refiner|process|plant|facility|crack spread/))                        return 'Refinery';
  if (t.match(/policy|regulation|epa|department of energy|legislation|executive|congress|administration/)) return 'Policy';
  if (t.match(/pipeline|tanker|ship|route|canal|terminal|export|import|supply chain/)) return 'Supply Routes';
  if (t.match(/price|wti|brent|market|trading|futures|spot price/))                  return 'Prices';
  if (t.match(/production|output|drilling|shale|rig|exploration|reserve|barrel/))    return 'Production';
  return 'General';
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014');
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseRSS(xml: string, source: string, includeAll = false): any[] {
  const items: any[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;

  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];

    const titleMatch = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                       block.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch  = block.match(/<link>(https?:\/\/[^\s<]+)<\/link>/) ||
                       block.match(/<guid[^>]*isPermaLink="true"[^>]*>(https?:\/\/[^\s<]+)<\/guid>/) ||
                       block.match(/<guid[^>]*>(https?:\/\/[^\s<]+)<\/guid>/);
    const dateMatch  = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const descMatch  = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
                       block.match(/<description>([\s\S]*?)<\/description>/);

    if (!titleMatch || !linkMatch) continue;

    const title       = decodeEntities(titleMatch[1].trim());
    const link        = linkMatch[1].trim();
    const date        = dateMatch ? new Date(dateMatch[1].trim()).toISOString() : new Date().toISOString();
    const description = descMatch
      ? decodeEntities(stripHtml(descMatch[1])).slice(0, 280)
      : '';

    if (!includeAll && !isRelevant(title, description)) continue;

    items.push({ title, link, date, source, description, category: categorize(title, description) });
  }

  return items;
}

async function fetchFeed(url: string, source: string, includeAll = false): Promise<any[]> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
    if (!res.ok) { console.log(`  ⚠️  ${source}: HTTP ${res.status}`); return []; }
    const xml   = await res.text();
    const items = parseRSS(xml, source, includeAll);
    console.log(`  ✓ ${source}: ${items.length} articles`);
    return items;
  } catch (err: any) {
    console.log(`  ⚠️  ${source}: ${err.message}`);
    return [];
  }
}

async function generateSummary(articles: any[]): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || articles.length === 0) return null;

  const headlines = articles.slice(0, 20).map(a => `[${a.category}] ${a.title}`).join('\n');

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: `You are a senior energy analyst for AmericasOilWatch covering Western Hemisphere oil markets.
Write exactly 3 bullet points summarising the top supply-risk themes from these headlines.
Each bullet is one sentence. Start each bullet with "•". No preamble or headers.`,
        messages: [{ role: 'user', content: `Recent Americas energy headlines:\n\n${headlines}` }],
      }),
    });
    if (!res.ok) return null;
    const result = await res.json();
    return result.content?.[0]?.text?.trim() ?? null;
  } catch {
    return null;
  }
}

async function main() {
  console.log('📰 AmericasOilWatch — Fetching News Feeds');
  console.log('==========================================');

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const allArticles: any[] = [];
  for (const feed of FEEDS) {
    const items = await fetchFeed(feed.url, feed.source, feed.includeAll);
    allArticles.push(...items);
  }

  // Sort by date desc, dedupe by URL
  const seen = new Set<string>();
  const articles = allArticles
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(a => { if (seen.has(a.link)) return false; seen.add(a.link); return true; });

  console.log(`\n  Total unique articles: ${articles.length}`);

  const summary = await generateSummary(articles);
  if (summary) console.log('  ✓ AI summary generated');
  else         console.log('  ℹ️  No AI summary (set ANTHROPIC_API_KEY to enable)');

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
    lastUpdated: new Date().toISOString(),
    summary:     summary ?? null,
    count:       articles.length,
    articles,
  }, null, 2));

  console.log(`\n✅ Written to ${OUTPUT_FILE}`);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
