'use client';

import { useEffect } from 'react';

const STAGGER_STEP_MS = 80;

export default function ScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const reducedMotionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]')
    );

    if (elements.length === 0) {
      return;
    }

    const revealAllImmediately = () => {
      root.removeAttribute('data-reveal-ready');
      for (const el of elements) {
        el.setAttribute('data-revealed', 'true');
      }
    };

    if (reducedMotionQuery?.matches || !('IntersectionObserver' in window)) {
      revealAllImmediately();
      return;
    }

    // Apply stagger delay from data-reveal-index attribute (80ms per step)
    for (const el of elements) {
      const indexAttr = el.getAttribute('data-reveal-index');
      if (indexAttr !== null) {
        const index = parseInt(indexAttr, 10);
        if (Number.isFinite(index) && index > 0) {
          el.style.setProperty('--reveal-delay', `${index * STAGGER_STEP_MS}ms`);
        }
      }
    }

    // Elements already within or above the viewport on initial load stay visible
    const viewportCutoff = window.innerHeight * 0.94;
    const toObserve: HTMLElement[] = [];

    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.top < viewportCutoff && rect.bottom > 0) {
        el.setAttribute('data-revealed', 'true');
      } else {
        toObserve.push(el);
      }
    }

    // Activate CSS hidden state only after JS has classified initial elements
    root.setAttribute('data-reveal-ready', 'true');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.setAttribute('data-revealed', 'true');
            observer.unobserve(target);
          }
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    for (const el of toObserve) {
      observer.observe(el);
    }

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        observer.disconnect();
        revealAllImmediately();
      }
    };

    reducedMotionQuery?.addEventListener('change', handleReducedMotionChange);

    return () => {
      observer.disconnect();
      reducedMotionQuery?.removeEventListener(
        'change',
        handleReducedMotionChange
      );
    };
  }, []);

  return null;
}
