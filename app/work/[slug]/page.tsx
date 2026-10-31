import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFullWorkItems, getFullWorkItemBySlug } from '@/lib/content';

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

  if (!item) {
    notFound();
  }

  return (
    <main>
      <p>
        <Link href="/">Back to Home (/)</Link>
      </p>
      <h1>{item.title}</h1>
      <p>
        Kind: {item.kind} | Status: {item.status} | Group: {item.group} | Date:{' '}
        {item.date}
        {item.team ? ' | Team project' : ''}
      </p>
      <p>Summary: {item.summary}</p>
      <p>Tags: {item.tags.join(', ')}</p>
      {item.links.length > 0 && (
        <ul>
          {item.links.map((link) => (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      <hr />
      <pre>{item.body}</pre>
    </main>
  );
}
