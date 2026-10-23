import type { MetadataRoute } from 'next';

const ORIGIN = process.env.PUBLIC_SITE_ORIGIN ?? 'https://pmp.calecutech.com';

// Public pages only: the study area and checkout need a licence.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${ORIGIN}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${ORIGIN}/sample`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${ORIGIN}/unlock`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
