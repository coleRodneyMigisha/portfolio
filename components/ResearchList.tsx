'use client';

import type { WorkItem } from '@/lib/content';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// "2026-10" reads better as "Oct 2026"
function formatWorkDate(date: string): string {
  const match = date.match(/^(\d{4})-(\d{2})/);
  if (!match) return date;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${match[1]}` : date;
}

function isPlainLeftClick(e: React.MouseEvent<HTMLAnchorElement>): boolean {
  return (
    e.button === 0 &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.shiftKey &&
    !e.altKey &&
    !e.defaultPrevented
  );
}

interface ResearchListProps {
  items: WorkItem[];
  onOpenWindow: (item: WorkItem, triggerEl: HTMLElement | null) => void;
}

// Research reads like a paper index, so it doesn't repeat the Projects cards
export default function ResearchList({ items, onOpenWindow }: ResearchListProps) {
  return (
    <div className="site-shell">
      <section
        id="research"
        className="page-section"
        aria-labelledby="research-heading"
      >
        <div className="section-header" data-reveal>
          <h2 id="research-heading" className="section-title">
            Research
          </h2>
        </div>

        <ol className="research-list">
          {items.map((item, index) => (
            <li
              key={item.slug}
              className="research-row"
              data-reveal
              data-reveal-index={index}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('a, button')) return;
                const trigger = e.currentTarget.querySelector<HTMLElement>(
                  '[data-work-slug]'
                );
                onOpenWindow(item, trigger);
              }}
            >
              <span className="research-index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className="research-main">
                <h3 className="research-title">
                  {item.level === 'full' ? (
                    <a
                      href={`/work/${item.slug}`}
                      data-work-slug={item.slug}
                      className="research-link"
                      onClick={(e) => {
                        if (isPlainLeftClick(e)) {
                          e.preventDefault();
                          onOpenWindow(item, e.currentTarget);
                        }
                      }}
                    >
                      {item.title}
                    </a>
                  ) : (
                    <button
                      type="button"
                      data-work-slug={item.slug}
                      className="research-link research-link-btn"
                      onClick={(e) => onOpenWindow(item, e.currentTarget)}
                    >
                      {item.title}
                    </button>
                  )}
                </h3>
                <p className="research-summary">{item.summary}</p>
              </div>

              <p className="research-meta">
                <span className="research-group">{item.group}</span>
                <span>
                  {item.status}
                  {item.team ? ' · Team' : ''}
                </span>
                <span>{formatWorkDate(item.date)}</span>
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
