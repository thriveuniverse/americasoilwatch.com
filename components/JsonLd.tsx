/**
 * AmericasOilWatch — JSON-LD Structured Data
 * ============================================
 * Rich structured data for Google, Bing, and AI crawlers.
 * Includes: WebSite, Organization, Dataset, WebApplication schemas.
 */

interface JsonLdProps {
  type: 'home' | 'supply' | 'prices' | 'about' | 'methodology' | 'article';
  // article-specific (analysis / insights / briefings)
  articleTitle?: string;
  articleDescription?: string;
  articleDate?: string;
  articleAuthor?: string;
  articlePath?: string; // e.g. "/insights/slug"
  sectionName?: string; // "Analysis" | "Insights" | "Briefings"
  sectionPath?: string; // e.g. "/insights"
}

export default function JsonLd({
  type,
  articleTitle,
  articleDescription,
  articleDate,
  articleAuthor,
  articlePath,
  sectionName,
  sectionPath,
}: JsonLdProps) {
  const baseUrl = 'https://americasoilwatch.com';

  const organization = {
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'AmericasOilWatch',
    url: baseUrl,
    description: 'Independent Western Hemisphere oil and fuel security intelligence dashboard',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'jon@americasoilwatch.com',
      contactType: 'customer service',
    },
  };

  const webSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: 'AmericasOilWatch',
    url: baseUrl,
    description: 'WTI crude price, US petroleum stocks, producer snapshots, and supply route risk across the Western Hemisphere — Canada to Patagonia.',
    publisher: { '@id': `${baseUrl}/#organization` },
    inLanguage: 'en',
  };

  const dataset = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Americas Oil Market Data',
    description: 'Weekly WTI crude price, US commercial petroleum stocks, US retail fuel prices, and producer snapshots for 12 Western Hemisphere countries. Sources: EIA, Stooq, MARAD.',
    url: baseUrl,
    creator: organization,
    temporalCoverage: '2026/..',
    spatialCoverage: {
      '@type': 'Place',
      name: 'Western Hemisphere',
      geo: {
        '@type': 'GeoShape',
        box: '-56.0 -82.0 83.0 -34.0',
      },
    },
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: `${baseUrl}/data/wti.json`,
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: `${baseUrl}/data/us-stocks.json`,
      },
    ],
    variableMeasured: [
      {
        '@type': 'PropertyValue',
        name: 'WTI crude oil price',
        unitText: 'USD per barrel',
        description: 'Weekly WTI spot price at Cushing, Oklahoma',
      },
      {
        '@type': 'PropertyValue',
        name: 'US commercial crude stocks',
        unitText: 'million barrels',
        description: 'Weekly US commercial crude oil inventory from EIA',
      },
      {
        '@type': 'PropertyValue',
        name: 'US retail fuel prices',
        unitText: 'USD per US gallon',
        description: 'Weekly US national average gasoline and diesel prices',
      },
    ],
    isBasedOn: [
      {
        '@type': 'Dataset',
        name: 'EIA Weekly Petroleum Status Report',
        description: 'US Energy Information Administration weekly crude oil and petroleum-product inventories, production and refinery data.',
        url: 'https://www.eia.gov/petroleum/supply/weekly/',
      },
      {
        '@type': 'Dataset',
        name: 'EIA Weekly Retail Gasoline and Diesel Prices',
        description: 'US Energy Information Administration weekly national and regional average retail gasoline and diesel prices.',
        url: 'https://www.eia.gov/petroleum/gasdiesel/',
      },
    ],
  };

  const webApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AmericasOilWatch Dashboard',
    url: baseUrl,
    applicationCategory: 'ReferenceApplication',
    operatingSystem: 'Any',
    description: 'Western Hemisphere oil market intelligence dashboard with AI-powered analysis',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    creator: organization,
  };

  const schemas: object[] = [];

  if (type === 'home') {
    schemas.push(webSite, dataset, webApp, {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'AmericasOilWatch — Western Hemisphere Oil & Fuel Intelligence',
      description: 'WTI crude price, US petroleum stocks, producer snapshots, and supply route risk across the Americas — Canada to Patagonia.',
      url: baseUrl,
      isPartOf: { '@id': `${baseUrl}/#website` },
      about: { '@type': 'Thing', name: 'Americas oil market intelligence' },
    });
  }

  if (type === 'supply') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Americas Oil Supply Routes | AmericasOilWatch',
      description: 'Status of the Panama Canal, Gulf of Mexico, Straits of Florida, Magellan Strait, and other critical chokepoints affecting Western Hemisphere fuel supply.',
      url: `${baseUrl}/supply`,
      isPartOf: { '@id': `${baseUrl}/#website` },
    });
  }

  if (type === 'prices') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Americas Fuel Prices | AmericasOilWatch',
      description: 'WTI benchmark, US retail gasoline and diesel prices, and Americas price context from Canada to Argentina.',
      url: `${baseUrl}/prices`,
      isPartOf: { '@id': `${baseUrl}/#website` },
    });
  }

  if (type === 'methodology') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'AmericasOilWatch Methodology',
      description: 'How AmericasOilWatch collects and presents WTI price, US petroleum stocks, and Americas producer data from EIA and other sources.',
      url: `${baseUrl}/methodology`,
      author: organization,
    });
  }

  if (type === 'about') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About AmericasOilWatch',
      description: 'About AmericasOilWatch — an independent Western Hemisphere oil and fuel security intelligence dashboard.',
      url: `${baseUrl}/about`,
      mainEntity: organization,
    });
  }

  if (type === 'article' && articleTitle && articlePath) {
    const url = `${baseUrl}${articlePath}`;

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: articleTitle,
      description: articleDescription,
      datePublished: articleDate,
      dateModified: articleDate,
      author: { '@type': 'Person', name: articleAuthor ?? 'AmericasOilWatch' },
      publisher: { '@type': 'Organization', name: 'AmericasOilWatch', url: baseUrl },
      image: `${baseUrl}/og-image.png`,
      mainEntityOfPage: url,
      url,
    });

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
        {
          '@type': 'ListItem',
          position: 2,
          name: sectionName ?? 'Analysis',
          item: `${baseUrl}${sectionPath ?? '/analysis'}`,
        },
        { '@type': 'ListItem', position: 3, name: articleTitle, item: url },
      ],
    });
  }

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
