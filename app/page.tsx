import Link from 'next/link';
import {
  getSiteConfig,
  getVisibleSiteLinks,
  getStackConfig,
  getVisibleItemsByKind,
  type WorkItem,
} from '@/lib/content';

function PlainWorkItem({ item }: { item: WorkItem }) {
  return (
    <li>
      <p>
        <strong>{item.title}</strong> ({item.kind} | status: {item.status} | group:{' '}
        {item.group} | date: {item.date} | level: {item.level}
        {item.team ? ' | Team project' : ''})
      </p>
      <p>{item.summary}</p>
      <p>Tags: {item.tags.join(', ')}</p>
      {item.links.length > 0 && (
        <p>
          Links:{' '}
          {item.links.map((link, idx) => (
            <span key={link.url}>
              {idx > 0 ? ', ' : ''}
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </span>
          ))}
        </p>
      )}
      {item.level === 'full' ? (
        <p>
          <Link href={`/work/${item.slug}`}>Open full page (/work/{item.slug})</Link>
        </p>
      ) : (
        <p>Short item (opens in window only; no standalone /work/[slug] route)</p>
      )}
    </li>
  );
}

export default function HomePage() {
  const site = getSiteConfig();
  const visibleSiteLinks = getVisibleSiteLinks(site);
  const stack = getStackConfig();
  const researchItems = getVisibleItemsByKind('research');
  const projectItems = getVisibleItemsByKind('project');

  return (
    <main>
      <header>
        <h1>{site.name}</h1>
        <p>{site.tagline}</p>
        {visibleSiteLinks.length > 0 && (
          <ul>
            {visibleSiteLinks.map((link) => (
              <li key={link.key}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        )}
      </header>

      <section>
        <h2>Research</h2>
        {researchItems.length === 0 ? (
          <p>No visible research items.</p>
        ) : (
          <ul>
            {researchItems.map((item) => (
              <PlainWorkItem key={item.slug} item={item} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Projects</h2>
        {projectItems.length === 0 ? (
          <p>No visible project items.</p>
        ) : (
          <ul>
            {projectItems.map((item) => (
              <PlainWorkItem key={item.slug} item={item} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Technology Stack</h2>
        <p>
          <strong>Confident:</strong> {stack.confident.join(', ')}
        </p>
        <p>
          <strong>Used:</strong> {stack.used.join(', ')}
        </p>
        <p>
          <strong>Learning:</strong> {stack.learning.join(', ')}
        </p>
      </section>
    </main>
  );
}
