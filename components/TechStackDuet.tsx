'use client';

import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import type { StackConfig } from '@/lib/content';

const STEP_MS = 1000;
// Words either side of the centre; enough to fill the widest screens
const SLOTS_EACH_SIDE = 10;

interface StackWord {
  name: string;
  tier: string;
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/*
  Two lines of blurred words step in opposite directions, one word a second.
  The bottom line holds the same list in reverse, so the word in the centre
  slot is always the same on both lines: they slide together, sharpen, pulse,
  part again and the lines step on.
*/
export default function TechStackDuet({ stack }: { stack: StackConfig }) {
  const tiers = useMemo(
    () => [
      { label: 'Confident', items: stack.confident },
      { label: 'Used', items: stack.used },
      { label: 'Learning', items: stack.learning },
    ],
    [stack.confident, stack.used, stack.learning]
  );

  const words = useMemo<StackWord[]>(
    () =>
      tiers.flatMap((tier) =>
        tier.items.map((name) => ({ name, tier: tier.label }))
      ),
    [tiers]
  );

  const [step, setStep] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl || words.length === 0) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let isOnScreen = false;
    let timerId: number | null = null;

    const stop = () => {
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    const sync = () => {
      const shouldRun =
        isOnScreen && !document.hidden && !reducedMotion.matches;
      if (shouldRun && timerId === null) {
        timerId = window.setInterval(() => {
          if (document.documentElement.hasAttribute('data-modal-open')) return;
          if (stageEl.matches(':hover')) return;
          setStep((prev) => prev + 1);
        }, STEP_MS);
      } else if (!shouldRun) {
        stop();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        isOnScreen = entries[0]?.isIntersecting ?? false;
        sync();
      },
      { threshold: 0.1 }
    );
    observer.observe(stageEl);

    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reducedMotion.removeEventListener('change', sync);
    };
  }, [words.length]);

  const count = words.length;
  const offsets = useMemo(
    () =>
      Array.from(
        { length: SLOTS_EACH_SIDE * 2 + 1 },
        (_, i) => i - SLOTS_EACH_SIDE
      ),
    []
  );

  const focusWord = count > 0 ? words[mod(step, count)] : null;

  return (
    <>
      <div
        ref={stageRef}
        className={`duet-stage ${isHolding ? 'is-holding' : ''}`}
        aria-hidden="true"
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') setIsHolding(true);
        }}
        onPointerLeave={() => setIsHolding(false)}
      >
        {count > 0 && (
          <>
            {/* Top line: in order, stepping left */}
            <div className="duet-row duet-row-top">
              {offsets.map((offset) => {
                const seq = step + offset;
                return (
                  <span
                    key={seq}
                    className={`duet-word ${offset === 0 ? 'is-focus' : ''}`}
                    style={{ '--offset': offset } as CSSProperties}
                  >
                    {words[mod(seq, count)].name}
                  </span>
                );
              })}
            </div>

            {/* Bottom line: reversed, stepping right */}
            <div className="duet-row duet-row-bottom">
              {offsets.map((offset) => {
                const seq = step - offset;
                return (
                  <span
                    key={seq}
                    className={`duet-word ${offset === 0 ? 'is-focus' : ''}`}
                    style={{ '--offset': offset } as CSSProperties}
                  >
                    {words[mod(seq, count)].name}
                  </span>
                );
              })}
            </div>
          </>
        )}

        {focusWord && (
          <span key={step} className="duet-tier">
            {focusWord.tier}
          </span>
        )}
      </div>

      {/* Readable list for screen readers, and the whole view under reduced motion */}
      <div className="site-shell">
        <dl className="duet-list">
          {tiers.map((tier) => (
            <div key={tier.label} className="duet-list-group">
              <dt className="duet-list-label">{tier.label}</dt>
              <dd className="duet-list-items">{tier.items.join(' · ')}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
