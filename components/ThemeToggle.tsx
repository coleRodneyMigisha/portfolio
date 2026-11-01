'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'cole-portfolio-theme';

function getSystemPreferredTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  } catch {
    // Storage access blocked or unavailable
  }
  return null;
}

function applyThemeToDocument(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = readStoredTheme();
    const initialTheme: Theme = stored ?? getSystemPreferredTheme();
    setTheme(initialTheme);
    applyThemeToDocument(initialTheme);

    if (typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (event: MediaQueryListEvent) => {
      // Only follow OS changes if the user hasn't explicitly saved a choice
      if (readStoredTheme() === null) {
        const next: Theme = event.matches ? 'light' : 'dark';
        setTheme(next);
        applyThemeToDocument(next);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleToggle = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyThemeToDocument(nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage write errors in restricted browsing modes
    }
  };

  const nextLabel = theme === 'dark' ? 'Light' : 'Dark';

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="glass-control theme-toggle"
      aria-label={`Switch to ${nextLabel.toLowerCase()} colour theme (currently ${theme})`}
      aria-pressed={theme === 'light'}
    >
      Theme: {theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  );
}
