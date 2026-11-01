'use client';

import { useEffect, useRef, useState } from 'react';

export type NavSectionId = 'about' | 'research' | 'projects' | 'stack';

interface NavItem {
  id: NavSectionId;
  label: string;
  href: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { id: 'about', label: 'About Me', href: '/#about' },
  { id: 'research', label: 'Research', href: '/#research' },
  { id: 'projects', label: 'Projects', href: '/#projects' },
  { id: 'stack', label: 'Technology', href: '/#stack' },
] as const;

interface LinkMetric {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TopNavProps {
  staticActiveId?: NavSectionId;
}

export default function TopNav({ staticActiveId }: TopNavProps = {}) {
  const navRef = useRef<HTMLElement | null>(null);
  const pillRef = useRef<HTMLSpanElement | null>(null);
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(() => {
    if (!staticActiveId) return null;
    const idx = NAV_ITEMS.findIndex((item) => item.id === staticActiveId);
    return idx >= 0 ? idx : null;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    let isDisposed = false;
    let rafId: number | null = null;
    let prefersReducedMotion = false;

    let linkMetrics: LinkMetric[] = [];
    let sectionTops: number[] = [];
    let hasSectionsOnPage = false;

    let targetProgress = 0;
    let currentProgress = 0;
    let targetOpacity = 0;
    let currentOpacity = 0;
    let lastActiveIdx: number | null = null;

    const reducedMotionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    if (reducedMotionQuery) {
      prefersReducedMotion = reducedMotionQuery.matches;
    }

    const staticFallbackIdx = staticActiveId
      ? NAV_ITEMS.findIndex((item) => item.id === staticActiveId)
      : -1;

    const applyPillTransform = (progress: number, opacity: number) => {
      const pillEl = pillRef.current;
      if (!pillEl || linkMetrics.length === 0) {
        if (pillEl) {
          pillEl.style.opacity = '0';
        }
        return;
      }

      const maxIdx = linkMetrics.length - 1;
      const clamped = Math.max(0, Math.min(maxIdx, progress));
      const i0 = Math.floor(clamped);
      const i1 = Math.min(maxIdx, i0 + 1);
      const frac = clamped - i0;

      const m0 = linkMetrics[i0];
      const m1 = linkMetrics[i1];
      if (!m0 || !m1) return;

      const x = m0.x + (m1.x - m0.x) * frac;
      const y = m0.y + (m1.y - m0.y) * frac;
      const w = m0.width + (m1.width - m0.width) * frac;

      pillEl.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      pillEl.style.width = `${w.toFixed(2)}px`;
      pillEl.style.opacity = opacity.toFixed(3);
    };

    const measureGeometry = () => {
      const navEl = navRef.current;
      if (!navEl) return;

      const navStyle = window.getComputedStyle(navEl);
      if (navStyle.display === 'none' || navStyle.visibility === 'hidden') {
        linkMetrics = [];
        hasSectionsOnPage = false;
        applyPillTransform(0, 0);
        return;
      }

      const nextLinkMetrics: LinkMetric[] = [];
      for (let i = 0; i < NAV_ITEMS.length; i++) {
        const linkEl = linkRefs.current[i];
        if (!linkEl) continue;
        nextLinkMetrics.push({
          x: linkEl.offsetLeft,
          y: linkEl.offsetTop,
          width: linkEl.offsetWidth,
          height: linkEl.offsetHeight,
        });
      }
      linkMetrics = nextLinkMetrics;

      const scrollY = window.scrollY || window.pageYOffset || 0;
      const nextSectionTops: number[] = [];
      let foundAll = true;

      for (let i = 0; i < NAV_ITEMS.length; i++) {
        const secEl = document.getElementById(NAV_ITEMS[i].id);
        if (!secEl) {
          foundAll = false;
          break;
        }
        const rect = secEl.getBoundingClientRect();
        nextSectionTops.push(rect.top + scrollY);
      }

      hasSectionsOnPage =
        foundAll &&
        nextSectionTops.length === NAV_ITEMS.length &&
        linkMetrics.length === NAV_ITEMS.length;
      sectionTops = nextSectionTops;
    };

    const computeScrollTargets = () => {
      // Directly opened /work/[slug] page: keep pill stable on staticActiveId (or hidden) with no errors
      if (!hasSectionsOnPage || sectionTops.length === 0) {
        if (staticFallbackIdx >= 0 && linkMetrics.length === NAV_ITEMS.length) {
          targetProgress = staticFallbackIdx;
          targetOpacity = 1;
          if (lastActiveIdx !== staticFallbackIdx) {
            lastActiveIdx = staticFallbackIdx;
            setActiveIndex(staticFallbackIdx);
          }
        } else {
          targetOpacity = 0;
          if (lastActiveIdx !== null) {
            lastActiveIdx = null;
            setActiveIndex(null);
          }
        }
        return;
      }

      const scrollY = window.scrollY || window.pageYOffset || 0;
      const vh = window.innerHeight || 800;
      const docHeight = document.documentElement.scrollHeight || vh;
      const maxScroll = Math.max(1, docHeight - vh);

      // Reading anchor point ~32% down the viewport
      let anchorY = scrollY + vh * 0.32;

      // Near the bottom of the document, smoothly bias toward the final section
      const bottomRemaining = maxScroll - scrollY;
      const lastTop = sectionTops[sectionTops.length - 1];
      if (bottomRemaining < vh * 0.25 && anchorY < lastTop) {
        const pull = 1 - Math.max(0, bottomRemaining / (vh * 0.25));
        anchorY = anchorY + (lastTop - anchorY) * pull;
      }

      const firstTop = sectionTops[0];

      // Above the first section (#about): sit on the first link and fade out cleanly in the landing hero
      if (anchorY < firstTop) {
        targetProgress = 0;
        const fadeZone = Math.max(180, vh * 0.45);
        const distAbove = firstTop - anchorY;
        const rawAlpha = 1 - Math.min(1, distAbove / fadeZone);
        targetOpacity = rawAlpha * rawAlpha;

        const nextActive = targetOpacity >= 0.45 ? 0 : null;
        if (nextActive !== lastActiveIdx) {
          lastActiveIdx = nextActive;
          setActiveIndex(nextActive);
        }
        return;
      }

      targetOpacity = 1;

      // Continuous interpolation across section intervals
      const lastIdx = sectionTops.length - 1;
      let continuousIdx = lastIdx;
      let pillIdx = lastIdx;

      for (let i = 0; i < lastIdx; i++) {
        const startY = sectionTops[i];
        const endY = sectionTops[i + 1];
        if (anchorY >= startY && anchorY <= endY) {
          const span = Math.max(1, endY - startY);
          const t = (anchorY - startY) / span;
          continuousIdx = i + Math.max(0, Math.min(1, t));
          // The pill rests on the current link, then glides over the last stretch
          const glide = Math.max(0, Math.min(1, (t - 0.6) / 0.4));
          pillIdx = i + glide * glide * (3 - 2 * glide);
          break;
        }
      }

      const nextActive = Math.max(
        0,
        Math.min(lastIdx, Math.round(continuousIdx))
      );
      if (nextActive !== lastActiveIdx) {
        lastActiveIdx = nextActive;
        setActiveIndex(nextActive);
      }

      // With prefers-reduced-motion, snap directly to the active link with no gliding
      targetProgress = prefersReducedMotion ? nextActive : pillIdx;
    };

    const tick = () => {
      if (isDisposed) {
        rafId = null;
        return;
      }

      if (prefersReducedMotion) {
        currentProgress = targetProgress;
        currentOpacity = targetOpacity;
        applyPillTransform(currentProgress, currentOpacity);
        rafId = null;
        return;
      }

      const diffProgress = targetProgress - currentProgress;
      const diffOpacity = targetOpacity - currentOpacity;

      if (Math.abs(diffProgress) > 0.0008 || Math.abs(diffOpacity) > 0.002) {
        currentProgress += diffProgress * 0.24;
        currentOpacity += diffOpacity * 0.24;
        applyPillTransform(currentProgress, currentOpacity);
        rafId = window.requestAnimationFrame(tick);
      } else {
        currentProgress = targetProgress;
        currentOpacity = targetOpacity;
        applyPillTransform(currentProgress, currentOpacity);
        rafId = null;
      }
    };

    const scheduleUpdate = (snapImmediately = false) => {
      computeScrollTargets();
      if (snapImmediately || prefersReducedMotion) {
        currentProgress = targetProgress;
        currentOpacity = targetOpacity;
        applyPillTransform(currentProgress, currentOpacity);
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
      } else if (rafId === null) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const handleScroll = () => {
      scheduleUpdate(false);
    };

    const handleResize = () => {
      measureGeometry();
      scheduleUpdate(true);
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      scheduleUpdate(true);
    };

    // Initial measurement
    measureGeometry();
    scheduleUpdate(true);

    // Recalculate when webfonts finish loading
    if ('fonts' in document && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (isDisposed) return;
        measureGeometry();
        scheduleUpdate(true);
      });
    }

    // Observe body size changes (e.g. when "View all" expands a section)
    let resizeObserver: ResizeObserver | null = null;
    if ('ResizeObserver' in window && document.body) {
      resizeObserver = new ResizeObserver(() => {
        if (isDisposed) return;
        measureGeometry();
        scheduleUpdate(false);
      });
      resizeObserver.observe(document.body);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    reducedMotionQuery?.addEventListener('change', handleReducedMotionChange);

    return () => {
      isDisposed = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      reducedMotionQuery?.removeEventListener(
        'change',
        handleReducedMotionChange
      );
    };
  }, [staticActiveId]);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: NavItem
  ) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    const targetEl = document.getElementById(item.id);
    if (!targetEl) {
      return;
    }

    e.preventDefault();
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    targetEl.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });

    try {
      window.history.pushState(null, '', `#${item.id}`);
    } catch {
      // Ignore history errors in restricted iframe contexts
    }
  };

  return (
    <nav ref={navRef} className="site-nav" aria-label="Primary navigation">
      <span
        ref={pillRef}
        className="nav-glass-pill"
        aria-hidden="true"
      />
      {NAV_ITEMS.map((item, idx) => (
        <a
          key={item.id}
          ref={(el) => {
            linkRefs.current[idx] = el;
          }}
          href={item.href}
          onClick={(e) => handleLinkClick(e, item)}
          aria-current={activeIndex === idx ? 'true' : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
