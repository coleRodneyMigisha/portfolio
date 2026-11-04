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
const SWIPE_START_PX = 6;
const SWIPE_GLIDE_MS = 325; // How quickly a released swipe loses speed
const SWIPE_MIN_SPEED_PX_PER_MS = 0.02;
const SWIPE_RELEASE_WINDOW_MS = 100; // A finger held still before lifting doesn't glide

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
  const [showAll, setShowAll] = useState(true);
  const firstSetRef = useRef<HTMLUListElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLUListElement | null>(null);

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
    const gridEl = gridRef.current;
    if (!viewportEl || !trackEl || !gridEl) return;

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
    gridEl.addEventListener('pointerleave', handlePointerLeave);
    gridEl.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });

    return () => {
      if (rampRaf !== null) window.cancelAnimationFrame(rampRaf);
      viewportEl.removeEventListener('pointerenter', handlePointerEnter);
      viewportEl.removeEventListener('pointerleave', handlePointerLeave);
      viewportEl.removeEventListener('pointermove', handlePointerMove);
      gridEl.removeEventListener('pointerleave', handlePointerLeave);
      gridEl.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  // On touch screens a finger scrubs the drift animation itself, so the band
  // can be swiped either way and still loops forever, then drifts on afterwards.
  useEffect(() => {
    const viewportEl = viewportRef.current;
    const trackEl = trackRef.current;
    if (!viewportEl || !trackEl) return;

    let animation: Animation | undefined;
    let pointerId: number | null = null;
    let startX = 0;
    let lastX = 0;
    let lastMoveAt = 0;
    let velocity = 0;
    let hasMoved = false;
    let glideRaf: number | null = null;
    let swallowClick = false;

    const moveBandBy = (deltaPx: number) => {
      const loopWidth = firstSetRef.current?.getBoundingClientRect().width ?? 0;
      const duration = Number(animation?.effect?.getComputedTiming().duration);
      if (!animation || !loopWidth || !duration) return;

      const sign = direction === 'rtl' ? -1 : 1;
      const time =
        Number(animation.currentTime ?? 0) +
        (sign * deltaPx * duration) / loopWidth;
      animation.currentTime = ((time % duration) + duration) % duration;
    };

    const finishSwipe = () => {
      delete viewportEl.dataset.swiping;
    };

    const glide = () => {
      let previousFrameAt = performance.now();
      const step = (now: number) => {
        const elapsed = now - previousFrameAt;
        previousFrameAt = now;
        velocity *= Math.exp(-elapsed / SWIPE_GLIDE_MS);
        moveBandBy(velocity * elapsed);

        if (Math.abs(velocity) < SWIPE_MIN_SPEED_PX_PER_MS) {
          glideRaf = null;
          finishSwipe();
        } else {
          glideRaf = window.requestAnimationFrame(step);
        }
      };
      glideRaf = window.requestAnimationFrame(step);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' || pointerId !== null) return;
      animation = trackEl.getAnimations()[0];
      if (!animation) return; // Reduced motion: the band scrolls natively

      // A tap that stops a gliding band shouldn't also open the card under it
      swallowClick = glideRaf !== null;
      if (glideRaf !== null) {
        window.cancelAnimationFrame(glideRaf);
        glideRaf = null;
      }

      pointerId = event.pointerId;
      startX = lastX = event.clientX;
      lastMoveAt = event.timeStamp;
      velocity = 0;
      hasMoved = false;
      viewportEl.dataset.swiping = 'true';
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      if (!hasMoved) {
        if (Math.abs(event.clientX - startX) < SWIPE_START_PX) return;
        hasMoved = true;
        swallowClick = true;
      }

      const deltaPx = event.clientX - lastX;
      const elapsed = event.timeStamp - lastMoveAt;
      moveBandBy(deltaPx);
      if (elapsed > 0) {
        velocity = 0.8 * (deltaPx / elapsed) + 0.2 * velocity;
      }
      lastX = event.clientX;
      lastMoveAt = event.timeStamp;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;

      const isFlick =
        hasMoved &&
        Math.abs(velocity) >= SWIPE_MIN_SPEED_PX_PER_MS &&
        event.timeStamp - lastMoveAt < SWIPE_RELEASE_WINDOW_MS;
      if (isFlick) glide();
      else finishSwipe();
    };

    // The browser took the touch over for scrolling the page up or down
    const handlePointerCancel = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      finishSwipe();
    };

    const handleClickCapture = (event: MouseEvent) => {
      if (!swallowClick) return;
      swallowClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    viewportEl.addEventListener('pointerdown', handlePointerDown);
    viewportEl.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    viewportEl.addEventListener('pointerup', handlePointerUp);
    viewportEl.addEventListener('pointercancel', handlePointerCancel);
    viewportEl.addEventListener('click', handleClickCapture, true);

    return () => {
      if (glideRaf !== null) window.cancelAnimationFrame(glideRaf);
      viewportEl.removeEventListener('pointerdown', handlePointerDown);
      viewportEl.removeEventListener('pointermove', handlePointerMove);
      viewportEl.removeEventListener('pointerup', handlePointerUp);
      viewportEl.removeEventListener('pointercancel', handlePointerCancel);
      viewportEl.removeEventListener('click', handleClickCapture, true);
    };
  }, [direction]);

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
            {!showAll && (
              <button
                type="button"
                className="glass-control band-pause-btn"
                onClick={() => setIsPaused((prev) => !prev)}
                aria-label={
                  isPaused
                    ? `Resume ${title} band drift`
                    : `Pause ${title} band drift`
                }
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            )}

            <button
              type="button"
              className="glass-control band-view-all-link"
              onClick={handleToggleShowAll}
              aria-expanded={showAll}
              aria-controls={`${id}-all`}
            >
              {showAll ? 'Hide all' : 'View all'}
              <span className="sr-only"> {title} items</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full-width floating band outside the page's content container */}
      <div
        ref={viewportRef}
        className="band-viewport"
        hidden={showAll}
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

      {/* Default grid of work cards, with floating band available via toggle */}
      <div
        id={`${id}-all`}
        className="site-shell"
        hidden={!showAll}
        data-reveal
        data-reveal-index={1}
      >
        <ul ref={gridRef} className="band-grid">
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
      </div>
    </section>
  );
}
