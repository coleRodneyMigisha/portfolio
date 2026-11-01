'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { WorkItem } from '@/lib/content';

interface WorkBandProps {
  id: 'research' | 'projects';
  title: string;
  direction: 'rtl' | 'ltr';
  items: WorkItem[];
  onOpenWindow: (item: WorkItem, triggerEl: HTMLElement | null) => void;
}

const TARGET_SPEED_PX_PER_SEC = 15;
// A laptop screen is about four times wider than a phone, so 15px/s looks still there
const WIDE_SCREEN_SPEED_PX_PER_SEC = 32;
const SLOW_DOWN_MS = 500;
const MAX_TILT_DEG = 5;
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

function isLaptopPointer(): boolean {
  return window.matchMedia(
    '(hover: hover) and (pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)'
  ).matches;
}

function BandCard({
  item,
  index,
  isClone,
  onOpenWindow,
}: {
  item: WorkItem;
  index: number;
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
      style={{ '--card-index': index } as CSSProperties}
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
            data-work-slug={item.slug}
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
            data-work-slug={item.slug}
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
  const viewportRef = useRef<HTMLDivElement | null>(null);

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
        const speed = isLaptopPointer()
          ? WIDE_SCREEN_SPEED_PX_PER_SEC
          : TARGET_SPEED_PX_PER_SEC;
        const durationSec = setWidth / speed;
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

  // On laptops the band eases to a stop under the cursor and eases away again,
  // and the card under the cursor tilts and catches the light.
  useEffect(() => {
    const viewportEl = viewportRef.current;
    const trackEl = trackRef.current;
    if (!viewportEl || !trackEl) return;

    let rate = 1;
    let rampRaf: number | null = null;
    let activeCard: HTMLElement | null = null;

    const rampTo = (target: number) => {
      if (rampRaf !== null) window.cancelAnimationFrame(rampRaf);
      const animation = trackEl.getAnimations()[0];
      if (!animation) return;

      const from = rate;
      const startedAt = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / SLOW_DOWN_MS);
        const eased = 1 - Math.pow(1 - progress, 3);
        rate = from + (target - from) * eased;
        animation.playbackRate = rate;
        rampRaf = progress < 1 ? window.requestAnimationFrame(step) : null;
      };
      rampRaf = window.requestAnimationFrame(step);
    };

    const resetCard = () => {
      if (!activeCard) return;
      activeCard.style.removeProperty('--tilt-x');
      activeCard.style.removeProperty('--tilt-y');
      activeCard = null;
    };

    const handlePointerEnter = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && isLaptopPointer()) rampTo(0);
    };

    const handlePointerLeave = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      resetCard();
      rampTo(1);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !isLaptopPointer()) return;

      const card = (event.target as HTMLElement).closest<HTMLElement>(
        '.band-card'
      );
      if (card !== activeCard) resetCard();
      if (!card) return;
      activeCard = card;

      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      card.style.setProperty('--spot-x', `${x}px`);
      card.style.setProperty('--spot-y', `${y}px`);
      card.style.setProperty(
        '--tilt-y',
        `${((x / rect.width - 0.5) * MAX_TILT_DEG * 2).toFixed(2)}deg`
      );
      card.style.setProperty(
        '--tilt-x',
        `${((0.5 - y / rect.height) * MAX_TILT_DEG * 2).toFixed(2)}deg`
      );
    };

    viewportEl.addEventListener('pointerenter', handlePointerEnter);
    viewportEl.addEventListener('pointerleave', handlePointerLeave);
    viewportEl.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });

    return () => {
      if (rampRaf !== null) window.cancelAnimationFrame(rampRaf);
      viewportEl.removeEventListener('pointerenter', handlePointerEnter);
      viewportEl.removeEventListener('pointerleave', handlePointerLeave);
      viewportEl.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  const handleToggleShowAll = () => {
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
              aria-label={
                isPaused ? `Resume ${title} band drift` : `Pause ${title} band drift`
              }
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            <button
              type="button"
              className="glass-control band-view-all-link"
              onClick={handleToggleShowAll}
              aria-expanded={showAll}
              aria-controls={`${id}-all`}
            >
              {showAll ? 'Hide list' : 'View all'}
              <span className="sr-only"> {title} items</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full-width floating band outside the page's content container */}
      <div
        ref={viewportRef}
        className="band-viewport"
        role="group"
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
            {items.map((item, index) => (
              <BandCard
                key={item.slug}
                item={item}
                index={index}
                isClone={false}
                onOpenWindow={onOpenWindow}
              />
            ))}
          </ul>

          {/* Seamless loop sets for continuous drift */}
          {CLONE_SET_INDICES.map((cloneIndex) => (
            <ul
              key={cloneIndex}
              className="band-set band-set-clone"
              aria-hidden="true"
            >
              {items.map((item, index) => (
                <BandCard
                  index={index}
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
        <ul className="plain-work-list">
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
