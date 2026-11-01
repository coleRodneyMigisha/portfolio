'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Markdown from 'react-markdown';
import ThemeToggle from '@/components/ThemeToggle';
import TopNav from '@/components/TopNav';
import TokenCloud from '@/components/TokenCloud';
import WorkBand from '@/components/WorkBand';
import ScrollReveal from '@/components/ScrollReveal';
import type {
  AboutContent,
  SiteConfig,
  StackConfig,
  WorkItem,
} from '@/lib/content';

export interface VisibleSiteLink {
  key: string;
  label: string;
  value: string;
  href: string;
}

interface PortfolioViewProps {
  site: SiteConfig;
  visibleSiteLinks: VisibleSiteLink[];
  about: AboutContent;
  researchItems: WorkItem[];
  projectItems: WorkItem[];
  stack: StackConfig;
  initialBubbleSlug?: string | null;
}

type ModalState =
  | { mode: 'closed' }
  | { mode: 'window'; slug: string }
  | { mode: 'bubble'; slug: string; growFromWindow: boolean };

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

function parseWorkSlugFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/work\/([^/?#]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function PortfolioView({
  site,
  visibleSiteLinks,
  about,
  researchItems,
  projectItems,
  stack,
  initialBubbleSlug = null,
}: PortfolioViewProps) {
  const allItems = useMemo(
    () => [...researchItems, ...projectItems],
    [researchItems, projectItems]
  );

  const [modalState, setModalState] = useState<ModalState>(() =>
    initialBubbleSlug
      ? { mode: 'bubble', slug: initialBubbleSlug, growFromWindow: false }
      : { mode: 'closed' }
  );

  const triggerElementRef = useRef<HTMLElement | null>(null);
  const pushedBubbleHistoryRef = useRef<boolean>(false);
  const dialogPanelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const activeItem = useMemo(() => {
    if (modalState.mode === 'closed') return null;
    return allItems.find((item) => item.slug === modalState.slug) ?? null;
  }, [allItems, modalState]);

  const restoreFocusToTrigger = useCallback(() => {
    const triggerEl = triggerElementRef.current;
    if (triggerEl && typeof triggerEl.focus === 'function') {
      window.requestAnimationFrame(() => {
        try {
          triggerEl.focus({ preventScroll: true });
        } catch {
          triggerEl.focus();
        }
      });
    }
  }, []);

  const handleOpenWindow = useCallback(
    (item: WorkItem, triggerEl: HTMLElement | null) => {
      triggerElementRef.current = triggerEl;
      setModalState({ mode: 'window', slug: item.slug });
    },
    []
  );

  const handleExpandToBubble = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, item: WorkItem) => {
      if (!isPlainLeftClick(e)) return;
      e.preventDefault();

      setModalState({
        mode: 'bubble',
        slug: item.slug,
        growFromWindow: true,
      });

      try {
        window.history.pushState(
          { workSlug: item.slug, fromHome: true },
          '',
          `/work/${item.slug}`
        );
        pushedBubbleHistoryRef.current = true;
      } catch {
        // Ignore history errors in restricted iframe environments
      }
      document.title = `${item.title} | ${site.name}`;
    },
    [site.name]
  );

  const handleCloseModal = useCallback(() => {
    if (modalState.mode === 'closed') return;

    if (modalState.mode === 'bubble') {
      if (pushedBubbleHistoryRef.current) {
        pushedBubbleHistoryRef.current = false;
        window.history.back();
        return;
      }

      // Directly opened /work/[slug] page: update URL to "/" and reveal home page in place
      try {
        window.history.pushState(null, '', '/');
      } catch {
        // Ignore history errors
      }
      document.title = site.name;
    }

    setModalState({ mode: 'closed' });
    restoreFocusToTrigger();
  }, [modalState.mode, restoreFocusToTrigger, site.name]);

  // Handle browser Back / Forward buttons (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const slugFromUrl = parseWorkSlugFromPathname(window.location.pathname);
      if (slugFromUrl) {
        const matched = allItems.find(
          (item) => item.slug === slugFromUrl && item.level === 'full'
        );
        if (matched) {
          setModalState({
            mode: 'bubble',
            slug: matched.slug,
            growFromWindow: false,
          });
          document.title = `${matched.title} | ${site.name}`;
          return;
        }
      }

      pushedBubbleHistoryRef.current = false;
      document.title = site.name;
      setModalState({ mode: 'closed' });
      restoreFocusToTrigger();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [allItems, restoreFocusToTrigger, site.name]);

  // Sync data-modal-open attribute, scroll lock, focus entry, and focus trap
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const root = document.documentElement;
    if (modalState.mode === 'closed' || !activeItem) {
      root.removeAttribute('data-modal-open');
      return;
    }

    root.setAttribute('data-modal-open', modalState.mode);

    // Move focus into the dialog on open
    const focusTimer = window.requestAnimationFrame(() => {
      if (closeButtonRef.current) {
        try {
          closeButtonRef.current.focus({ preventScroll: true });
        } catch {
          closeButtonRef.current.focus();
        }
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCloseModal();
        return;
      }

      if (event.key === 'Tab') {
        const panel = dialogPanelRef.current;
        if (!panel) return;

        const focusables = Array.from(
          panel.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
        );

        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (event.shiftKey) {
          if (active === first || !panel.contains(active)) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !panel.contains(active)) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      root.removeAttribute('data-modal-open');
    };
  }, [activeItem, handleCloseModal, modalState.mode]);

  const stackGroups = useMemo(
    () => [
      { label: 'Confident', items: stack.confident },
      { label: 'Used', items: stack.used },
      { label: 'Learning', items: stack.learning },
    ],
    [stack.confident, stack.learning, stack.used]
  );

  const heavenCompletions = ['praise', 'peace', 'paradise', 'perfect', 'prayer'];

  const isBubbleOpen = modalState.mode === 'bubble' && activeItem !== null;
  const isWindowOpen = modalState.mode === 'window' && activeItem !== null;

  return (
    <>
      {/* Progressive SVG refraction filter used only when @supports matches */}
      <svg
        className="sr-only-svg"
        aria-hidden="true"
        width="0"
        height="0"
        focusable="false"
      >
        <defs>
          <filter id="glass-edge-refraction" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <ScrollReveal />

      <div
        className={`home-backdrop-wrapper ${
          isBubbleOpen ? 'home-backdrop-dimmed' : ''
        }`}
        aria-hidden={isWindowOpen || isBubbleOpen ? 'true' : undefined}
      >
        <header className="site-header">
          <div className="site-shell site-header-inner">
            <Link href="/" className="brand-mark">
              {site.name}
            </Link>
            <TopNav />
            <ThemeToggle />
          </div>
        </header>

        <main>
          {/* 1. Landing (Full-viewport screen — no scroll reveal applied) */}
          <section
            id="landing"
            className="landing-section"
            aria-labelledby="hero-heading"
          >
            <TokenCloud />
            <div className="landing-content">
              <h1 id="hero-heading" className="hero-name">
                {site.name}
              </h1>
              <p className="hero-tagline">{site.tagline}</p>
            </div>
          </section>

          {/* 2. About Me */}
          <div className="site-shell">
            <section
              id="about"
              className="page-section"
              aria-labelledby="about-heading"
            >
              <div className="section-header" data-reveal>
                <h2 id="about-heading" className="section-title">
                  About Me
                </h2>
              </div>

              <div className="about-grid">
                <div className="case-study-prose">
                  {about.aboutParagraphs.map((paragraph, index) => (
                    <p key={index} data-reveal data-reveal-index={index}>
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div>
                  <div className="about-subsection">
                    <h3 className="about-subsection-title" data-reveal>
                      Experience
                    </h3>
                    <ul className="clean-list">
                      {about.experience.map((entry, index) => (
                        <li key={entry} data-reveal data-reveal-index={index}>
                          {entry}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="about-subsection">
                    <h3 className="about-subsection-title" data-reveal>
                      Achievements
                    </h3>
                    <ul className="clean-list">
                      {about.achievements.map((entry, index) => (
                        <li key={entry} data-reveal data-reveal-index={index}>
                          {entry}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="about-subsection">
                    <h3 className="about-subsection-title" data-reveal>
                      Education
                    </h3>
                    <ul className="clean-list">
                      {about.education.map((entry, index) => (
                        <li key={entry} data-reveal data-reveal-index={index}>
                          {entry}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 3. Research band (Full-width outside content container, drifts right to left) */}
          <WorkBand
            id="research"
            title="Research"
            direction="rtl"
            items={researchItems}
            onOpenWindow={handleOpenWindow}
          />

          {/* 4. Projects band (Full-width outside content container, drifts left to right) */}
          <WorkBand
            id="projects"
            title="Projects"
            direction="ltr"
            items={projectItems}
            onOpenWindow={handleOpenWindow}
          />

          {/* 5. Technology marquee */}
          <section
            id="stack"
            className="stack-section"
            aria-labelledby="stack-heading"
          >
            <div className="site-shell">
              <div className="section-header" data-reveal>
                <h2 id="stack-heading" className="section-title">
                  Technology
                </h2>
              </div>
            </div>

            <div
              className="stack-marquee-viewport"
              tabIndex={0}
              role="region"
              aria-label="Technology stack"
              data-reveal
            >
              <div className="stack-marquee-track">
                {[0, 1].map((copyIndex) => {
                  const isClone = copyIndex > 0;
                  return (
                    <div
                      key={copyIndex}
                      className={`stack-marquee-set ${
                        isClone ? 'stack-marquee-clone' : ''
                      }`}
                      aria-hidden={isClone ? 'true' : undefined}
                    >
                      {stackGroups.map((group) => (
                        <div key={group.label} className="stack-marquee-group">
                          <span className="stack-marquee-group-label">
                            {group.label}
                          </span>
                          <ul className="stack-marquee-list">
                            {group.items.map((tech) => (
                              <li key={tech} className="stack-marquee-item">
                                {tech}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>

        {/* 6. Footer */}
        <footer className="site-footer" data-reveal>
          <div className="site-shell site-footer-inner">
            <div className="site-footer-top">
              <p className="footer-brand">{site.name}</p>
              <ul className="inline-link-list" aria-label="Profile and contact links">
                {visibleSiteLinks.map((link) => (
                  <li key={link.key}>
                    <a
                      href={link.href}
                      target={link.key === 'email' ? undefined : '_blank'}
                      rel={
                        link.key === 'email' ? undefined : 'noopener noreferrer'
                      }
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-code-detail">
              <div
                className="heaven-snippet-trigger"
                tabIndex={0}
                aria-label="Python import note: from Heaven import P, with autocomplete suggestions"
                aria-describedby="heaven-autocomplete-list"
              >
                <code className="heaven-snippet-code">
                  <span className="heaven-kw">from</span> Heaven{' '}
                  <span className="heaven-kw">import</span>{' '}
                  <span className="heaven-prefix">P</span>
                </code>

                <ul
                  id="heaven-autocomplete-list"
                  className="heaven-autocomplete"
                  aria-label="Autocomplete suggestions"
                >
                  {heavenCompletions.map((word) => (
                    <li key={word} className="heaven-autocomplete-item">
                      <span className="heaven-match">{word.slice(0, 1)}</span>
                      <span>{word.slice(1)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Glass Window or Full-Story Bubble Dialog */}
      {activeItem && modalState.mode !== 'closed' && (
        <div
          className={`modal-scrim ${
            modalState.mode === 'bubble'
              ? 'modal-scrim-bubble'
              : 'modal-scrim-window'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div
            ref={dialogPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="work-dialog-title"
            className={
              modalState.mode === 'bubble'
                ? `work-bubble-panel ${
                    modalState.growFromWindow ? 'work-bubble-grow' : ''
                  }`
                : 'work-glass-window'
            }
          >
            <div
              className={
                modalState.mode === 'bubble'
                  ? 'work-bubble-inner'
                  : 'work-window-tinted-layer'
              }
            >
              <div className="work-dialog-topbar">
                <p className="work-meta">
                  <span className="band-card-group">{activeItem.group}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{activeItem.status}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{activeItem.date}</span>
                  {activeItem.team && (
                    <>
                      <span aria-hidden="true"> · </span>
                      <span>Team project</span>
                    </>
                  )}
                </p>

                <button
                  ref={closeButtonRef}
                  type="button"
                  className="glass-control work-dialog-close"
                  onClick={handleCloseModal}
                  aria-label="Close window"
                >
                  Close
                </button>
              </div>

              <h2
                id="work-dialog-title"
                className={
                  modalState.mode === 'bubble'
                    ? 'work-bubble-title'
                    : 'work-window-title'
                }
              >
                {activeItem.title}
              </h2>

              <p className="work-dialog-summary">{activeItem.summary}</p>

              {activeItem.image.trim().length > 0 && (
                <div className="work-dialog-image-frame">
                  <img
                    src={activeItem.image}
                    alt={activeItem.title}
                    className="work-dialog-image"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {activeItem.tags.length > 0 && (
                <p className="work-tags">
                  {activeItem.tags.join(' · ')}
                </p>
              )}

              {modalState.mode === 'window' ? (
                <div className="work-dialog-actions">
                  {activeItem.level === 'full' && (
                    <a
                      href={`/work/${activeItem.slug}`}
                      className="glass-control work-full-story-cta"
                      onClick={(e) => handleExpandToBubble(e, activeItem)}
                    >
                      Read the full story
                    </a>
                  )}

                  {activeItem.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-control"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : (
                <>
                  <div className="work-bubble-divider" />
                  <article className="case-study-prose work-bubble-markdown">
                    <Markdown>{activeItem.body}</Markdown>
                  </article>

                  {activeItem.links.length > 0 && (
                    <div className="work-dialog-actions work-bubble-links">
                      {activeItem.links.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-control"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
