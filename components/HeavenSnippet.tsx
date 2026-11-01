'use client';

import { useEffect, useState } from 'react';
import heavenWords from '@/content/heaven-words.json';

const HEAVEN_WORDS: readonly string[] = heavenWords;

function shuffle(words: readonly string[]): string[] {
  const shuffled = [...words];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function HeavenSnippet() {
  const [heavenTypedText, setHeavenTypedText] = useState<string>(
    HEAVEN_WORDS[0]
  );

  useEffect(() => {
    let shuffledWords = shuffle(HEAVEN_WORDS);

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
            wordIndex += 1;
            if (wordIndex >= shuffledWords.length) {
              // Every word has had a turn, so deal a fresh order
              shuffledWords = shuffle(HEAVEN_WORDS);
              wordIndex = 0;
            }
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
      <span className="sr-only">from Heaven import grace</span>
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
