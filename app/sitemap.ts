import { MetadataRoute } from 'next';
import { getAllInsights } from '@/lib/insights';
import { getAllBriefings } from '@/lib/briefings';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://americasoilwatch.com';
  const insightUrls: MetadataRoute.Sitemap = getAllInsights().map(i => ({
    url: `${baseUrl}/insights/${i.slug}`,
    lastModified: new Date(i.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));
  const briefingUrls: MetadataRoute.Sitemap = getAllBriefings().map(b => ({
    url: `${baseUrl}/briefings/${b.slug}`,
    lastModified: new Date(b.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [
    {
      url: `${baseUrl}/insights`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/briefings`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...insightUrls,
    ...briefingUrls,
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/supply`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/prices`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/analysis`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/methodology`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];
}
