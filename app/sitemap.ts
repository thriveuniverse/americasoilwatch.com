import { MetadataRoute } from 'next';
import { getAllInsights } from '@/lib/insights';
import { getAllBriefings } from '@/lib/briefings';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://americasoilwatch.com';

  const insightUrls: MetadataRoute.Sitemap = getAllInsights().map((i) => ({
    url: `${baseUrl}/insights/${i.slug}`,
    lastModified: new Date(i.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const briefingUrls: MetadataRoute.Sitemap = getAllBriefings().map((b) => ({
    url: `${baseUrl}/briefings/${b.slug}`,
    lastModified: new Date(b.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Auto-discover analysis articles (where Beyond the Strait, Four Doom Loops, Bundibugyo, etc. live)
  const analysisDir = path.join(process.cwd(), 'content/analysis');
  const analysisPages: MetadataRoute.Sitemap = fs.existsSync(analysisDir)
    ? fs
        .readdirSync(analysisDir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => {
          const slug = f.replace(/\.md$/, '');
          let lastModified: Date;
          try {
            const file = fs.readFileSync(path.join(analysisDir, f), 'utf-8');
            const { data } = matter(file);
            lastModified = data.date ? new Date(String(data.date)) : new Date();
          } catch {
            lastModified = new Date();
          }
          return {
            url: `${baseUrl}/analysis/${slug}`,
            lastModified,
            changeFrequency: 'monthly' as const,
            priority: 0.75,
          };
        })
    : [];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl,                                          lastModified: new Date(),                changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/prices`,                              lastModified: new Date(),                changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${baseUrl}/supply`,                              lastModified: new Date(),                changeFrequency: 'daily',   priority: 0.9 },
    { url: `${baseUrl}/fertilizer`,                          lastModified: new Date(),                changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${baseUrl}/analysis`,                            lastModified: new Date(),                changeFrequency: 'daily',   priority: 0.8 },
    { url: `${baseUrl}/insights`,                            lastModified: new Date(),                changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/briefings`,                           lastModified: new Date(),                changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${baseUrl}/reports/from-hormuz-to-hunger`,       lastModified: new Date('2026-04-30'),    changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/reports/the-fall-of-the-uk`,          lastModified: new Date('2026-04-30'),    changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/news`,                                lastModified: new Date(),                changeFrequency: 'daily',   priority: 0.7 },
    { url: `${baseUrl}/methodology`,                         lastModified: new Date(),                changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/about`,                               lastModified: new Date(),                changeFrequency: 'monthly', priority: 0.4 },
  ];

  return [...staticRoutes, ...analysisPages, ...insightUrls, ...briefingUrls];
}
