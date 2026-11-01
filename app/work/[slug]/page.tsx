import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PortfolioView from '@/components/PortfolioView';
import {
  getSiteConfig,
  getVisibleSiteLinks,
  getStackConfig,
  getAboutContent,
  getVisibleItemsByKind,
  getFullWorkItems,
  getFullWorkItemBySlug,
} from '@/lib/content';

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

  return {
    title: `${item.title} | ${site.name}`,
    description: item.summary,
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

  return (
    <PortfolioView
      site={site}
      visibleSiteLinks={visibleSiteLinks}
      about={about}
      researchItems={researchItems}
      projectItems={projectItems}
      stack={stack}
      initialBubbleSlug={item.slug}
    />
  );
}
