import type { MetadataRoute } from 'next';

const ORIGIN = process.env.PUBLIC_SITE_ORIGIN ?? 'https://pmp.calecutech.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/study'] }],
    sitemap: `${ORIGIN}/sitemap.xml`,
  };
}
