import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PortfolioView from '@/components/PortfolioView';
import {
  SITE_URL,
  getSiteConfig,
  getVisibleSiteLinks,
  getStackConfig,
  getAboutContent,
  getVisibleItemsByKind,
  getFullWorkItems,
  getFullWorkItemBySlug,
} from '@/lib/content';
import { renderFullWorkBodies } from '@/lib/markdown';

export const dynamicParams = false;

export function generateStaticParams(): Array<{ slug: string }> {
  const fullItems = getFullWorkItems();
  return fullItems.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getFullWorkItemBySlug(slug);
  const site = getSiteConfig();

  if (!item) {
    return {
      title: site.name,
    };
  }

  const pageTitle = `${item.title} | ${site.name}`;
  const canonicalUrl = `${SITE_URL}/work/${item.slug}`;
  const ogImageUrl = item.image
    ? `${SITE_URL}${item.image}`
    : `${SITE_URL}/og-image.png`;

  return {
    title: pageTitle,
    description: item.summary,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: item.summary,
      url: canonicalUrl,
      siteName: site.name,
      type: 'article',
      images: [
        {
          url: ogImageUrl,
          alt: item.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: item.summary,
      images: [ogImageUrl],
    },
  };
}

export default async function WorkItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getFullWorkItemBySlug(slug);

  if (!item) {
    notFound();
  }

  const site = getSiteConfig();
  const visibleSiteLinks = getVisibleSiteLinks(site);
  const about = getAboutContent();
  const researchItems = getVisibleItemsByKind('research');
  const projectItems = getVisibleItemsByKind('project');
  const stack = getStackConfig();
  const renderedBodies = renderFullWorkBodies([
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
      initialBubbleSlug={item.slug}
    />
  );
}
