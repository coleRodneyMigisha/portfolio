import type { ReactNode } from 'react';
import Markdown from 'react-markdown';
import type { WorkItem } from '@/lib/content';

export function renderWorkBodies(
  items: WorkItem[]
): Record<string, ReactNode> {
  const rendered: Record<string, ReactNode> = {};

  for (const item of items) {
    rendered[item.slug] = (
      <Markdown
        components={{
          h1: 'h3',
          h2: 'h3',
          h3: 'h4',
          h4: 'h5',
          img: (props) => (
            <img
              {...props}
              alt={props.alt ?? ''}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ),
        }}
      >
        {item.body}
      </Markdown>
    );
  }

  return rendered;
}
