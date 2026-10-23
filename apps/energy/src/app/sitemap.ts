import type { MetadataRoute } from 'next';

const ORIGIN = 'https://energy.recallio.calecutech.com';

// Only the home page is public; everything else needs sign-in.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${ORIGIN}/`, changeFrequency: 'weekly', priority: 1 }];
}
