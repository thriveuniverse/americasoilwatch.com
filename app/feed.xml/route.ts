import { getAllInsights } from '@/lib/insights';

export const revalidate = 3600;

const SITE_URL = 'https://americasoilwatch.com';
const TITLE    = 'AmericasOilWatch — Insights';
const DESC     = 'In-depth analysis of Americas oil markets, supply routes, and producer dynamics.';

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const insights = getAllInsights();
  const updated  = insights[0]?.date ?? new Date().toISOString();

  const items = insights.map(i => `
    <item>
      <title>${escape(i.title)}</title>
      <link>${SITE_URL}/insights/${i.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/insights/${i.slug}</guid>
      <pubDate>${new Date(i.date).toUTCString()}</pubDate>
      <description>${escape(i.excerpt)}</description>
      <author>jon@americasoilwatch.com (${escape(i.author)})</author>
      ${i.tags.map(t => `<category>${escape(t)}</category>`).join('')}
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(TITLE)}</title>
    <link>${SITE_URL}/insights</link>
    <description>${escape(DESC)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
