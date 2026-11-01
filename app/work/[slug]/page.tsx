import Link from 'next/link';
import { notFound } from 'next/navigation';
import Markdown from 'react-markdown';
import ThemeToggle from '@/components/ThemeToggle';
import TopNav from '@/components/TopNav';
import { getSiteConfig, getFullWorkItems, getFullWorkItemBySlug } from '@/lib/content';

export const dynamicParams = false;

export function generateStaticParams(): Array<{ slug: string }> {
  const fullItems = getFullWorkItems();
  return fullItems.map((item) => ({
    slug: item.slug,
  }));
}

export default async function WorkItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getFullWorkItemBySlug(slug);
  const site = getSiteConfig();

  if (!item) {
    notFound();
  }

  return (
    <>
      <header className="site-header">
        <div className="site-shell site-header-inner">
          <Link href="/" className="brand-mark">
            {site.name}
          </Link>
          <TopNav
            staticActiveId={item.kind === 'research' ? 'research' : 'projects'}
          />
          <ThemeToggle />
        </div>
      </header>

      <main className="site-shell">
        <article className="page-section case-study-prose">
          <p>
            <Link href="/">← Back to Home</Link>
          </p>
          <h1 className="section-title mb-tight">{item.title}</h1>
          <p className="work-meta mb-tight">
            <span>{item.status}</span>
            <span aria-hidden="true"> · </span>
            <span>{item.group}</span>
            <span aria-hidden="true"> · </span>
            <span>{item.date}</span>
            {item.team && (
              <>
                <span aria-hidden="true"> · </span>
                <span>Team project</span>
              </>
            )}
          </p>
          <p>{item.summary}</p>
          <p className="work-tags mb-item">{item.tags.join(' · ')}</p>
          {item.links.length > 0 && (
            <ul className="inline-link-list mb-item">
              {item.links.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <Markdown>{item.body}</Markdown>
        </article>
      </main>
    </>
  );
}
