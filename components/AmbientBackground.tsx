'use client';

import { useEffect, useRef } from 'react';

// Slow drifting light behind the whole site. The drift itself is plain CSS.
// This component only adds the soft glow that trails the cursor on laptops.
export default function AmbientBackground() {
  const cursorRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const canFollow = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
    );
    if (!canFollow.matches) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let rafId: number | null = null;

    const step = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

      const settled =
        Math.abs(targetX - currentX) < 0.5 &&
        Math.abs(targetY - currentY) < 0.5;
      rafId = settled ? null : window.requestAnimationFrame(step);
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.style.opacity = '1';
      if (rafId === null) {
        rafId = window.requestAnimationFrame(step);
      }
    };

    const handlePointerLeave = () => {
      cursor.style.opacity = '0';
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', handlePointerLeave);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.removeEventListener(
        'mouseleave',
        handlePointerLeave
      );
    };
  }, []);

  return (
    <div className="ambient" aria-hidden="true">
      <span className="ambient-blob ambient-blob-1" />
      <span className="ambient-blob ambient-blob-2" />
      <span className="ambient-blob ambient-blob-3" />
      <span ref={cursorRef} className="ambient-cursor" />
      <span className="ambient-grain" />
    </div>
  );
}
