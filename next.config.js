/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  async redirects() {
    return [
      // Headline-based URLs people/shares guess from article titles → real filename slugs.
      // Both were live 404s in Netlify's not-found report (68 and 33 hits/month).
      {
        source: '/insights/the-oil-crisis-is-not-ending-it-is-moving-downstream',
        destination: '/insights/oil-crisis-moving-downstream',
        permanent: true,
      },
      {
        source: '/insights/the-attrition-trap-who-runs-out-of-cushion-first',
        destination: '/insights/the-attrition-trap',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // Legacy static OG path: pages now use the dynamic app/opengraph-image.tsx
      // generator, but old HTML in crawler/social caches still requests this bare
      // URL. Serve the dynamic image here so /og-image.png stops 404ing.
      { source: '/og-image.png', destination: '/opengraph-image' },
    ];
  },
};

module.exports = nextConfig;
