import PortfolioView from '@/components/PortfolioView';
import {
  getSiteConfig,
  getVisibleSiteLinks,
  getStackConfig,
  getAboutContent,
  getVisibleItemsByKind,
} from '@/lib/content';

export default function HomePage() {
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
      initialBubbleSlug={null}
    />
  );
}
