'use client';

import { useEffect, useRef, useState } from 'react';
import type { WorkItem } from '@/lib/content';

interface WorkBandProps {
  id: 'research' | 'projects';
  title: string;
  direction: 'rtl' | 'ltr';
  items: WorkItem[];
  onOpenWindow: (item: WorkItem, triggerEl: HTMLElement | null) => void;
}

const TARGET_SPEED_PX_PER_SEC = 15;
const FALLBACK_CARD_SLOT_PX = 384; // 360px card + 24px gap
const CLONE_SET_INDICES = [1, 2, 3] as const;

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

function BandCard({
  item,
  isClone,
  onOpenWindow,
}: {
  item: WorkItem;
  isClone: boolean;
  onOpenWindow: (item: WorkItem, triggerEl: HTMLElement | null) => void;
}) {
  const triggerRef = useRef<HTMLAnchorElement & HTMLButtonElement>(null);

  const handleCardSurfaceClick = (e: React.MouseEvent<HTMLLIElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('a, button')) {
      return;
    }
    onOpenWindow(item, triggerRef.current);
  };

  return (
    <li
      className="band-card glass-surface-no-blur"
      onClick={handleCardSurfaceClick}
    >
      <div className="band-card-top">
        <span className="band-card-group">{item.group}</span>
        <span className="band-card-status">
          {item.status}
          {item.team ? ' · Team project' : ''}
        </span>
      </div>

      <h3 className="band-card-title">
        {item.level === 'full' ? (
          <a
            ref={triggerRef}
            href={`/work/${item.slug}`}
            className="band-card-link"
            tabIndex={isClone ? -1 : undefined}
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
            ref={triggerRef}
            type="button"
            className="band-card-link band-card-btn"
            tabIndex={isClone ? -1 : undefined}
            onClick={(e) => onOpenWindow(item, e.currentTarget)}
          >
            {item.title}
          </button>
        )}
      </h3>

      <p className="band-card-summary" title={item.summary}>
        {item.summary}
      </p>
    </li>
  );
}

export default function WorkBand({
  id,
  title,
  direction,
  items,
  onOpenWindow,
}: WorkBandProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const firstSetRef = useRef<HTMLUListElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const fallbackDurationSec = Math.max(
    20,
    Math.round((items.length * FALLBACK_CARD_SLOT_PX) / TARGET_SPEED_PX_PER_SEC)
  );

  useEffect(() => {
    let lastAppliedWidth = 0;

    const syncDurationIfSetWidthChanged = () => {
      const setEl = firstSetRef.current;
      const trackEl = trackRef.current;
      if (!setEl || !trackEl) return;

      const setWidth = Math.round(setEl.getBoundingClientRect().width);
      // Only set --band-duration when the canonical set width actually changes,
      // preventing CSS animation phase jumps or restarts during window resizing.
      if (setWidth > 0 && Math.abs(setWidth - lastAppliedWidth) > 1) {
        lastAppliedWidth = setWidth;
        const durationSec = setWidth / TARGET_SPEED_PX_PER_SEC;
        trackEl.style.setProperty('--band-duration', `${durationSec.toFixed(2)}s`);
      }
    };

    syncDurationIfSetWidthChanged();

    const checkHash = () => {
      if (window.location.hash === `#${id}-all`) {
        setShowAll(true);
      }
    };
    checkHash();

    window.addEventListener('resize', syncDurationIfSetWidthChanged, {
      passive: true,
    });
    window.addEventListener('hashchange', checkHash);
    return () => {
      window.removeEventListener('resize', syncDurationIfSetWidthChanged);
      window.removeEventListener('hashchange', checkHash);
    };
  }, [id, items.length]);

  const handleViewAllClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowAll((prev) => !prev);
  };

  return (
    <section
      id={id}
      className="band-section"
      aria-labelledby={`${id}-heading`}
    >
      <div className="site-shell">
        <div className="band-header" data-reveal>
          <h2 id={`${id}-heading`} className="section-title">
            {title}
          </h2>

          <div className="band-controls">
            <button
              type="button"
              className="glass-control band-pause-btn"
              onClick={() => setIsPaused((prev) => !prev)}
              aria-pressed={isPaused}
              aria-label={
                isPaused ? `Resume ${title} band drift` : `Pause ${title} band drift`
              }
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            <a
              href={`#${id}-all`}
              className="glass-control band-view-all-link"
              onClick={handleViewAllClick}
              aria-expanded={showAll}
              aria-controls={`${id}-all`}
            >
              {showAll ? 'Hide list' : 'View all'}
            </a>
          </div>
        </div>
      </div>

      {/* Full-width floating band outside the page's content container */}
      <div
        className="band-viewport"
        data-reveal
        data-reveal-index={1}
        data-direction={direction}
        data-paused={isPaused ? 'true' : 'false'}
        aria-label={`${title} floating band`}
      >
        <div
          ref={trackRef}
          className={`band-track ${
            direction === 'rtl' ? 'band-track-rtl' : 'band-track-ltr'
          }`}
          data-default-duration={fallbackDurationSec}
        >
          {/* Canonical keyboard-reachable set */}
          <ul ref={firstSetRef} className="band-set">
            {items.map((item) => (
              <BandCard
                key={item.slug}
                item={item}
                isClone={false}
                onOpenWindow={onOpenWindow}
              />
            ))}
          </ul>

          {/* Seamless loop sets for desktop drift */}
          {CLONE_SET_INDICES.map((cloneIndex) => (
            <ul
              key={cloneIndex}
              className="band-set band-set-clone"
              aria-hidden="true"
            >
              {items.map((item) => (
                <BandCard
                  key={`${item.slug}-clone-${cloneIndex}`}
                  item={item}
                  isClone={true}
                  onOpenWindow={onOpenWindow}
                />
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* Plain list view toggled by "View all" — clicking any item also opens the glass window */}
      <div
        id={`${id}-all`}
        className="site-shell band-all-wrapper"
        hidden={!showAll}
      >
        <ul className="plain-work-list" aria-label={`All ${title} items`}>
          {items.map((item) => (
            <li
              key={item.slug}
              className="plain-work-item"
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('a, button')) return;
                const trigger = e.currentTarget.querySelector<HTMLElement>(
                  'a, button'
                );
                onOpenWindow(item, trigger);
              }}
            >
              <div className="plain-work-header">
                <h3 className="plain-work-title">
                  {item.level === 'full' ? (
                    <a
                      href={`/work/${item.slug}`}
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
                      className="plain-work-btn"
                      onClick={(e) => onOpenWindow(item, e.currentTarget)}
                    >
                      {item.title}
                    </button>
                  )}
                </h3>
                <span className="work-meta">
                  {item.group} · {item.status} · {item.date}
                  {item.team ? ' · Team project' : ''}
                </span>
              </div>
              <p className="work-summary">{item.summary}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
