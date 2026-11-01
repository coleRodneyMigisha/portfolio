import type { MetadataRoute } from 'next';
import { SITE_URL, getFullWorkItems } from '@/lib/content';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const fullItems = getFullWorkItems();

  const workEntries: MetadataRoute.Sitemap = fullItems.map((item) => ({
    url: `${SITE_URL}/work/${item.slug}`,
    lastModified: `${item.date}-01`,
  }));

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: '2026-10-31',
    },
    ...workEntries,
  ];
}
