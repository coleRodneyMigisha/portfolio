'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

const TOUCH_REVEAL_MS = 6000;

// The tagline's "book" is a small secret: hovering (or a first tap on touch
// screens) swings the word open and tells the token cloud to spell the title.
export default function BookEgg({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pointerTypeRef = useRef<string | null>(null);
  const touchRevealedRef = useRef(false);
  const touchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isOpen) root.setAttribute('data-book-egg', 'true');
    else root.removeAttribute('data-book-egg');
  }, [isOpen]);

  useEffect(
    () => () => {
      document.documentElement.removeAttribute('data-book-egg');
      if (touchTimerRef.current !== null) {
        window.clearTimeout(touchTimerRef.current);
      }
    },
    []
  );

  const closeTouchReveal = () => {
    touchRevealedRef.current = false;
    setIsOpen(false);
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`book-egg ${isOpen ? 'is-open' : ''}`}
      onPointerDown={(e) => {
        pointerTypeRef.current = e.pointerType;
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setIsOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setIsOpen(false);
      }}
      onFocus={() => {
        // A tap focuses the link too, but taps are handled in onClick
        if (pointerTypeRef.current === 'touch' || pointerTypeRef.current === 'pen') {
          return;
        }
        setIsOpen(true);
      }}
      onBlur={() => {
        if (!touchRevealedRef.current) setIsOpen(false);
      }}
      onClick={(e) => {
        const pointerType = pointerTypeRef.current;
        pointerTypeRef.current = null;
        const isTouch = pointerType === 'touch' || pointerType === 'pen';
        if (!isTouch || touchRevealedRef.current) return;

        // First tap reveals the secret, the second one opens the book
        e.preventDefault();
        touchRevealedRef.current = true;
        setIsOpen(true);
        if (touchTimerRef.current !== null) {
          window.clearTimeout(touchTimerRef.current);
        }
        touchTimerRef.current = window.setTimeout(
          closeTouchReveal,
          TOUCH_REVEAL_MS
        );
      }}
    >
      <span className="book-egg-word">{children}</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
