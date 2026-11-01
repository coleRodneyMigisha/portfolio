import type { Metadata } from 'next';
import PortfolioView from '@/components/PortfolioView';
import {
  SITE_URL,
  getSiteConfig,
  getVisibleSiteLinks,
  getStackConfig,
  getAboutContent,
  getVisibleItemsByKind,
} from '@/lib/content';
import { renderWorkBodies } from '@/lib/markdown';

const site = getSiteConfig();
const ogImageUrl = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  title: site.name,
  description: site.tagline,
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  openGraph: {
    title: site.name,
    description: site.tagline,
    url: `${SITE_URL}/`,
    siteName: site.name,
    type: 'website',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: site.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: site.name,
    description: site.tagline,
    images: [ogImageUrl],
  },
};

export default function HomePage() {
  const visibleSiteLinks = getVisibleSiteLinks(site);
  const about = getAboutContent();
  const researchItems = getVisibleItemsByKind('research');
  const projectItems = getVisibleItemsByKind('project');
  const stack = getStackConfig();
  const renderedBodies = renderWorkBodies([
    ...researchItems,
    ...projectItems,
  ]);

  return (
    <PortfolioView
      site={site}
      visibleSiteLinks={visibleSiteLinks}
      about={about}
      researchItems={researchItems}
      projectItems={projectItems}
      stack={stack}
      renderedBodies={renderedBodies}
      initialBubbleSlug={null}
    />
  );
}
