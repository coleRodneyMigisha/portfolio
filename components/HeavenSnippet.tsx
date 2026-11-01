'use client';

import { useEffect, useState } from 'react';

const HEAVEN_COMPLETIONS = [
  'praise',
  'peace',
  'paradise',
  'perfect',
  'prayer',
] as const;

export default function HeavenSnippet() {
  const [heavenTypedText, setHeavenTypedText] = useState<string>(
    HEAVEN_COMPLETIONS[0]
  );

  useEffect(() => {
    const shuffledWords = [...HEAVEN_COMPLETIONS];
    for (let i = shuffledWords.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffledWords[i];
      shuffledWords[i] = shuffledWords[j];
      shuffledWords[j] = temp;
    }

    const reducedMotionMq = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    let timerId: number | null = null;

    const clearTypingTimer = () => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
    };

    const syncHeavenAnimation = () => {
      clearTypingTimer();

      if (reducedMotionMq.matches) {
        setHeavenTypedText(shuffledWords[0]);
        return;
      }

      let wordIndex = 0;
      let charIndex = 0;
      let isDeleting = false;
      setHeavenTypedText('');

      const step = () => {
        const currentWord = shuffledWords[wordIndex];

        if (!isDeleting) {
          charIndex += 1;
          setHeavenTypedText(currentWord.slice(0, charIndex));

          if (charIndex >= currentWord.length) {
            isDeleting = true;
            timerId = window.setTimeout(step, 2400);
          } else {
            timerId = window.setTimeout(step, 230);
          }
        } else {
          charIndex -= 1;
          setHeavenTypedText(currentWord.slice(0, Math.max(0, charIndex)));

          if (charIndex <= 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % shuffledWords.length;
            timerId = window.setTimeout(step, 800);
          } else {
            timerId = window.setTimeout(step, 150);
          }
        }
      };

      timerId = window.setTimeout(step, 600);
    };

    syncHeavenAnimation();

    reducedMotionMq.addEventListener('change', syncHeavenAnimation);

    return () => {
      clearTypingTimer();
      reducedMotionMq.removeEventListener('change', syncHeavenAnimation);
    };
  }, []);

  return (
    <div className="footer-code-detail">
      <span className="sr-only">from Heaven import P</span>
      <code className="heaven-snippet-code" aria-hidden="true">
        <span className="heaven-kw">from</span> Heaven{' '}
        <span className="heaven-kw">import</span>{' '}
        <span className="heaven-word-pill">
          <span className="heaven-prefix">{heavenTypedText || '\u200B'}</span>
        </span>
      </code>
    </div>
  );
}
